/* Shared test utilities: minimal req/res shims matching the Vercel handler
   contract (res.status().json()), so API handlers run in-process with no
   network, no Firebase project, and no mocking framework. */

function makeReq({ method = 'POST', body = {}, ip = '1.2.3.4', query = {} } = {}) {
  return {
    method,
    query,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k] = v; },
    json(obj) { this.body = obj; this._resolve?.(obj); return this; },
  };
  // lets tests `await res.done` for async handlers
  res.done = new Promise((resolve) => { res._resolve = resolve; });
  return res;
}

module.exports = { makeReq, makeRes };
