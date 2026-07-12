# Firebase Firestore — Real-Time Data Layer

StadiumOS AI uses **Firebase Firestore** as the live source of truth. The
dashboard reads collections in real time via snapshot listeners (no page
refresh, ever); every write goes through a backend Admin API, so the client can
**read but never write**.

Until you paste real credentials, the app runs in **DEMO MODE** — the local
simulated state drives every view and Firestore stays dormant. Nothing breaks;
you flip to live by completing the steps below.

---

## Architecture at a glance

```
                    ┌─────────────────────────── Browser (client) ───────────────────────────┐
                    │  firebase/                                                               │
  Gemini result ──▶ │   firebase-config.js   → inits Firestore (SDK v11 modular, offline cache)│
                    │   firestore-service.js → getX / subscribeX  (READS, client SDK)          │
                    │   use-firestore.js     → shared listener stores ("hooks")                 │
                    │   firestore-live.js    → boots listeners, live KPIs + notifications       │
                    └───────────────┬───────────────────────────────▲──────────────────────────┘
              WRITE (POST /api/firestore)                      READ (onSnapshot, real-time)
                                    │                                 │
                    ┌───────────────▼─────────────────┐               │
                    │  api/firestore.js (Admin SDK)    │               │
                    │  validates + writes with the     │──────────────▶│  Firestore
                    │  service-account key (server)    │   (rules bypassed on server)
                    └──────────────────────────────────┘
```

`firestore.rules` denies all client writes (`allow write: if false`) and opens
reads only on non-sensitive collections. The Admin SDK bypasses rules, so the
server is the single writer.

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Once created, open **Build → Firestore Database → Create database**.
   - Start in **production mode** (we ship our own rules below).
   - Pick a region close to your users.

## 2. Add the web app config (public — safe in the browser)

1. **Project settings** (gear) → **General** → **Your apps** → **Web** (`</>`).
2. Register the app, then copy the `firebaseConfig` values.
3. Paste them into **`firebase/firebase-config.public.js`**, replacing every
   `REPLACE_WITH_...` placeholder. These values are **not secret** — access is
   controlled by security rules, not by hiding the config.

## 3. Add the Admin service account (secret — server only)

1. **Project settings** → **Service accounts** → **Generate new private key**.
   A JSON file downloads. **Never commit it.**
2. Provide it to the server:
   - **Local dev:** save it as `serviceAccountKey.json` in the project root and
     set `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json` in `.env`,
     **or** paste the JSON (one line) as `FIREBASE_SERVICE_ACCOUNT=` in `.env`.
   - **Vercel:** Project → **Settings → Environment Variables** → add
     `FIREBASE_SERVICE_ACCOUNT` = the full JSON string. (Vercel escapes the
     private key's newlines; `api/firestore.js` un-escapes them automatically.)

See `.env.example` for the exact format.

## 4. Deploy the security rules + indexes

Install the Firebase CLI once (`npm i -g firebase-tools`), then:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

(`firebase.json`, `firestore.rules`, and `firestore.indexes.json` are already in
the repo.)

## 5. Seed demo data (optional, recommended)

With credentials in `.env`:

```bash
npm install        # installs firebase-admin
npm run seed       # writes one document to every collection
```

## 6. Run it

```bash
npm run dev        # local server on http://127.0.0.1:4517
```

Open the console — you should see `[Firestore] Live — project: <id>` instead of
the demo-mode warning. Generate any AI insight (e.g. **Mission Control → refresh
horizon**, or **Sustainability → Generate new**) and watch the corresponding
collection update the dashboard live, with no refresh.

---

## Collections

| Collection          | Public read | Written by            | Key fields (see `firebase/types.ts`)                              |
|---------------------|:-----------:|-----------------------|-------------------------------------------------------------------|
| `stadium_status`    | ✅          | backend               | crowdDensity, occupancyPercentage, weather, stadiumHealthScore …  |
| `crowd_predictions` | ✅          | backend (Gemini)      | zone, currentCrowd, predictedCrowd, riskLevel, confidence …       |
| `emergency_alerts`  | ❌ (sensitive) | backend (Gemini)   | title, type, severity, location, status, aiRecommendation …       |
| `transport`         | ✅          | backend               | parkingOccupancy, shuttleStatus, metroStatus, estimatedExitTime … |
| `sustainability`    | ✅          | backend (Gemini)      | energyUsage, waterUsage, carbonEmission, aiSuggestion …           |
| `ai_reports`        | ✅          | backend (Gemini)      | title, summary, generatedBy, timestamp                            |
| `notifications`     | ✅          | backend               | title, message, priority, read, createdAt                         |

## AI → Firestore auto-save

When Gemini generates a result, the app persists it automatically:

| AI feature (in `app.js`)          | `Firestore.save(kind)` | Collection          |
|-----------------------------------|------------------------|---------------------|
| Predictive horizon (`genHorizon`) | `crowd`, `report`      | crowd_predictions, ai_reports |
| Multi-hazard (`prioritizeHazards`)| `emergency`            | emergency_alerts    |
| Sustainability (`genSustain`)     | `sustainability`       | sustainability      |
| Egress advice (`genEgress`)       | `report`              | ai_reports          |
| Post-incident (`genFinalReport`)  | `incident`            | ai_reports          |

`window.Firestore.save(kind, data)` POSTs to `/api/firestore`; the Admin SDK
validates against the field whitelist and writes; the change streams back to
every connected dashboard via `onSnapshot`.

## Performance & resilience

- **One shared listener per collection+query** (`use-firestore.js`) — N widgets
  on the same data cost one listener, not N.
- **`limitTo` + `orderBy`** on every listener caps document reads.
- **Offline cache** (`persistentLocalCache`, multi-tab) serves reads with no
  network; the UI marks cached state via `fromCache`.
- **`online`/`offline` handlers** toast the operator and pause/resume the network.
- Listener errors surface through `SubscriptionState.error` instead of throwing.
