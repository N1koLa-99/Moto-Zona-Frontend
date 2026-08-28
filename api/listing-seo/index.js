/**
 * Azure Static Web Apps managed function: server-side SEO for /obiavi/{id}
 * (and /share/{id}).
 *
 * Social crawlers (Facebook, Twitter/X, LinkedIn) do NOT execute JavaScript,
 * so the client-side meta in ListingDetails.js never reaches them. This
 * function returns the normal ListingDetails.html page (so real users get the
 * full interactive app) with the correct SEO tags baked into <head>.
 *
 * The Open Graph tags — including the generated OG image — are taken from the
 * backend's own endpoint /api/listings/{id}/og (single source of truth). Only
 * og:url and the canonical link are overridden to the public moto-zona.com URL.
 * JSON-LD (Product/Offer, for Google rich results) is built from the listing
 * JSON. Every remote call degrades gracefully.
 *
 * Routing lives in staticwebapp.config.json (/obiavi/* and /share/* rewrite to
 * /api/listing-seo). The original path arrives in x-ms-original-url.
 */
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://moto-zona.com").replace(/\/+$/, "");
const API_BASE_URL = (process.env.API_BASE_URL || "https://motomarketapi.azurewebsites.net").replace(/\/+$/, "");

function cleanText(value) {
  const s = String(value == null ? "" : value).trim();
  return s ? s : null;
}

function decodeEntities(value) {
  return String(value == null ? "" : value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attrEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSeoPrice(listing) {
  const amount = Number(
    listing.displayPrice != null ? listing.displayPrice
      : listing.priceEUR != null ? listing.priceEUR
      : listing.priceOriginal != null ? listing.priceOriginal
      : 0
  );
  const code = String(listing.displayCurrencyCode || listing.currencyCode || "EUR").toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const rounded = Math.round(amount);
  return { amount: rounded, code, text: `${rounded} ${code}` };
}

function buildSeoTitle(listing) {
  const title = cleanText(listing.title) || "Обява";
  const year = cleanText(listing.vehicleYear);
  const price = getSeoPrice(listing);
  const head = [title, year].filter(Boolean).join(" ");
  const left = price ? `${head} — ${price.text}` : head;
  return `${left} | Мото Зона`;
}

function buildLocation(listing) {
  const parts = [listing.cityName, listing.regionName, listing.countryName].map(cleanText).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function buildDescription(listing) {
  const type = cleanText([listing.subCategoryName, listing.subCategory2Name].filter(Boolean).join(" / "));
  const price = getSeoPrice(listing);
  const summary = [cleanText(listing.title), type, buildLocation(listing), price ? price.text : null]
    .filter(Boolean)
    .join(" | ");
  return summary || "Разгледай детайли за обява в Мото Зона.";
}

function buildJsonLd(listing, canonicalUrl, imageUrl, description) {
  const price = getSeoPrice(listing);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: cleanText(listing.title) || "Обява",
    description,
    url: canonicalUrl
  };
  if (imageUrl) data.image = [imageUrl];
  const category = cleanText([listing.subCategoryName, listing.subCategory2Name].filter(Boolean).join(" / "));
  if (category) data.category = category;
  if (listing.id != null) data.sku = String(listing.id);
  if (price) {
    data.offers = {
      "@type": "Offer",
      price: price.amount,
      priceCurrency: price.code,
      availability: "https://schema.org/InStock",
      url: canonicalUrl
    };
  }
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function extractOgMeta(html) {
  const map = {};
  const re = /<meta\s+(?:property|name)="(og:[\w:]+|twitter:[\w:]+|description)"\s+content="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (map[m[1]] === undefined) map[m[1]] = decodeEntities(m[2]);
  }
  return map;
}

function setMeta(html, attr, key, value) {
  if (value == null || value === "") return html;
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i");
  if (re.test(html)) return html.replace(re, `$1${attrEscape(value)}$2`);
  return html.replace(/<\/head>/i, `  <meta ${attr}="${key}" content="${attrEscape(value)}" />\n</head>`);
}

function injectSeo(html, id, listing, og) {
  const canonical = `${SITE_ORIGIN}/obiavi/${encodeURIComponent(id)}`;
  const title = og["og:title"] || (listing ? cleanText(listing.title) : null) || "Обява";
  const pageTitle = listing ? buildSeoTitle(listing) : `${title} | Мото Зона`;
  const description = og["og:description"] || (listing ? buildDescription(listing) : null) || "Разгледай детайли за обява в Мото Зона.";
  const image = og["og:image"] || (listing ? resolveImage(listing) : null);
  const imageAlt = og["og:image:alt"] || title;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${attrEscape(pageTitle)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:type", "product");
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:image", image);
  html = setMeta(html, "property", "og:image:alt", imageAlt);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image", image);
  html = setMeta(html, "name", "twitter:image:alt", imageAlt);

  if (/<link\s+rel="canonical"/i.test(html)) {
    html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/i, `$1${attrEscape(canonical)}$2`);
  } else {
    html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${attrEscape(canonical)}" />\n</head>`);
  }

  if (listing) {
    const ld = `  <script type="application/ld+json" id="seo-jsonld">${buildJsonLd(listing, canonical, image, description)}</script>\n</head>`;
    html = html.replace(/<\/head>/i, ld);
  }

  return html;
}

function resolveImage(listing) {
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const main = photos.find((p) => p && p.isMain) || photos[0];
  const raw = (main && (main.fileUrl || main.url)) || "ImagesVideos/LogoMotoZonaNew.png";
  try {
    return new URL(raw, `${SITE_ORIGIN}/`).toString();
  } catch {
    return `${SITE_ORIGIN}/ImagesVideos/LogoMotoZonaNew.png`;
  }
}

async function fetchText(url, accept) {
  const res = await fetch(url, { headers: { Accept: accept } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

module.exports = async function (context, req) {
  const originalUrl = req.headers["x-ms-original-url"] || req.headers["x-ms-original-uri"] || req.url || "";
  let id = null;
  try {
    const m = new URL(originalUrl, SITE_ORIGIN).pathname.match(/\/(?:obiavi|share)\/(\d+)/i);
    if (m) id = m[1];
  } catch (_) {}

  let html;
  try {
    html = await fetchText(`${SITE_ORIGIN}/ListingDetails.html`, "text/html");
  } catch (e) {
    context.log("Template fetch failed:", e.message);
    context.res = { status: 302, headers: { Location: `${SITE_ORIGIN}/ListingDetails.html${id ? `?id=${id}` : ""}` } };
    return;
  }

  if (id) {
    let og = {};
    let listing = null;
    try {
      og = extractOgMeta(await fetchText(`${API_BASE_URL}/api/listings/${id}/og`, "text/html"));
    } catch (e) {
      context.log("OG endpoint fetch failed:", e.message);
    }
    try {
      const data = await fetchJson(`${API_BASE_URL}/api/listings/public/${id}?incrementView=false`);
      if (data && data.id != null) listing = data;
    } catch (e) {
      context.log("Listing fetch failed:", e.message);
    }
    if (Object.keys(og).length || listing) {
      try {
        html = injectSeo(html, id, listing, og);
      } catch (e) {
        context.log("injectSeo failed:", e.message);
      }
    }
  }

  context.res = {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    body: html
  };
};
