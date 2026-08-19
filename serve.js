// Syntropic Tech static server — gzip/brotli, ETag revalidation, correct MIME.
// Usage: node serve.js [port]   (default 8000, binds 0.0.0.0)
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || 8000);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt']);
const compressedCache = new Map(); // file -> { mtime, enc, buffer }

function compress(file, mtime, acceptEncoding) {
  const wantsBr = /\bbr\b/.test(acceptEncoding);
  const wantsGz = /\bgzip\b/.test(acceptEncoding);
  if (!wantsBr && !wantsGz) return null;
  const enc = wantsBr ? 'br' : 'gzip';
  const key = enc + ':' + file;
  const hit = compressedCache.get(key);
  if (hit && hit.mtime === mtime) return hit;
  const raw = fs.readFileSync(file);
  const buffer = enc === 'br'
    ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.gzipSync(raw, { level: 6 });
  const entry = { mtime, enc, buffer };
  if (compressedCache.size > 300) compressedCache.clear();
  compressedCache.set(key, entry);
  return entry;
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Cache-Control': 'no-cache' });
    res.end('404');
    return;
  }
  const stat = fs.statSync(file);
  const etag = 'W/"' + crypto.createHash('sha1').update(stat.size + ':' + stat.mtimeMs).digest('hex').slice(0, 16) + '"';
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
    res.end();
    return;
  }
  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache', // revalidate (fast 304s), never stale
    ETag: etag,
  };
  if (COMPRESSIBLE.has(ext)) {
    const c = compress(file, stat.mtimeMs, req.headers['accept-encoding'] || '');
    if (c) {
      headers['Content-Encoding'] = c.enc;
      headers['Content-Length'] = c.buffer.length;
      res.writeHead(200, headers);
      res.end(c.buffer);
      return;
    }
  }
  headers['Content-Length'] = stat.size;
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log(`serving ${ROOT} on http://0.0.0.0:${PORT} (br/gzip + etags)`));
