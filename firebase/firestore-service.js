// @ts-check
/* ═══════════════════════════════════════════════════════════════════════════
   Reusable Firestore service — the ONLY module the app talks to for data.

   READS  (getCollection/getDocument/subscribeCollection/subscribeDocument)
          go straight to the client SDK. Fast, real-time, offline-cached.
   WRITES (addDocument/updateDocument/deleteDocument)
          are proxied to the backend Admin API (/api/firestore). The client
          SDK is intentionally NEVER used to write — firestore.rules deny all
          client writes, so even a tampered client cannot mutate data. Writes
          only succeed through the server, which holds the service-account key.

   Every function is type-checked against firebase/types.ts (FirestoreService).
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  collection as fsCollection,
  doc as fsDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where as fsWhere,
  orderBy,
  limit as fsLimit,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

import { db, isFirebaseReady } from './firebase-config.js';

/** Endpoint of the backend write proxy (Vercel serverless / local server). */
const WRITE_ENDPOINT = '/api/firestore';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Convert any Firestore Timestamp fields on a doc to JS Dates for the UI. */
function normalize(snapshot) {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) || {};
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v && typeof v.toDate === 'function') data[k] = v.toDate();
  }
  return { id: snapshot.id, ...data };
}

/** Build a Firestore query from QueryOptions (kept tiny to minimize reads). */
function buildQuery(name, options = {}) {
  const col = fsCollection(/** @type {any} */ (db), name);
  const clauses = [];
  for (const [field, value] of options.where || []) clauses.push(fsWhere(field, '==', value));
  if (options.orderByField) clauses.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
  if (options.limitTo) clauses.push(fsLimit(options.limitTo));
  return clauses.length ? query(col, ...clauses) : col;
}

/** Fresh subscription state object. */
function stateOf(data, { loading = false, error = null, meta } = {}) {
  return {
    data,
    loading,
    error,
    fromCache: meta ? meta.fromCache : false,
    hasPendingWrites: meta ? meta.hasPendingWrites : false,
  };
}

/* ── WRITES (backend-proxied) ───────────────────────────────────────────────
   These never touch the client SDK. They POST an intent to the Admin API,
   which validates and performs the actual Firestore write server-side. */

async function writeThroughBackend(op, payload) {
  const res = await fetch(WRITE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...payload }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { detail = (await res.json()).error || detail; } catch (_) {}
    throw new Error(`Firestore ${op} failed: ${detail}`);
  }
  return res.json().catch(() => ({}));
}

/**
 * Create a document. Returns the new (or supplied) document id.
 * @param {string} name @param {object} data @param {string} [id]
 */
export async function addDocument(name, data, id) {
  const { id: newId } = await writeThroughBackend('add', { collection: name, id, data });
  return newId || id;
}

/** Update (merge) a document. */
export async function updateDocument(name, id, data) {
  await writeThroughBackend('update', { collection: name, id, data });
}

/** Delete a document. */
export async function deleteDocument(name, id) {
  await writeThroughBackend('delete', { collection: name, id });
}

/* ── READS (client SDK) ─────────────────────────────────────────────────────*/

/**
 * One-shot collection read. Prefer this over a listener for data that does not
 * need to be live (minimizes reads — a listener bills on every change).
 */
export async function getCollection(name, options = {}) {
  if (!isFirebaseReady()) return [];
  const snap = await getDocs(buildQuery(name, options));
  return snap.docs.map(normalize);
}

/** One-shot single-document read. Returns null if the doc is absent. */
export async function getDocument(name, id) {
  if (!isFirebaseReady()) return null;
  const snap = await getDoc(fsDoc(/** @type {any} */ (db), name, id));
  return snap.exists() ? normalize(snap) : null;
}

/**
 * Real-time collection listener. Calls `onState` with a SubscriptionState
 * whenever the query result changes. Returns an unsubscribe function — ALWAYS
 * call it when the consumer unmounts, or reads keep billing.
 * @returns {() => void}
 */
export function subscribeCollection(name, onState, options = {}) {
  if (!isFirebaseReady()) {
    onState(stateOf([], { loading: false, error: new Error('Firestore not configured') }));
    return () => {};
  }
  onState(stateOf([], { loading: true }));
  return onSnapshot(
    buildQuery(name, options),
    // includeMetadataChanges lets us surface offline (fromCache) state to the UI
    { includeMetadataChanges: true },
    (snap) => onState(stateOf(snap.docs.map(normalize), { meta: snap.metadata })),
    (err) => onState(stateOf([], { error: /** @type {Error} */ (err) })),
  );
}

/**
 * Real-time single-document listener.
 * @returns {() => void}
 */
export function subscribeDocument(name, id, onState) {
  if (!isFirebaseReady()) {
    onState(stateOf(null, { loading: false, error: new Error('Firestore not configured') }));
    return () => {};
  }
  onState(stateOf(null, { loading: true }));
  return onSnapshot(
    fsDoc(/** @type {any} */ (db), name, id),
    { includeMetadataChanges: true },
    (snap) => onState(stateOf(snap.exists() ? normalize(snap) : null, { meta: snap.metadata })),
    (err) => onState(stateOf(null, { error: /** @type {Error} */ (err) })),
  );
}

/** Namespaced default export mirroring the FirestoreService interface. */
export const FirestoreService = {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeCollection,
  subscribeDocument,
  getCollection,
  getDocument,
};

export default FirestoreService;
