/* Contract tests: the client-side collection registry (ESM) and the backend
   write whitelist (CJS) are maintained in separate files — these tests fail
   the build if they ever drift apart. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { SCHEMAS } = require('../api/firestore.js');

describe('client registry ↔ backend schema contract', () => {
  test('every client collection is writable through the backend, and vice versa', async () => {
    const reg = await import('../firebase/collections.js');
    assert.deepEqual(Object.values(reg.COLLECTIONS).sort(), Object.keys(SCHEMAS).sort());
  });

  test('public + sensitive classification covers every collection exactly once', async () => {
    const reg = await import('../firebase/collections.js');
    const classified = [...reg.PUBLIC_COLLECTIONS, ...reg.SENSITIVE_COLLECTIONS].sort();
    assert.deepEqual(classified, reg.ALL_COLLECTIONS.slice().sort());
  });

  test('emergency_alerts is classified sensitive (medical/PII data)', async () => {
    const reg = await import('../firebase/collections.js');
    assert.equal(reg.SENSITIVE_COLLECTIONS.includes('emergency_alerts'), true);
    assert.equal(reg.PUBLIC_COLLECTIONS.includes('emergency_alerts'), false);
  });

  test('singleton ids exist for rolling documents', async () => {
    const reg = await import('../firebase/collections.js');
    for (const name of ['stadium_status', 'transport', 'sustainability', 'fan_experience']) {
      assert.equal(typeof reg.SINGLETON_IDS[name], 'string', name);
    }
  });

  test('seed docs conform to the backend field whitelist', async () => {
    const reg = await import('../firebase/collections.js');
    for (const [collection, docs] of Object.entries(reg.SEED_DOCS)) {
      for (const [id, doc] of Object.entries(docs)) {
        for (const field of Object.keys(doc)) {
          assert.equal(SCHEMAS[collection].includes(field), true,
            `${collection}/${id}.${field} is not in the backend whitelist`);
        }
      }
    }
  });
});

describe('firestore.rules ↔ registry contract', () => {
  test('every public collection has a public-read rule; sensitive ones do not', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
    const reg = await import('../firebase/collections.js');
    for (const name of reg.PUBLIC_COLLECTIONS) {
      assert.match(rules, new RegExp(`/${name}/\\{doc\\}\\s*\\{\\s*allow read: if true`), name);
    }
    for (const name of reg.SENSITIVE_COLLECTIONS) {
      assert.match(rules, new RegExp(`/${name}/\\{doc\\}\\s*\\{\\s*allow read: if false`), name);
    }
    // No rule anywhere may grant client writes.
    assert.equal(/allow write: if true/.test(rules), false, 'client writes must never be allowed');
  });
});
