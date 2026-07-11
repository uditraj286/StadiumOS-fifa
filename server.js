/* StadiumOS AI local server — open access, no accounts or sessions required. */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4517;
const env = { ...process.env };
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (match && !env[match[1]]) env[match[1]] = match[2].trim();
  }
} catch (_) {}

const key = env.GEMINI_API_KEY || '';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const hits = new Map();
const modelOk = /^[a-z0-9.\-]+$/;

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function rateLimited(ip) {
  const now = Date.now();
  const requests = (hits.get(ip) || []).filter(time => now - time < 60_000);
  requests.push(now);
  hits.set(ip, requests);
  return requests.length > 30;
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/health') return sendJson(res, 200, { ok: true, key: Boolean(key), auth: false });

  if (req.method === 'POST' && url.startsWith('/api/gemini')) {
    if (!key) return sendJson(res, 503, { error: 'GEMINI_API_KEY is not configured.' });
    if (rateLimited(req.socket.remoteAddress)) return sendJson(res, 429, { error: 'Rate limited. Try again in a minute.' });

    const requestUrl = new URL(req.url, 'http://localhost');
    const model = requestUrl.searchParams.get('model') || 'gemini-flash-latest';
    const stream = requestUrl.searchParams.get('stream') === '1';
    if (!modelOk.test(model)) return sendJson(res, 400, { error: 'Invalid model.' });

    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
    req.on('end', () => {
      const action = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
      const upstream = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:${action}key=${key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, response => {
        res.writeHead(response.statusCode, { 'Content-Type': response.headers['content-type'] || 'application/json' });
        response.pipe(res);
      });
      upstream.on('error', () => sendJson(res, 502, { error: 'AI service is unreachable.' }));
      upstream.end(body);
    });
    return;
  }

  let requestPath = decodeURIComponent(url);
  if (requestPath === '/') requestPath = '/index.html';
  const file = path.join(__dirname, path.normalize(requestPath));
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`StadiumOS AI is live at http://127.0.0.1:${PORT} (open access)`));
