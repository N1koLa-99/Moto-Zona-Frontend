const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 5501);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".mp4": "video/mp4",
  ".webp": "image/webp"
};

const DEV_SERVER_MARKER = "<script>window.__MOTO_ZONA_DEV_SERVER__=true;</script>";

function sendText(response, statusCode, contentType, body) {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

function sendFile(response, absolutePath, options = {}) {
  fs.readFile(absolutePath, options.encoding || null, (error, fileBuffer) => {
    if (error) {
      sendText(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = options.contentType || MIME_TYPES[ext] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fileBuffer);
  });
}

function sendHtmlWithBase(response, fileName) {
  const absolutePath = path.join(ROOT_DIR, fileName);

  fs.readFile(absolutePath, "utf8", (error, html) => {
    if (error) {
      sendText(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }

    const htmlWithMarker = injectDevServerMarker(html);
    const injectedHtml = htmlWithMarker.includes("<base ")
      ? htmlWithMarker
      : htmlWithMarker.replace("<head>", "<head>\n  <base href=\"/\" />");

    sendText(response, 200, "text/html; charset=utf-8", injectedHtml);
  });
}

function sendHtmlFile(response, fileName) {
  const absolutePath = path.join(ROOT_DIR, fileName);

  fs.readFile(absolutePath, "utf8", (error, html) => {
    if (error) {
      sendText(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }

    sendText(response, 200, "text/html; charset=utf-8", injectDevServerMarker(html));
  });
}

function injectDevServerMarker(html) {
  if (html.includes("__MOTO_ZONA_DEV_SERVER__")) {
    return html;
  }

  return html.replace("<head>", `<head>\n  ${DEV_SERVER_MARKER}`);
}

function resolveStaticPath(pathname) {
  const sanitizedPath = pathname.replace(/^\/+/, "");
  const absolutePath = path.resolve(ROOT_DIR, sanitizedPath);
  const normalizedRoot = `${path.resolve(ROOT_DIR)}${path.sep}`;

  if (absolutePath !== path.resolve(ROOT_DIR) && !absolutePath.startsWith(normalizedRoot)) {
    return null;
  }

  return absolutePath;
}

function handleSeoRoute(response, routeValue) {
  if (!routeValue) {
    sendHtmlWithBase(response, "index.html");
    return;
  }

  if (/^\d+$/.test(routeValue)) {
    sendHtmlWithBase(response, "ListingDetails.html");
    return;
  }

  sendHtmlWithBase(response, "index.html");
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === "/" || pathname === "/index.html" || pathname === "/obiavi") {
    sendHtmlFile(response, "index.html");
    return;
  }

  if (pathname.startsWith("/obiavi/")) {
    const routeValue = pathname.slice("/obiavi/".length).split("/")[0] || "";
    handleSeoRoute(response, routeValue);
    return;
  }

  if (pathname.startsWith("/share/")) {
    const listingId = pathname.slice("/share/".length).split("/")[0] || "";

    if (/^\d+$/.test(listingId)) {
      response.writeHead(302, {
        Location: `https://motomarketapi.azurewebsites.net/api/listings/${listingId}/og`
      });
      response.end();
      return;
    }
  }

  const absolutePath = resolveStaticPath(pathname);
  if (!absolutePath) {
    sendText(response, 403, "text/plain; charset=utf-8", "Forbidden");
    return;
  }

  fs.stat(absolutePath, (error, stats) => {
    if (error) {
      sendText(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(absolutePath, "index.html");
      if (fs.existsSync(indexPath)) {
        sendHtmlFile(response, path.relative(ROOT_DIR, indexPath));
        return;
      }

      sendText(response, 403, "text/plain; charset=utf-8", "Forbidden");
      return;
    }

    if (path.extname(absolutePath).toLowerCase() === ".html") {
      sendHtmlFile(response, path.relative(ROOT_DIR, absolutePath));
      return;
    }

    sendFile(response, absolutePath);
  });
});

server.listen(PORT, () => {
  console.log(`Moto Zona dev server is running at http://127.0.0.1:${PORT}`);
});
