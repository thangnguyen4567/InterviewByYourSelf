// Server chạy local: phục vụ web tĩnh + API đồng bộ (giống bản deploy Vercel).
// Chạy: npm start   rồi mở http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (e) { /* không có .env */ }
const api = require('./lib/progress-api');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  // Chỉ cho phép index.html và thư mục assets/ (không lộ .env, server.js...)
  if (p !== '/index.html' && !p.startsWith('/assets/')) return notFound(res);
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(path.join(ROOT, 'assets')) && file !== path.join(ROOT, 'index.html')) return notFound(res);
  fs.readFile(file, (err, buf) => {
    if (err) return notFound(res);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}
function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (p === '/api/health') return api.health(req, res);
  if (p === '/api/progress') return api.progress(req, res);
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`→ http://localhost:${PORT}`);
  if (!process.env.SYNC_KEY) console.warn('⚠ Chưa có SYNC_KEY trong .env — API sẽ từ chối mọi request');
});
