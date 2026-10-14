import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../out/", import.meta.url)));
const port = Number(process.env.PORT ?? 3000);
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json", ".txt":"text/plain; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".ico":"image/x-icon", ".woff2":"font/woff2", ".glb":"model/gltf-binary" };
await stat(path.join(root, "index.html")).catch(() => { throw new Error("Run npm run build before starting the static production preview."); });
createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405, { Allow:"GET, HEAD" }); response.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative) || pathname.includes("\\") || pathname.includes("\0")) { response.writeHead(403); response.end(); return; }
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith("/")) { response.writeHead(308, { Location:pathname+"/" }); response.end(); return; }
      file = path.join(file, "index.html"); info = await stat(file);
    }
    const etag = `W/"${info.size}-${Math.trunc(info.mtimeMs)}"`;
    const headers = { "Content-Type":mime[path.extname(file)] ?? "application/octet-stream", "Cache-Control":pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate", ETag:etag, "X-Content-Type-Options":"nosniff" };
    if (request.headers["if-none-match"] === etag) { response.writeHead(304, headers); response.end(); return; }
    response.writeHead(200, { ...headers, "Content-Length":info.size });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error",()=>response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type":"text/html; charset=utf-8" });
    if (request.method === "HEAD") response.end(); else createReadStream(path.join(root,"404.html")).on("error",()=>response.end("Not found")).pipe(response);
  }
}).listen(port, "127.0.0.1", () => console.log(`Production preview: http://127.0.0.1:${port}`));
