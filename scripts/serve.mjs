import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

export function serve() {
  const root = resolve(import.meta.dirname, "../dist");
  const args = process.argv.slice(2);
  const portIndex = args.indexOf("--port");
  const port = Number(
    process.env.PORT || (portIndex >= 0 ? args[portIndex + 1] : 4173),
  );
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".pdf": "application/pdf",
  };
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const legacy = {
        "/location-ranger": "/buggy/",
        "/location-quad": "/quad/",
        "/nos-partenaires": "/maisons/",
        "/historique": "/a-propos/",
      };
      if (legacy[pathname.replace(/\/$/, "")]) {
        res.writeHead(301, { Location: legacy[pathname.replace(/\/$/, "")] });
        res.end();
        return;
      }
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, "index.html");
      } catch {
        file = resolve(root, "404.html");
        res.statusCode = 404;
      }
      const body = await readFile(file);
      res.setHeader(
        "Content-Type",
        types[extname(file)] || "application/octet-stream",
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404");
    }
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Corsica Ranger : http://localhost:${port}`),
  );
  return server;
}
if (process.argv[1] === import.meta.filename) serve();
