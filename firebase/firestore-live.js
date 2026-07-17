// @ts-check
/* ═══════════════════════════════════════════════════════════════════════════
   Live integration — wires Firestore into the running command center.

   Loaded as a module AFTER app.js, so all app globals (S, $, toast, go, AI)
   already exist. Responsibilities:
     1. Boot every real-time listener (one per collection, read-minimized).
     2. Keep window.LIVE as an always-fresh cache of each collection.
     3. Re-emit each change as a `firestore:update` DOM event so any view can
        bind without importing anything.
     4. Drive the always-visible surfaces live: dashboard KPIs, the bell badge
        + toast for new notifications, and the connectivity status pill.
     5. Expose window.Firestore — the app's single door for persisting AI output
        (crowd predictions, emergency recs, sustainability, incident summaries,
        transport advice) back into Firestore, which then flows to every client.

   In DEMO MODE (no real config) this stays dormant: listeners report
   "not configured", the local simulated `S` state keeps driving the UI, and
   window.Firestore.save() becomes a safe no-op. Nothing breaks.
   ═══════════════════════════════════════════════════════════════════════════ */

import { isFirebaseReady, getProjectId, goOffline, goOnline } from './firebase-config.js';
import * as Service from './firestore-service.js';
import { onCollection } from './use-firestore.js';
import { COLLECTIONS, ALL_COLLECTIONS, SINGLETON_IDS } from './collections.js';

/* ── shared helpers (defensive: app.js may not have painted yet) ──────────── */
const $$ = (sel) => document.querySelector(sel);
const notify = (title, sub, cls = '') => {
  if (typeof window.toast === 'function') window.toast(title, sub, cls);
  else console.log(`[toast:${cls}] ${title} — ${sub}`);
};

/** Always-fresh cache of every collection, for any view to read synchronously. */
const LIVE = /** @type {Record<string, any[]>} */ ({});
window.LIVE = LIVE;

/* ── per-collection live surfaces ─────────────────────────────────────────── */

/** Update the dashboard headline KPIs from the stadium_status singleton. */
function paintStadiumKpis(status) {
  if (!status) return;
  const setText = (sel, val) => { const el = $$(sel); if (el) el.textContent = String(val); };
  // Elements that exist in the dashboard view; guarded so other views no-op.
  setText('#kpiPower', status.energyUsage ?? status.powerMW ?? '');
  const occ = document.querySelector('[data-fs="occupancy"]');
  if (occ) occ.textContent = `${Math.round(status.occupancyPercentage)}`;
  const health = document.querySelector('[data-fs="healthScore"]');
  if (health) health.textContent = `${Math.round(status.stadiumHealthScore)}`;
}

/** Live notifications: bump the bell badge + toast unread ones as they arrive. */
const notifSeen = new Set();
let notifPrimed = false;
function paintNotifications(list) {
  const unread = list.filter((n) => !n.read);
  const badge = $$('#notifBadge');
  if (badge) badge.textContent = String(Math.min(99, unread.length));

  // Toast only genuinely-new docs after the first (priming) snapshot, so we
  // don't replay the whole backlog on page load.
  if (notifPrimed) {
    for (const n of list) {
      if (notifSeen.has(n.id)) continue;
      const cls = n.priority === 'urgent' || n.priority === 'high' ? 'warn' : '';
      notify(n.title || 'Notification', n.message || '', cls);
    }
  }
  list.forEach((n) => notifSeen.add(n.id));
  notifPrimed = true;
}

/** Connectivity status pill (reuses the LIVE pill in the topbar if present). */
function paintConnectivity(anyFromCache) {
  const pill = $$('.pill-live');
  if (!pill) return;
  pill.classList.toggle('is-offline', anyFromCache);
}

/* ── boot ─────────────────────────────────────────────────────────────────── */

function bootListeners() {
  for (const name of ALL_COLLECTIONS) {
    // Cap reads with a sane limit + newest-first ordering where the field exists.
    const orderField = ORDER_FIELD[name];
    const options = { limitTo: 50, ...(orderField ? { orderByField: orderField, orderDirection: 'desc' } : {}) };

    onCollection(name, (data, state) => {
      LIVE[name] = data;
      paintConnectivity(state.fromCache);

      // Per-collection live surfaces
      if (name === COLLECTIONS.STADIUM_STATUS) paintStadiumKpis(data[0]);
      if (name === COLLECTIONS.NOTIFICATIONS) paintNotifications(data);

      // Generic broadcast — any active view can listen and re-render.
      document.dispatchEvent(new CustomEvent('firestore:update', {
        detail: { collection: name, data, state },
      }));
    }, options);
  }
}

const ORDER_FIELD = {
  [COLLECTIONS.CROWD_PREDICTIONS]: 'timestamp',
  [COLLECTIONS.EMERGENCY_ALERTS]: 'createdAt',
  [COLLECTIONS.AI_REPORTS]: 'timestamp',
  [COLLECTIONS.NOTIFICATIONS]: 'createdAt',
  [COLLECTIONS.FOOD_WASTE]: 'createdAt',
};

/* ── network resilience ───────────────────────────────────────────────────── */
function wireConnectivity() {
  window.addEventListener('offline', () => {
    notify('Working offline', 'Showing cached data — changes sync when you reconnect.', 'warn');
    goOffline();
  });
  window.addEventListener('online', () => {
    notify('Back online', 'Reconnected to the live database.', '');
    goOnline();
  });
}

/* ── public API for app.js: persist AI output → Firestore ─────────────────── */

/** Map a Gemini output "kind" to its target collection + a field normalizer. */
const AI_ROUTES = {
  crowd:        { collection: COLLECTIONS.CROWD_PREDICTIONS },
  emergency:    { collection: COLLECTIONS.EMERGENCY_ALERTS },
  sustainability:{ collection: COLLECTIONS.SUSTAINABILITY, id: () => SINGLETON_IDS[COLLECTIONS.SUSTAINABILITY] },
  transport:    { collection: COLLECTIONS.TRANSPORT, id: () => SINGLETON_IDS[COLLECTIONS.TRANSPORT] },
  report:       { collection: COLLECTIONS.AI_REPORTS },
  incident:     { collection: COLLECTIONS.AI_REPORTS },
  notification: { collection: COLLECTIONS.NOTIFICATIONS },
  status:       { collection: COLLECTIONS.STADIUM_STATUS, id: () => SINGLETON_IDS[COLLECTIONS.STADIUM_STATUS] },
  experience:   { collection: COLLECTIONS.FAN_EXPERIENCE, id: () => SINGLETON_IDS[COLLECTIONS.FAN_EXPERIENCE] },
  foodwaste:    { collection: COLLECTIONS.FOOD_WASTE },
};

window.Firestore = {
  ready: isFirebaseReady,
  projectId: getProjectId,
  service: Service,
  cache: LIVE,

  /**
   * Persist an AI-generated result into the right collection.
   * @param {keyof typeof AI_ROUTES} kind
   * @param {object} data
   * @returns {Promise<string|undefined>} the document id, or undefined in demo mode
   */
  async save(kind, data) {
    const route = AI_ROUTES[kind];
    if (!route) { console.warn('[Firestore] Unknown AI route:', kind); return; }
    if (!isFirebaseReady()) {
      // Demo mode: nothing to persist to, but never throw into an AI handler.
      console.info(`[Firestore demo] would save → ${route.collection}`, data);
      return;
    }
    try {
      const id = route.id ? route.id() : undefined;
      // Singletons upsert one row; everything else appends a new doc.
      if (id) { await Service.updateDocument(route.collection, id, data); return id; }
      return await Service.addDocument(route.collection, data);
    } catch (err) {
      console.error(`[Firestore] save(${kind}) failed:`, err);
      notify('Save failed', 'AI result kept on screen but not persisted.', 'warn');
    }
  },

  /** Direct collection write helper (also backend-proxied). */
  async push(collection, data) {
    if (!isFirebaseReady()) { console.info(`[Firestore demo] would push → ${collection}`, data); return; }
    return Service.addDocument(collection, data);
  },
};

/* ── go ───────────────────────────────────────────────────────────────────── */
wireConnectivity();
bootListeners();

if (isFirebaseReady()) {
  console.info('[Firestore] Live data layer active on', getProjectId());
  document.dispatchEvent(new CustomEvent('firestore:ready', { detail: { projectId: getProjectId() } }));
} else {
  document.dispatchEvent(new CustomEvent('firestore:demo'));
}
