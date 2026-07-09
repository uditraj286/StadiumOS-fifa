/* ═══ StadiumOS AI — Node server ═══
   Serves the app AND proxies Gemini calls so the API key never ships to the
   browser. Key lives in .env (git-ignored) or the GEMINI_API_KEY env var.
   Zero npm dependencies — run with: node server.js            */
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');

const PORT = process.env.PORT || 4517;

/* key: env var wins, else .env file */
let KEY = process.env.GEMINI_API_KEY || '';
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^GEMINI_API_KEY\s*=\s*(.+)$/);
    if (m) KEY = m[1].trim();
  }
} catch (_) {}
if (!KEY) console.warn('⚠  No GEMINI_API_KEY found in .env or environment — AI calls will fail.');

const MODEL_OK = /^[a-z0-9.\-]+$/;               // whitelist pattern — no path injection
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown' };

/* naive per-IP rate limit: 30 AI calls / minute */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 30;
}

http.createServer((req, res) => {
  /* ── health check ── */
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, key: !!KEY }));
  }
  /* ── AI proxy ── */
  if (req.method === 'POST' && req.url.startsWith('/api/gemini')) {
    if (limited(req.socket.remoteAddress)) { res.writeHead(429, {'Content-Type':'application/json'}); return res.end('{"error":"rate limited"}'); }
    const u = new URL(req.url, 'http://localhost');
    const model = u.searchParams.get('model') || 'gemini-2.5-flash';
    const stream = u.searchParams.get('stream') === '1';
    if (!MODEL_OK.test(model)) { res.writeHead(400); return res.end('{"error":"bad model"}'); }

    let body = '';
    req.on('data', c => { body += c; if (body.length > 1_000_000) req.destroy(); });
    req.on('end', () => {
      const gPath = `/v1beta/models/${model}:${stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?'}key=${KEY}`;
      const g = https.request(
        { hostname: 'generativelanguage.googleapis.com', path: gPath, method: 'POST',
          headers: { 'Content-Type': 'application/json' } },
        gr => { res.writeHead(gr.statusCode, { 'Content-Type': gr.headers['content-type'] || 'application/json' }); gr.pipe(res); });
      g.on('error', () => { res.writeHead(502, {'Content-Type':'application/json'}); res.end('{"error":"upstream unreachable"}'); });
      g.end(body);
    });
    return;
  }

  /* ── static files ── */
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, path.normalize(p));
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }   // no traversal
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`⚽ StadiumOS AI → http://127.0.0.1:${PORT}  (key: ${KEY ? 'loaded, server-side only' : 'MISSING'})`));
