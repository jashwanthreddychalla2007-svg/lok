import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 10000;

function resolveFrontendDir() {
  const candidates = [
    __dirname,
    path.join(process.cwd(), 'frontend'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return __dirname;
}

const FRONTEND_DIR = resolveFrontendDir();
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');

// Auto-build fallback if dist/index.html does not exist on disk
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[NexVault] dist/index.html missing. Triggering auto-build...');
  try {
    execSync('npx vite build', { cwd: FRONTEND_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('[NexVault] Auto-build failed:', err.message);
  }
}

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
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Server Error</h1><p>${err.message}</p>`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`NexVault production server running on port ${PORT}`);
  console.log(`Serving assets from: ${DIST_DIR}`);
});
