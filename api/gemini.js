const https = require('https');

const MODEL_OK = /^[a-z0-9.-]+$/;
const requests = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter(time => now - time < 60_000);
  recent.push(now);
  requests.set(ip, recent);
  return recent.length > 30;
}

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
  if (rateLimited(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'))
    return res.status(429).json({ error: 'Rate limited. Try again in a minute.' });

  const model = req.query.model || 'gemini-flash-latest';
  const stream = req.query.stream === '1';
  if (!MODEL_OK.test(model)) return res.status(400).json({ error: 'Invalid model.' });

  const body = JSON.stringify(req.body || {});
  const action = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
  const upstream = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:${action}key=${key}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, response => {
    res.status(response.statusCode);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/json');
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'AI service is unreachable.' });
  });
  upstream.end(body);
};
