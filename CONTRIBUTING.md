# Contributing

## Getting started

```bash
npm install          # installs deps + git hooks (husky)
cp .env.example .env # add your GEMINI_API_KEY + FIREBASE_SERVICE_ACCOUNT
npm run dev          # http://localhost:4517 — no frontend build step
```

## Quality gates (enforced)

Every commit runs the pre-commit hook (**lint-staged + full test suite**), and
every push runs CI (`.github/workflows/ci.yml`). Before opening a PR:

```bash
npm run lint         # ESLint — must be 0 errors, 0 warnings
npm test             # 59 tests — unit · contract · integration · accessibility
npm run test:coverage
npm run format       # Prettier check
```

## Architecture ground rules

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first. The load-bearing rules:

1. **One data model.** UI state and AI prompts both derive from the shared
   stadium state (`S` + Firestore). Never fork a second source of truth.
2. **Clients never write to Firestore.** All writes go through
   `api/firestore.js` (Admin SDK, field-whitelisted). If you add a collection,
   update the registry (`firebase/collections.js`), the whitelist
   (`api/firestore.js`), the rules (`firestore.rules`), and the types
   (`firebase/types.ts`) — the contract tests will fail until all four agree.
3. **Every AI feature degrades deterministically.** A Gemini outage may
   degrade a feature, never crash a surface. New AI calls need a fallback path.
4. **Accessibility is enforced.** 25 automated checks run on every commit;
   icon-only controls need `aria-label`, and new views inherit the
   `applyA11y()` pass automatically.

## Commit style

Imperative subject line, body explains *why*. Keep commits scoped — the
pre-commit hook runs the full suite, so broken intermediate states won't land.
