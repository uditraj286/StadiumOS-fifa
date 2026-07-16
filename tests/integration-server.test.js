/* Integration tests: boot the real server.js as a child process on a random
   port and exercise it over actual HTTP — static serving, health check, API
   validation, and the path-traversal guard. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 4990 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
let server;

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  // wait for the port to accept connections
  for (let i = 0; i < 40; i++) {
    try { await fetch(`${BASE}/api/health`); return; }
    catch (_) { await new Promise((r) => setTimeout(r, 150)); }
  }
  throw new Error('server did not start');
});

after(() => { server?.kill(); });

describe('server.js over real HTTP', () => {
  test('GET /api/health responds ok:true', async () => {
    const r = await fetch(`${BASE}/api/health`);
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.ok, true);
  });

  test('serves index.html at / with the right content type', async () => {
    const r = await fetch(`${BASE}/`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(await r.text(), /StadiumOS/);
  });

  test('serves static JS modules', async () => {
    const r = await fetch(`${BASE}/firebase/firestore-service.js`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /javascript/);
  });

  test('blocks path traversal outside the project root', async () => {
    const r = await fetch(`${BASE}/..%2f..%2f..%2fwindows%2fwin.ini`);
    assert.notEqual(r.status, 200);
  });

  test('unknown files 404', async () => {
    const r = await fetch(`${BASE}/definitely-not-a-file.xyz`);
    assert.equal(r.status, 404);
  });

  test('POST /api/firestore validates collection over HTTP', async () => {
    const r = await fetch(`${BASE}/api/firestore`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'add', collection: 'not_real', data: {} }),
    });
    assert.equal(r.status, 400);
    assert.match((await r.json()).error, /Unknown collection/);
  });

  test('POST /api/firestore validates op over HTTP', async () => {
    const r = await fetch(`${BASE}/api/firestore`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'nuke', collection: 'notifications' }),
    });
    assert.equal(r.status, 400);
  });

  test('GET /api/firestore is not allowed', async () => {
    const r = await fetch(`${BASE}/api/firestore`);
    // GET falls through to static file serving → 404 (no such file), never a write
    assert.notEqual(r.status, 200);
  });
});
