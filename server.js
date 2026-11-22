const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DEFAULT_FILE = "index.html";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  let relPath = decodeURIComponent(urlPath === "/" ? `/${DEFAULT_FILE}` : urlPath);

  // Chặn path traversal ra ngoài thư mục dự án
  const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Be ca 3D server dang chay tai: http://localhost:${PORT}`);
  console.log(`Mac dinh mo: ${DEFAULT_FILE} (nhan Ctrl+C de dung)`);
});
