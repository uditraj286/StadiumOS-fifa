/* ═══════════════════════════════════════════════════════════════════════════
   Backend Firestore write API (Firebase Admin SDK).

   This is the ONLY component permitted to write to Firestore. The client SDK is
   denied all writes by firestore.rules; the Admin SDK bypasses rules using a
   service-account credential that never leaves the server. Every AI result the
   dashboard generates flows through here.

   Ops (POST body): { op: 'add'|'update'|'delete', collection, id?, data? }

   Credentials (server env only — see SETUP-FIREBASE.md):
     FIREBASE_SERVICE_ACCOUNT   JSON string of the service-account key, OR
     GOOGLE_APPLICATION_CREDENTIALS  path to the key file (local dev).
   If neither is set, the endpoint returns 503 (demo mode) instead of crashing.
   ═══════════════════════════════════════════════════════════════════════════ */

let admin;
try { admin = require('firebase-admin'); } catch (_) { admin = null; }

/* ── one-time Admin init (module scope survives warm invocations) ──────────── */
let db = null;
let initError = null;

function initAdmin() {
  if (db || initError) return;
  if (!admin) { initError = 'firebase-admin not installed — run: npm install'; return; }
  try {
    if (!admin.apps.length) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (raw) {
        const cred = JSON.parse(raw);
        // Vercel env vars escape newlines in the private key — restore them.
        if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      } else {
        initError = 'No service-account credentials configured (FIREBASE_SERVICE_ACCOUNT).';
        return;
      }
    }
    db = admin.firestore();
  } catch (err) {
    initError = `Admin init failed: ${err.message}`;
  }
}

/* ── per-collection field whitelists (server-side validation) ─────────────────
   Only these fields are ever written; anything else in the payload is dropped.
   Keep in lockstep with firebase/types.ts + firebase/collections.js. */
const SCHEMAS = {
  stadium_status: ['stadiumName', 'crowdDensity', 'occupancyPercentage', 'weather',
    'temperature', 'humidity', 'airQuality', 'stadiumHealthScore'],
  crowd_predictions: ['zone', 'currentCrowd', 'predictedCrowd', 'riskLevel',
    'confidence', 'recommendation'],
  emergency_alerts: ['title', 'description', 'type', 'severity', 'location',
    'status', 'aiRecommendation'],
  transport: ['parkingOccupancy', 'shuttleStatus', 'metroStatus', 'trafficLevel',
    'estimatedExitTime'],
  sustainability: ['energyUsage', 'waterUsage', 'wasteCollected', 'carbonEmission',
    'aiSuggestion'],
  ai_reports: ['title', 'summary', 'generatedBy'],
  notifications: ['title', 'message', 'priority', 'read'],
  fan_experience: ['overallScore', 'navigation', 'foodWait', 'accessibility',
    'transport', 'safety', 'aiExplanation'],
  food_waste: ['outlet', 'item', 'predictedUnsold', 'confidence',
    'recommendation', 'status'],
};

/* Which timestamp field each collection stamps on write. */
const TIME_FIELD = {
  stadium_status: 'lastUpdated',
  crowd_predictions: 'timestamp',
  emergency_alerts: 'createdAt',
  transport: 'updatedAt',
  sustainability: 'updatedAt',
  ai_reports: 'timestamp',
  notifications: 'createdAt',
  fan_experience: 'updatedAt',
  food_waste: 'createdAt',
};

/** Keep only whitelisted fields; coerce nothing unexpected through. */
function sanitize(collection, data) {
  const allowed = SCHEMAS[collection];
  const out = {};
  for (const key of allowed) if (data[key] !== undefined) out[key] = data[key];
  return out;
}

/* ── naive per-IP rate limit (shared with the gemini proxy pattern) ────────── */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 60;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (rateLimited(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'))
    return res.status(429).json({ error: 'Rate limited. Try again in a minute.' });

  // Validate the request shape BEFORE touching credentials — bad input should
  // fail fast (400) whether or not the backend is configured, and this keeps
  // the validation path unit-testable without a live Firebase project.
  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const { op, collection, id, data } = body;

  if (!SCHEMAS[collection]) return res.status(400).json({ error: `Unknown collection: ${collection}` });
  if (!['add', 'update', 'delete'].includes(op)) return res.status(400).json({ error: `Unknown op: ${op}` });
  if ((op === 'update' || op === 'delete') && !id) return res.status(400).json({ error: `${op} requires an id.` });

  initAdmin();
  if (!db) return res.status(503).json({ error: initError || 'Firestore backend not configured.' });

  try {
    const col = db.collection(collection);
    const stamp = admin.firestore.FieldValue.serverTimestamp();

    if (op === 'delete') {
      if (!id) return res.status(400).json({ error: 'delete requires an id.' });
      await col.doc(id).delete();
      return res.status(200).json({ ok: true, id });
    }

    const clean = sanitize(collection, data || {});
    clean[TIME_FIELD[collection]] = stamp;

    if (op === 'update') {
      if (!id) return res.status(400).json({ error: 'update requires an id.' });
      await col.doc(id).set(clean, { merge: true });
      return res.status(200).json({ ok: true, id });
    }

    // op === 'add'
    if (id) { await col.doc(id).set(clean, { merge: true }); return res.status(200).json({ ok: true, id }); }
    const ref = await col.add(clean);
    return res.status(200).json({ ok: true, id: ref.id });
  } catch (err) {
    console.error('[api/firestore] write failed:', err);
    return res.status(500).json({ error: `Write failed: ${err.message}` });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch (_) { return {}; } }

/* Test-only exports: pure helpers + schema tables, so the validation and
   sanitization logic is unit-testable without a live Firebase project. */
module.exports.SCHEMAS = SCHEMAS;
module.exports.TIME_FIELD = TIME_FIELD;
module.exports.sanitize = sanitize;
module.exports.safeParse = safeParse;
