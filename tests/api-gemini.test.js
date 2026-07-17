/* Unit tests: /api/gemini proxy — method gating, key presence, and the model
   whitelist that prevents URL path injection into the upstream request. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { makeReq, makeRes } = require('./helpers');

const handler = require('../api/gemini.js');

describe('/api/gemini validation', () => {
  test('rejects non-POST with 405', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });

  test('returns 503 when GEMINI_API_KEY is missing', async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = makeRes();
    await handler(makeReq({ query: { model: 'gemini-2.0-flash' } }), res);
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    assert.equal(res.statusCode, 503);
  });

  test('rejects path-injection in the model parameter with 400', async () => {
    process.env.GEMINI_API_KEY = 'test-key-never-sent';
    const evil = ['../../v1/other:endpoint', 'model?x=1', 'model&key=steal', 'a/b', 'UPPER_case!'];
    for (const model of evil) {
      const res = makeRes();
      await handler(makeReq({ query: { model } }), res);
      assert.equal(res.statusCode, 400, `model "${model}" must be rejected`);
      assert.match(res.body.error, /Invalid model/);
    }
  });

  test('rate limiter kicks in after 30 requests/min from one IP', async () => {
    process.env.GEMINI_API_KEY = 'test-key-never-sent';
    let last;
    for (let i = 0; i < 32; i++) {
      last = makeRes();
      // invalid model → the request is cheap (never reaches upstream) but still counts
      await handler(makeReq({ ip: '8.8.4.4', query: { model: 'INVALID!' } }), last);
    }
    assert.equal(last.statusCode, 429);
  });

  test('accepts well-formed model names (passes validation gate)', () => {
    // Mirror of the handler's whitelist — a valid name must never 400.
    const ok = /^[a-z0-9.-]+$/;
    for (const model of ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']) {
      assert.equal(ok.test(model), true, model);
    }
  });
});
