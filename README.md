# ⚽ StadiumOS AI — The Intelligent Operating System for FIFA World Cup 2026

One data model. One AI core. Eight surfaces. **Zero build step — open `index.html` and it runs.**

**Now GenAI-live on every surface:** powered by **Gemini 2.5 Flash** (free tier) through a governed AI Orchestration layer (`gemini.js`), with **Google Search grounding** for live real-world data. Live features: streaming multilingual stadium assistant (chat UI with voice input, suggestion chips, and a 🌐 Live Search toggle), crowd-insight generation grounded in the *real* East Rutherford weather, executive summaries, security recommendations generated from live section densities, per-section Digital Twin analysis, evacuation-plan drafting (human-gated), incident briefings, egress recommendations + real NJ Transit/traffic conditions via grounded search, sustainability optimizations, and 4-language announcement translation. Every call is latency/token-logged to `ai_events` and visible in the AI Control Center; if the API is unreachable the feature degrades to its deterministic stub (§14) — the demo cannot die on stage.

> ⚠ The API key lives in `config.js` for demo simplicity. Rotate it after the hackathon.

## Run it
```
npx http-server -p 4517 .
# or just double-click index.html
```

## 60-second demo script (judges)
1. **Dashboard** — the one-pane-of-glass ops view: live KPIs count up, activity feed streams in real time, Section 105 is flagged amber.
2. Click **Review** on the crowd alert → jumps to **Security** → live heatmap (24 sections, drifting densities) → click **✓ Approve** on the AI steward recommendation → watch Section 105 cool from red to teal on the next tick. *Detection → decision → dispatch, under 10 seconds.*
3. **Emergency** — incident kanban + AI-drafted evacuation plan behind a **human sign-off gate** (no AI output reaches the public without a named approver).
4. **Digital Twin** — click any section for occupancy, flow, and nearest response unit.
5. **AI Control Center** — the governance story: all 26 AI features ship as stubs with typed contracts + deterministic fallbacks; a model goes live only when named and approved in writing. *Responsible GenAI is the architecture, not a slide.*
6. **Fan App** — Mateo's journey in Spanish: seat delivery, accessible wayfinding, AI-timed smart exit.
7. Bottom-left orb → ask *"crowd status"* or *"evacuation plan"*.

## Why it wins
- **One metric above all:** time-to-decision for a human under pressure — fan, guard, medic, or exec.
- **Design system locked** (§0 of the PRD): dark control-room theme, lime/teal accents, glow KPI cards, pulsing live pills, count-up numerals.
- **AI governance first-class** (§14): every AI feature has an input/output contract and a deterministic fallback — the demo is honest about what's stubbed, and swapping in a real model (e.g. `claude-sonnet-5` via the Anthropic API) is a one-config-value change in the assistant's `ANSWERS` layer.
- **Human-in-the-loop for anything dangerous** (§15): evacuation plans and mass notifications require a signed approval, logged to audit.

## Stack
Vanilla HTML/CSS/JS, hand-rolled SVG charts and stadium model, simulated realtime loop (density drift every 3s, activity events every 12s). ~1,200 lines, no dependencies, loads in <100 ms.

Built from `StadiumOS-AI-PRD.md` v1.0.
