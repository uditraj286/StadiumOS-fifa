// @ts-check
/* ═══════════════════════════════════════════════════════════════════════════
   Reusable Firestore "hooks" (framework-agnostic stores).

   The runtime has no React, so a hook here is a tiny observable store with the
   same ergonomics: it exposes { data, loading, error, fromCache } and lets any
   number of consumers subscribe. Crucially, ONE Firestore listener is shared
   across every consumer of the same collection+query — this is the core
   read-minimization strategy (N widgets on `notifications` = 1 listener, not N).

   Usage (vanilla):
     const store = useCollection(COLLECTIONS.NOTIFICATIONS, { limitTo: 20 });
     const off = store.subscribe(({ data, loading }) => renderNotifs(data));
     // …later: off();  // detach this consumer; listener closes when last leaves
   ═══════════════════════════════════════════════════════════════════════════ */

import { subscribeCollection, subscribeDocument } from './firestore-service.js';

/** Live registry of shared stores, keyed by collection+query signature. */
const registry = new Map();

function makeStore(startListener) {
  const consumers = new Set();
  /** @type {{data:any,loading:boolean,error:Error|null,fromCache:boolean,hasPendingWrites:boolean}} */
  let state = { data: undefined, loading: true, error: null, fromCache: false, hasPendingWrites: false };
  let detach = null;

  const emit = () => consumers.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });

  function ensureListening() {
    if (detach) return;
    detach = startListener((next) => { state = next; emit(); });
  }
  function maybeStop() {
    if (consumers.size === 0 && detach) { detach(); detach = null; }
  }

  return {
    /** Current snapshot of state (may be `loading` before first emit). */
    get() { return state; },
    /** Attach a consumer; returns an unsubscribe fn. Starts the shared listener. */
    subscribe(cb) {
      consumers.add(cb);
      ensureListening();
      if (state.data !== undefined) cb(state); // replay latest to late joiners
      return () => { consumers.delete(cb); maybeStop(); };
    },
    /** Consumers currently attached (for debugging/telemetry). */
    get size() { return consumers.size; },
  };
}

function keyFor(kind, name, arg) {
  return `${kind}:${name}:${JSON.stringify(arg || {})}`;
}

/**
 * Shared live collection store. Repeated calls with the same name+options
 * return the SAME underlying listener.
 */
export function useCollection(name, options = {}) {
  const key = keyFor('col', name, options);
  if (!registry.has(key)) {
    registry.set(key, makeStore((onState) => subscribeCollection(name, onState, options)));
  }
  return registry.get(key);
}

/** Shared live single-document store. */
export function useDocument(name, id) {
  const key = keyFor('doc', name, id);
  if (!registry.has(key)) {
    registry.set(key, makeStore((onState) => subscribeDocument(name, id, onState)));
  }
  return registry.get(key);
}

/**
 * Convenience: subscribe to a collection with a plain (data)=>void callback,
 * ignoring loading/error plumbing. Returns unsubscribe.
 */
export function onCollection(name, cb, options = {}) {
  return useCollection(name, options).subscribe((s) => cb(s.data || [], s));
}

/** Convenience: subscribe to a single document with a (data)=>void callback. */
export function onDocument(name, id, cb) {
  return useDocument(name, id).subscribe((s) => cb(s.data || null, s));
}
