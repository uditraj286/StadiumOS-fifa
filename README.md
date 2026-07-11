# ⚽ StadiumOS AI — AI Decision Intelligence for Mega-Events

**A live command-and-control platform for FIFA World Cup 2026 stadium operations.**
It doesn't just show dashboards — it *observes, predicts, explains, and recommends*, keeping a human in the loop for every consequential decision.

> **Live demo:** deployed on Vercel (see *Deployment* below).
> **Run locally:** `node server.js` → http://localhost:4517 (zero frontend build step).

---

## 1. Chosen Vertical

**Live operations & safety for mega-events** — the real-time "war room" that runs a stadium on match day.

A FIFA World Cup venue like MetLife Stadium moves ~82,000 people, 40%+ of them international, through gates, concourses, transit, and emergencies, all within a few hours. Today those decisions are made by humans staring at a wall of disconnected screens (CCTV, ticketing, transit, weather, radio). The single metric that decides whether a match day is safe or a disaster is **time-to-decision for a human under pressure** — a guard, a medic, a transport lead, an executive.

StadiumOS AI collapses that wall of screens into **one data model and one governed AI core**, and turns raw telemetry into *decisions with reasons attached*. The same platform generalizes to any mega-event: Olympics, concerts, marathons, airports.

---

## 2. Approach & Logic

The product is built on four architectural commitments:

**a) One data model, many surfaces.** A single live state object (`S` in `app.js`) — attendance, gates, 24 section densities, medical, power, water — is the *only* source of truth. Every view and every AI call reads from it (serialized by `stadiumContext()`), so the dashboards never disagree with the AI.

**b) AI as a decision engine, not a chatbot.** The flagship surfaces (**Stadium Brain**, **Predictive Mission Control**, **Emergency Intelligence**) all follow the same loop:
> **What is happening? → What will happen next? → Why? → What should we do? → What's the expected result?**
Every recommendation carries a **confidence score, risk level, expected improvement, and the alternatives it rejected** — explainable AI, not a black box.

**c) A governed AI orchestration layer.** All model access goes through `gemini.js` (`AI.call` / `AI.stream`), never directly. This layer provides:
- a **model failover chain** (`gemini-2.5-flash → flash-lite → 2.0-flash → 2.0-flash-lite`) that walks down on `429`/`503` to stay inside the free tier;
- **per-feature config flags** (`config.js`) — flip one flag and a feature reverts to its deterministic offline stub;
- **latency/token logging** to `ai_events`, visible in the AI Control Center;
- **JSON extraction + schema-shaped prompts** so model output is safe to render.

**d) Human-in-the-loop for anything consequential.** Evacuation plans, mass notifications, resource dispatch, and Emergency Mode all require a **named human sign-off** that is logged to an audit trail. No AI output reaches the public or moves a unit without approval.

---

## 3. How the Solution Works

**Frontend** — vanilla HTML/CSS/JS, no framework, no build step. `app.js` renders 11 operational surfaces from a view registry; `styles.css` is a locked design system (dark control-room theme, lime/teal accents). A simulated realtime loop drifts section densities every 3s and streams activity events every 12s so the board feels alive.

**API** — a thin Node proxy (`server.js` locally, `api/*.js` serverless functions on Vercel) that:
1. keeps the Gemini API key **server-side only** — the browser only ever talks to our own `/api/gemini`;
2. validates the model parameter against a whitelist (no path injection);
3. rate-limits to 30 calls/min per IP;
4. streams Server-Sent Events back for the typewriter chat.

**AI surfaces (40+ GenAI features), a sample:**

| Surface | What the AI does |
|---|---|
| **Stadium Brain** | One-cycle decision (situation → prediction → reason → recommendation → result) + confidence/risk scores, reasoning engine ("why is P3 full?"), spoken executive brief, scorecard, venue learning |
| **Mission Control** | "What-if" disaster simulator, predictive horizon (5/15/30 min), report trust-scoring, crowd emotion map, root-cause explorer, operational twin score |
| **Emergency** | One-click **Emergency Mode** digital commander, voice copilot, dynamic evac routes, medical triage engine, stampede prediction, responder optimizer, zone-targeted broadcast, family reunification, hospital coordination, auto-generated incident report |
| **Security** | Live crowd heatmap, threat action-orders, acoustic anomaly classification, multilingual safety broadcast, lost-person AI matching |
| **Fan App** | Crowd-aware wayfinding, seat delivery, multilingual assistant, personal exit planner, accessible & sensory-friendly routing |

**Command palette** — the top search bar (`Ctrl/⌘ + K`) searches pages, sections (with live density), incidents, people, and one-shot actions; anything unmatched falls back to *"Ask AI"*.

**Graceful degradation** — if Gemini is unreachable, every feature falls back to a deterministic stub. *The demo cannot die on stage.*

---

## 4. Assumptions Made

- **Sensor/CCTV/ticketing/transit feeds are simulated.** The realtime loop stands in for what would, in production, be live camera analytics, turnstile counts, and transit APIs. The *architecture* (one data model → AI context → decisions) is production-shaped; only the data source is mocked.
- **Actions are simulated with audit logging, not wired to hardware.** "Open Gate 5", "dispatch M-1", "send broadcast" record a signed, timestamped audit entry rather than actuating a real gate or PA — appropriate and safe for a demo.
- **Single venue** (MetLife Stadium) with one live match (MEX 1–0 RSA, 63'). Cross-stadium/mutual-aid features are modeled against plausible sibling venues.
- **Gemini free tier**, model named and approved in config; the failover chain and stubs exist precisely because free-tier quota is finite.
- **The deployed build is open-access** (no login) so judges can evaluate immediately. A MongoDB-backed auth layer with roles was prototyped separately and is not part of the public demo.
- Grounded features (weather, transit) assume Google Search grounding is available for that model.

---

## 5. Evaluation Focus Areas

### 🧱 Code Quality
- **Clear separation of concerns:** `config.js` (feature flags), `gemini.js` (AI orchestration), `app.js` (views + logic), `server.js`/`api/` (proxy). One data model, one AI entry point.
- **Readable, self-documenting patterns:** a view registry, small pure helper components (`kpi`, `qrow`, `brainBlock`), and consistent async feature functions (`busy()` → `AI.call` → render → `pushActivity`).
- **No framework lock-in, no build step, no transpile** — the whole app is inspectable as-is. ~2,000 lines, loads in well under 100 ms.

### 🔒 Security
- **API key never ships to the browser** — it lives only in an environment variable, read server-side by the proxy. The client only ever calls same-origin `/api/*`.
- **Input validation & isolation:** model names are whitelisted (`/^[a-z0-9.\-]+$/`), static file serving blocks path traversal, request bodies are size-capped.
- **Rate limiting** (30/min per IP) on the AI proxy to protect quota and prevent abuse.
- **XSS-safe rendering:** all model/user text passes through an escaping `md()` renderer before insertion; user input is escaped in chat.
- **Responsible AI governance:** human sign-off gates on evacuation/broadcast/dispatch, deterministic fallbacks, and no PII collected or stored.

### ⚡ Efficiency
- **Zero frontend dependencies** — no React/bundler tax; instant load, tiny payload.
- **Model failover chain** keeps calls inside the free tier instead of failing on quota.
- **SSE streaming** so the assistant renders tokens as they arrive (no full-payload waits).
- **Serverless functions** scale to zero and per-request on Vercel; the proxy is a stateless pass-through.
- Token/latency accounting per call surfaced in the AI Control Center.

### ✅ Testing / Validation
- **Health endpoint** `GET /api/health` reports whether the key is configured.
- **Deterministic fallbacks are the test harness for failure:** disable a flag in `config.js` (or pull the key) and every feature is verified to degrade to a safe stub rather than break.
- **Manual validation matrix:** each AI surface was driven end-to-end in-browser (assistant, Emergency Mode, triage, Brain cycle, search) and confirmed to render live Gemini output, with the failover chain observed handling `429`s automatically.
- To validate quickly: open the app, hit `Ctrl+K` → `brief` → Enter (voice exec brief), then **Emergency → Activate Emergency Mode**.

### ♿ Accessibility
- **Inclusive by design, not as an afterthought:** the Fan App includes a **wheelchair / step-free routing mode** (elevators & ramps only, avoids dead elevators) and a **sensory-friendly mode** (routes around loud/bright/crowded zones).
- **Multilingual throughout** — assistant, announcements, and safety broadcasts render in EN/ES/FR/AR/PT; the fan assistant mirrors the user's language.
- **Voice input & output** — Web Speech API for hands-free commands and a spoken executive brief (screen-free operation).
- **Keyboard-first navigation** — `Ctrl/⌘+K` search, full arrow-key/Enter/Esc control of the command palette.
- **Fully responsive** — one codebase adapts from mobile → tablet → laptop → desktop (drawer nav on small screens, no horizontal overflow, scalable SVG).
- Semantic buttons, high-contrast dark theme, legible type scale.

---

## Deployment

Hosted on **Vercel** as static frontend + serverless API functions.

```bash
# one-time
npm i -g vercel      # or use npx
vercel login

# deploy
vercel --prod

# set the API key (server-side only — never commit it)
vercel env add GEMINI_API_KEY production
vercel --prod        # redeploy so the env var takes effect
```

Local development:
```bash
node server.js       # http://localhost:4517  (reads GEMINI_API_KEY from .env)
```

The `.env` file is git-ignored; on Vercel the key is set as a project environment variable. **Rotate the key after the event.**

## Stack
Vanilla HTML/CSS/JS · hand-rolled SVG charts & stadium model · Node serverless proxy · Google Gemini via a governed orchestration layer with failover & deterministic fallbacks · simulated realtime loop. No frontend dependencies.
