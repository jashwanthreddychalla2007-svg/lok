import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 10000;

function resolveDistDir() {
  const candidates = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend', 'dist'),
    path.join(process.cwd(), 'dist'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))) {
      console.log(`[NexVault] Serving dist directory from: ${cand}`);
      return cand;
    }
  }
  console.warn(`[NexVault] Warning: dist directory not found in candidates, defaulting to: ${candidates[0]}`);
  return candidates[0];
}

const DIST_DIR = resolveDistDir();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${err.code}\nPath: ${filePath}\nDIST_DIR: ${DIST_DIR}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`NexVault production server running on port ${PORT}`);
});
