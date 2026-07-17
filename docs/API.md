# API Reference — StadiumOS AI

All privileged operations run through three first-party endpoints. The browser
never holds credentials; every endpoint is rate-limited per IP and validates
input **before** touching secrets.

Base URL: the deployment origin (e.g. `https://stadiumos-ai-five.vercel.app`).
Locally, `server.js` serves identical routes on `:4517`.

---

## `GET /api/health`

Liveness + configuration check.

**Response `200`**
```json
{ "ok": true, "key": true, "auth": false }
```
| Field | Meaning |
|---|---|
| `ok` | server reachable |
| `key` | `GEMINI_API_KEY` configured server-side |
| `auth` | open-access mode (no accounts required) |

---

## `POST /api/gemini?model={model}&stream={0|1}`

Server-side proxy to Google Gemini — exists so the API key never reaches the
browser. Forwards the request body verbatim to
`generativelanguage.googleapis.com` and relays the response (SSE when
`stream=1`).

| Query param | Rules |
|---|---|
| `model` | must match `/^[a-z0-9.-]+$/` (prevents upstream path injection). Default `gemini-flash-latest`. |
| `stream` | `1` → Server-Sent Events for token streaming |

**Body:** a Gemini `generateContent` payload (`contents`, `systemInstruction`,
`generationConfig`, optional `tools`).

**Errors**
| Status | Cause |
|---|---|
| `405` | non-POST |
| `503` | `GEMINI_API_KEY` not configured |
| `429` | > 30 requests/min from one IP |
| `400` | model fails the whitelist |
| `502` | upstream unreachable |

Upstream `429`/`503` are relayed as-is — the client orchestrator (`gemini.js`)
reacts by walking its model failover chain.

---

## `POST /api/firestore`

The **single writer** for the entire database. Uses the Firebase Admin SDK
(service-account credential, server env only); `firestore.rules` denies all
client writes, so this endpoint is the only mutation path.

**Body**
```json
{ "op": "add | update | delete", "collection": "<name>", "id": "<doc id>", "data": { } }
```

| Rule | Enforcement |
|---|---|
| `collection` must be one of the 9 registered collections | `400` otherwise |
| `op` ∈ `add`/`update`/`delete`; `update`/`delete` require `id` | `400` otherwise |
| `data` is filtered through a **per-collection field whitelist** | unknown fields silently dropped |
| Timestamp fields (`createdAt`/`updatedAt`/`timestamp`/`lastUpdated`) | always server-stamped; client-supplied values are discarded |
| Rate limit | 60 requests/min per IP → `429` |

**Response `200`**
```json
{ "ok": true, "id": "generated-or-supplied-doc-id" }
```

**Errors:** `405` non-POST · `400` validation · `429` rate limit ·
`503` service account not configured · `500` write failure (logged).

All validation behavior is covered by `tests/api-firestore.test.js` and
exercised over real HTTP in `tests/integration-server.test.js`.

---

## Client data access (reads)

Reads never go through an API — clients subscribe directly to Firestore with
the web SDK (`firebase/firestore-service.js`):

- `subscribeCollection(name, cb, {orderByField, limitTo, where})` — realtime
- `subscribeDocument(name, id, cb)` — realtime
- `getCollection` / `getDocument` — one-shot

Access control lives in `firestore.rules`: public read on the 8 non-sensitive
collections, `emergency_alerts` denied, everything else deny-by-default.
