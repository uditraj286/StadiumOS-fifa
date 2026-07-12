// @ts-check
/* ═══════════════════════════════════════════════════════════════════════════
   Firebase app + Firestore initialization (Firebase JS SDK v11, modular ESM).

   Loaded from the gstatic CDN so the no-build static site can use the modern
   modular SDK directly in the browser. If FIREBASE_CONFIG still holds
   placeholders, we DO NOT initialize — the app degrades gracefully to demo
   mode (local simulated state) instead of throwing. Everything downstream
   checks `isFirebaseReady()`.

   Offline: we use persistentLocalCache with multi-tab support, so reads are
   served from IndexedDB when the network drops and re-sync automatically.
   ═══════════════════════════════════════════════════════════════════════════ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  disableNetwork,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

/** True when window.FIREBASE_CONFIG holds real (non-placeholder) values. */
function configIsReal(cfg) {
  return !!cfg
    && typeof cfg.projectId === 'string'
    && cfg.projectId.length > 0
    && !cfg.projectId.startsWith('REPLACE_WITH')
    && typeof cfg.apiKey === 'string'
    && !cfg.apiKey.startsWith('REPLACE_WITH');
}

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null;
/** @type {import('firebase/firestore').Firestore | null} */
let db = null;
let ready = false;
let initError = /** @type {Error | null} */ (null);

const cfg = /** @type {any} */ (window).FIREBASE_CONFIG;

if (configIsReal(cfg)) {
  try {
    app = initializeApp(cfg);
    // initializeFirestore (not getFirestore) so we can attach the offline cache
    // at creation time — the only moment cache settings can be supplied.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    ready = true;
    console.info('[Firestore] Live — project:', cfg.projectId);
  } catch (err) {
    initError = /** @type {Error} */ (err);
    ready = false;
    console.error('[Firestore] Initialization failed — running in demo mode.', err);
  }
} else {
  console.warn(
    '[Firestore] No real config found (firebase/firebase-config.public.js still has ' +
    'placeholders). Running in DEMO MODE — local simulated state drives the UI. ' +
    'See SETUP-FIREBASE.md to go live.'
  );
}

export { db };

export function isFirebaseReady() {
  return ready && db !== null;
}

export function getInitError() {
  return initError;
}

export function getProjectId() {
  return ready ? cfg.projectId : null;
}

/** Manual offline/online toggles — used by the connectivity handlers. */
export async function goOffline() {
  if (db) { try { await disableNetwork(db); } catch (_) {} }
}
export async function goOnline() {
  if (db) { try { await enableNetwork(db); } catch (_) {} }
}
