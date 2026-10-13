const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.md': 'text/plain', '.json': 'application/json' };
http.createServer(async (req, res) => {
  try {
    const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + route + (route.endsWith('/') ? 'index.html' : ''));
    const rel = path.relative(root, filename);
    if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some(x => x.startsWith('.') || x === 'node_modules')) { res.writeHead(403); return res.end('Forbidden'); }
    const physical = await fs.realpath(filename), physicalRel = path.relative(root, physical);
    if (physicalRel.startsWith('..') || path.isAbsolute(physicalRel)) { res.writeHead(403); return res.end('Forbidden'); }
    const data = await fs.readFile(filename);
    res.writeHead(200, { 'Content-Type': (types[path.extname(filename)] || 'application/octet-stream') + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Open http://127.0.0.1:4173 — Ctrl+C to stop.'));
