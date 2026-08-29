#!/usr/bin/env node
/**
 * Generates sitemap.xml for moto-zona.com, including every active listing.
 * Runs at deploy time (GitHub Actions), where the public API is reachable.
 *
 * The backend App Service can be cold on the first request, so each call is
 * retried with exponential backoff (this also warms it up). If pagination
 * fails partway, whatever was already collected is still written. On total
 * failure the existing committed sitemap.xml is kept and the deploy is NOT
 * failed.
 *
 * Override via env: SITE_ORIGIN, API_BASE_URL.
 */
const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://moto-zona.com").replace(/\/+$/, "");
const API_BASE_URL = (process.env.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");
const PAGE_SIZE = 200;
const MAX_PAGES = 100;

const STATIC_PATHS = [
  "/",
  "/obiavi/motori",
  "/obiavi/ekipirovka",
  "/obiavi/chasti",
  "/obiavi/aksesoari",
  "/about.html",
  "/PrivacyPolicy.html"
];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, { retries = 4, timeoutMs = 25000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res.json();
      lastError = new Error(`HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 429) throw lastError;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
    }
    if (attempt < retries) {
      const delay = Math.min(2000 * 2 ** attempt, 20000);
      console.log(`  retry ${attempt + 1}/${retries} in ${delay}ms (${lastError.message})`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function fetchAllListings() {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API_BASE_URL}/api/listings/public?page=${page}&pageSize=${PAGE_SIZE}&sortBy=newest`;
    let data;
    try {
      data = await fetchJsonWithRetry(url, { retries: page === 1 ? 6 : 3, timeoutMs: 25000 });
    } catch (error) {
      console.error(`  page ${page} failed after retries (${error.message}); using ${rows.length} collected so far`);
      break;
    }
    const items = Array.isArray(data.items) ? data.items : [];
    for (const it of items) {
      if (it && it.id != null) {
        rows.push({ id: it.id, lastmod: isoDate(it.publishedAt || it.lastRefreshAt || it.updatedAt || it.createdAt) });
      }
    }
    totalPages = Math.min(Number(data.totalPages) || 1, MAX_PAGES);
    page += 1;
  } while (page <= totalPages);
  return rows;
}

function buildXml(listings) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const p of STATIC_PATHS) urls.push({ loc: `${SITE_ORIGIN}${p}`, lastmod: today });
  for (const l of listings) {
    urls.push({ loc: `${SITE_ORIGIN}/obiavi/${encodeURIComponent(l.id)}`, lastmod: l.lastmod || today });
  }
  const body = urls
    .map((u) => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

(async () => {
  try {
    console.log(`Fetching listings from ${API_BASE_URL} ...`);
    const listings = await fetchAllListings();
    if (!listings.length) {
      console.error("No listings fetched — keeping existing committed sitemap.xml.");
      process.exit(0);
    }
    fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), buildXml(listings), "utf8");
    console.log(`sitemap.xml written: ${listings.length} listings + ${STATIC_PATHS.length} static URLs`);
  } catch (error) {
    console.error("Sitemap generation failed, keeping existing sitemap.xml:", error.message);
    process.exit(0);
  }
})();
