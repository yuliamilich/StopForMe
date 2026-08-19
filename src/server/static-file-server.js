import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

export function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

export function sendNotFound(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

export async function serveStatic({ request, response, rootDir }) {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = requestUrl.pathname === "/" ? "/index.html" : decodeURIComponent(requestUrl.pathname);
  const filePath = resolve(rootDir, `.${pathname}`);

  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    sendNotFound(response);
    return;
  }

  const contentType = contentTypes[extname(filePath)] || "application/octet-stream";
  const content = await readFile(filePath);
  response.writeHead(200, { "content-type": contentType });
  response.end(content);
}
