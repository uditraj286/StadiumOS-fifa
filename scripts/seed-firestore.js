/* ═══════════════════════════════════════════════════════════════════════════
   Seed Firestore with demo documents so a fresh project renders immediately.

   Run once after configuring credentials:
     node scripts/seed-firestore.js

   Requires the SAME server credential as the write API:
     FIREBASE_SERVICE_ACCOUNT (JSON string)  or
     GOOGLE_APPLICATION_CREDENTIALS (path to key file)
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env (simple parser — no dependency) so `node scripts/seed-firestore.js`
// works without extra tooling.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch (_) {}

// SEED_DOCS lives in the ESM collections module; mirror the minimal shapes here
// to keep this script a plain CommonJS script with no bundler.
const SEED = {
  stadium_status: {
    metlife: { stadiumName: 'MetLife Stadium', crowdDensity: 'busy', occupancyPercentage: 61,
      weather: 'Clear', temperature: 24, humidity: 58, airQuality: 42, stadiumHealthScore: 92 },
  },
  transport: {
    metlife: { parkingOccupancy: 84, shuttleStatus: '18 units · 4.2 min headway',
      metroStatus: 'Meadowlands line 72% load', trafficLevel: 'moderate', estimatedExitTime: '22:30–23:10' },
  },
  sustainability: {
    metlife: { energyUsage: 38.2, waterUsage: 512, wasteCollected: 78, carbonEmission: 41,
      aiSuggestion: 'Pre-cool bowl 30 min earlier — saves 1.8 MWh vs reactive HVAC.' },
  },
  crowd_predictions: {
    'seed-105': { zone: 'Section 105', currentCrowd: 4200, predictedCrowd: 4850, riskLevel: 'high',
      confidence: 0.86, recommendation: 'Reallocate 4 stewards from Gate C; hold escalator 2.' },
  },
  emergency_alerts: {
    'seed-114': { title: 'Fan collapse — Section 114', description: 'On-scene, patient stable. Unit M-3 responding.',
      type: 'medical', severity: 'high', location: 'Section 114', status: 'in_progress',
      aiRecommendation: 'Keep M-1 at Gate B on standby; clear corridor 114→exit D.' },
  },
  ai_reports: {
    'seed-report': { title: 'Pre-match readiness brief',
      summary: 'All systems nominal except Section 105 (88% density, trending up).', generatedBy: 'gemini-flash-latest' },
  },
  notifications: {
    'seed-notif': { title: 'Crowd threshold — Section 105',
      message: 'Density 88% and rising. Steward reallocation awaiting approval.', priority: 'high', read: false },
  },
};

const TIME_FIELD = {
  stadium_status: 'lastUpdated', crowd_predictions: 'timestamp', emergency_alerts: 'createdAt',
  transport: 'updatedAt', sustainability: 'updatedAt', ai_reports: 'timestamp', notifications: 'createdAt',
};

function init() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const cred = JSON.parse(raw);
    if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error('✗ No credentials. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS. See SETUP-FIREBASE.md.');
    process.exit(1);
  }
}

async function main() {
  init();
  const db = admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp();
  let count = 0;
  for (const [collection, docs] of Object.entries(SEED)) {
    for (const [id, data] of Object.entries(docs)) {
      await db.collection(collection).doc(id).set({ ...data, [TIME_FIELD[collection]]: stamp }, { merge: true });
      count++;
      console.log(`  ✓ ${collection}/${id}`);
    }
  }
  console.log(`\nSeeded ${count} documents. The dashboard will show them live.`);
  process.exit(0);
}

main().catch((err) => { console.error('✗ Seed failed:', err); process.exit(1); });
