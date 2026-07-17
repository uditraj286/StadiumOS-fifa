# Security Policy

## Threat model & guarantees

| Surface | Control |
|---|---|
| **Gemini API key** | Server-side only. The browser talks exclusively to the first-party `/api/gemini` proxy; the key never ships to a client. Model names are whitelist-validated (`/^[a-z0-9.-]+$/`) to prevent upstream path injection. |
| **Firestore writes** | Clients hold **zero** write capability — `firestore.rules` denies all client writes. The Admin SDK (service-account credential, server env only) is the single writer, with **per-collection field whitelists** and server-stamped timestamps (clients cannot spoof fields or times). |
| **Firestore reads** | Public dashboard reads only non-sensitive collections; `emergency_alerts` (medical/PII-adjacent) is denied to clients. Deny-by-default rule closes everything else. |
| **Rate limiting** | Per-IP: 30 req/min on the AI proxy, 60 req/min on the write API. |
| **Request validation** | API handlers validate method, collection, op, and id **before** touching credentials; malformed JSON is handled, never thrown. |
| **Secrets hygiene** | `.env` is gitignored; service-account key patterns (`*serviceAccount*.json`, `firebase-adminsdk*.json`) are gitignored; `.env.example` ships placeholders only. |

These guarantees are **contract-tested** — see `tests/api-firestore.test.js`
(whitelist + timestamp spoofing), `tests/api-gemini.test.js` (path injection,
rate limits), and `tests/contracts.test.js` (rules ↔ registry drift, and the
assertion that no rule ever grants client writes).

## Reporting a vulnerability

Open a GitHub issue with the `security` label, or contact the repository owner
directly. Please do not disclose publicly before a fix lands.

## Key rotation

Rotate the Gemini API key and the Firebase service-account key after any
public demo or event. Both live only in server environment variables
(`GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`), so rotation requires no code
change — update the env var and redeploy.
