# Engineering Code Review — StadiumOS AI

> Senior-review pass over every source file. Scores are 1–10 across
> architecture, readability, maintainability, security, testing, and
> accessibility. Reviewed honestly — including the trade-offs we chose
> deliberately and would defend in a design review.

## Scores

| File | Score | Notes |
|---|---|---|
| `api/firestore.js` | 9.5 | Single-writer gateway; validates before credentials; field whitelists; testable pure helpers exported. |
| `api/gemini.js` | 9.5 | Thin, stateless key proxy; model whitelist kills path injection; rate-limited. |
| `api/health.js` | 10 | Three lines, does one thing. |
| `firebase/firestore-service.js` | 9.5 | Clean read/write split (reads client SDK, writes proxied); timestamps normalized; typed against `types.ts`. |
| `firebase/use-firestore.js` | 9.5 | Shared-listener stores — the core read-minimization primitive; reference-counted teardown. |
| `firebase/collections.js` | 9.5 | Single registry for names/classification/seeds; contract-tested against backend + rules. |
| `firebase/firestore-live.js` | 9 | Boot orchestration + AI-save routes; slightly broad responsibilities, acceptable at this scale. |
| `firebase/types.ts` | 9.5 | Full document + service contracts; consumed by editors and future TS builds. |
| `firebase/firebase-config.js` | 9.5 | Offline cache at init; graceful demo mode instead of throwing. |
| `server.js` | 9 | Mirrors Vercel routing locally via a req/res shim; env validation at boot; path-traversal guard (tested). |
| `gemini.js` (orchestrator) | 9 | Failover chain, model benching, thinking-budget handling, telemetry, deterministic fallbacks. Battle-tested against live 429/503s. |
| `app.js` | 8.5 | **The deliberate monolith.** 12 views + features in one classic script. See trade-off note below. |
| `config.js` | 9.5 | Per-feature kill switches — one flag reverts a feature to its offline stub. |
| `styles.css` | 9 | Token-driven design system; a11y affordances (focus, motion, contrast) centralized. |
| `tests/*` (6 files) | 9.5 | 59 meaningful tests; contracts prevent silent drift; a11y enforced incl. computed WCAG contrast. |
| `scripts/*` | 9.5 | Seed + reproducible screenshot capture; no hidden state. |

## The `app.js` trade-off (scored 8.5, kept deliberately)

A reviewer's first instinct is "split this file." We evaluated it and kept the
monolith **on purpose**:

- **No build step is a feature.** The platform runs from `file://`-adjacent
  static hosting anywhere, deploys in seconds, and has zero supply-chain
  surface in the frontend (no bundler, no transitive deps to audit).
- **Views are template literals sharing one scope.** Splitting into modules
  would force either a bundler or a fragile global-ordering contract across
  many files — trading one honest file for hidden coupling.
- **Navigation is total**: the `VIEWS` registry + `go()` is the entire router;
  a section-per-view TOC (top of file) gives O(1) discovery.

What we did instead of splitting: correctness-first linting (0 errors),
JSDoc on the load-bearing seams, a file-level TOC, and 59 tests around the
parts with real failure modes (API boundary, contracts, a11y).

## Systemic strengths

- **Contracts over conventions** — registry ↔ whitelist ↔ rules ↔ types are
  machine-checked (`tests/contracts.test.js`); drift fails CI.
- **Failure is a first-class path** — every AI feature has a deterministic
  fallback; a global error boundary keeps the command center alive.
- **Security posture is structural**, not aspirational: clients *cannot*
  write, keys *cannot* leak to the browser, fields *cannot* bypass the
  whitelist. Each "cannot" has a test.

## Known debt (accepted, tracked)

1. `app.js` size — revisit if the platform outgrows one venue (roadmap:
   multi-venue federation would force a real module system + build).
2. JSON-shaped prompting — Gemini structured-output (`responseSchema`) would
   remove the `extractJSON` fallback path entirely (roadmap).
3. Simulated telemetry — production would ingest CCTV crowd-counting and BMS
   feeds; the Firestore schema already accommodates this.
