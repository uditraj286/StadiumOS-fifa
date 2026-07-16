/* Unit tests: /api/firestore write endpoint — request validation, field
   sanitization (the security-critical whitelist), and schema/contract shape.
   Runs fully offline: validation happens before any Firebase Admin init. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { makeReq, makeRes } = require('./helpers');

const handler = require('../api/firestore.js');
const { SCHEMAS, TIME_FIELD, sanitize, safeParse } = handler;

describe('request validation (fails fast, before credentials)', () => {
  test('rejects non-POST methods with 405', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });

  test('rejects unknown collections with 400', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { op: 'add', collection: 'hacked_collection', data: {} } }), res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /Unknown collection/);
  });

  test('rejects unknown ops with 400', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { op: 'drop_table', collection: 'notifications', data: {} } }), res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /Unknown op/);
  });

  test('update without an id is a 400', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { op: 'update', collection: 'notifications', data: { title: 'x' } } }), res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /requires an id/);
  });

  test('delete without an id is a 400', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { op: 'delete', collection: 'notifications' } }), res);
    assert.equal(res.statusCode, 400);
  });

  test('malformed JSON body is handled, not thrown', async () => {
    const res = makeRes();
    await handler(makeReq({ body: '{not json!!' }), res);
    assert.equal(res.statusCode, 400); // parses to {} → unknown collection
  });

  test('rate limiter kicks in after 60 requests/min from one IP', async () => {
    let last;
    for (let i = 0; i < 62; i++) {
      last = makeRes();
      await handler(makeReq({ ip: '9.9.9.9', body: { op: 'add', collection: 'nope' } }), last);
    }
    assert.equal(last.statusCode, 429);
  });
});

describe('sanitize() — the field whitelist that guards every write', () => {
  test('keeps only whitelisted fields', () => {
    const out = sanitize('notifications', {
      title: 'Hello', message: 'World', priority: 'high', read: false,
      __proto__injection: 'evil', role: 'admin', isAdmin: true,
    });
    assert.deepEqual(Object.keys(out).sort(), ['message', 'priority', 'read', 'title']);
  });

  test('drops undefined values but keeps falsy ones', () => {
    const out = sanitize('notifications', { title: undefined, read: false, message: '' });
    assert.equal('title' in out, false);
    assert.equal(out.read, false);
    assert.equal(out.message, '');
  });

  test('an attacker cannot write the timestamp field directly', () => {
    for (const [collection, timeField] of Object.entries(TIME_FIELD)) {
      const out = sanitize(collection, { [timeField]: 'spoofed' });
      assert.equal(timeField in out, false, `${collection}.${timeField} must be server-stamped only`);
    }
  });
});

describe('schema contract', () => {
  test('every collection has a schema AND a timestamp field', () => {
    assert.deepEqual(Object.keys(SCHEMAS).sort(), Object.keys(TIME_FIELD).sort());
  });

  test('all nine collections are covered', () => {
    const expected = ['stadium_status', 'crowd_predictions', 'emergency_alerts', 'transport',
      'sustainability', 'ai_reports', 'notifications', 'fan_experience', 'food_waste'];
    assert.deepEqual(Object.keys(SCHEMAS).sort(), expected.sort());
  });

  test('no schema whitelists its own timestamp field (server-stamped only)', () => {
    for (const [collection, fields] of Object.entries(SCHEMAS)) {
      assert.equal(fields.includes(TIME_FIELD[collection]), false, collection);
    }
  });
});

describe('safeParse()', () => {
  test('parses valid JSON', () => assert.deepEqual(safeParse('{"a":1}'), { a: 1 }));
  test('returns {} for garbage instead of throwing', () => assert.deepEqual(safeParse('<html>'), {}));
});
