#!/usr/bin/env node
/**
 * Generates sitemap.xml for moto-zona.com, including every active listing.
 * Runs at deploy time (GitHub Actions), where the public API is reachable.
 * On any failure it keeps the existing committed sitemap.xml and does NOT
 * fail the deploy.
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

async function fetchAllListings() {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API_BASE_URL}/api/listings/public?page=${page}&pageSize=${PAGE_SIZE}&sortBy=newest`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API responded ${res.status} on page ${page}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    for (const it of items) {
      if (it && it.id != null) {
        rows.push({ id: it.id, lastmod: isoDate(it.updatedAt || it.publishedAt || it.createdAt) });
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
    const listings = await fetchAllListings();
    const xml = buildXml(listings);
    fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), xml, "utf8");
    console.log(`sitemap.xml written: ${listings.length} listings + ${STATIC_PATHS.length} static URLs`);
  } catch (error) {
    console.error("Sitemap generation failed, keeping existing sitemap.xml:", error.message);
    process.exit(0);
  }
})();
