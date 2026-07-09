/* ═══════════ StadiumOS AI — app core ═══════════ */
const $ = s => document.querySelector(s);
const views = $('#views');

/* ───── Simulated live state (single data model — §13) ───── */
const S = {
  attendance: 82450, gates: 96, crowdAvg: 61, medical: 4, powerMW: 38.2, waterM3: 512,
  sections: [], incidents: [], feed: [],
};
const SEC_NAMES = [];
for (let ring = 1; ring <= 2; ring++) for (let i = 0; i < 12; i++) SEC_NAMES.push(`${ring}${String(i+1).padStart(2,'0')}`);
S.sections = SEC_NAMES.map(n => ({ id: n, density: 30 + Math.random()*45 }));
S.sections[4].density = 88; // Section 105 — hot
S.sections[13].density = 79;

const heatColor = d => d > 85 ? '#E8433B' : d > 70 ? '#F0A63B' : d > 50 ? '#2DD9C4' : '#3a4d3f';
const fmt = n => n.toLocaleString('en-US');
const now = () => new Date().toLocaleTimeString('en-US', {hour12:false});

/* ───── View registry ───── */
const VIEWS = {

dashboard: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Dashboard Overview</div>
  <div class="view-sub">Welcome back, Priya. One pane of glass — all systems nominal except Section 105.</div></div>
  <button class="btn btn-lime">⇧ &nbsp;Broadcast Update</button>
</div>

<div class="grid-4">
  ${kpi('☺','chip-lime','glow-lime','Live Attendance','<span data-count="82450">0</span>','+12.5%','delta-up','vs gate forecast')}
  ${kpi('▤','chip-lime','glow-lime','Gates Open','<span data-count="96">0</span>/104','+8','delta-up','2 opening soon')}
  ${kpi('◍','chip-teal','glow-teal','Avg Crowd Density','<span data-count="61">0</span>%','+4.1%','delta-warn','Section 105 at 88%')}
  ${kpi('♥','chip-teal','glow-teal','Fan Sentiment','8.4','+2.1%','delta-up','from last match')}
</div>
<div class="grid-4" style="margin-top:18px">
  ${kpi('⚡','chip-amber','glow-amber','Power Draw','<span id="kpiPower">38.2</span> MW','−6%','delta-up','AI-optimized')}
  ${kpi('💧','chip-teal','glow-teal','Water Usage','<span data-count="512">0</span> m³','−11%','delta-up','vs baseline')}
  ${kpi('✚','chip-red','glow-red','Medical Alerts','<span id="kpiMed">4</span>','2 active','delta-warn','avg response 74s')}
  ${kpi('⇄','chip-lime','glow-lime','Transit Load','72%','stable','delta-up','surge in 40 min')}
</div>

<div class="section-row"><div class="section-title">Live &amp; Upcoming Matches</div><button class="link" onclick="go('twin')">View all →</button></div>
<div class="grid-3">
  ${match('🇲🇽','🇿🇦','Group A','Jun 12','22:00','245,000',true)}
  ${match('🇨🇦','🇧🇦','Group B','Jun 13','22:00','248,000',true)}
  ${match('🇶🇦','🇨🇭','Group C','Jun 14','22:00','255,000',false)}
</div>

<div class="split-21" style="margin-top:26px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Operational Alert Queue</div><button class="link">Manage queue →</button></div>
    ${qrow('🌡','rgba(232,67,59,.14)','Crowd threshold — Section 105','Density 88% and rising · AI recommends steward reallocation','pill-pending','Pending','review-105')}
    ${qrow('🔧','rgba(240,166,59,.14)','Turnstile T-14 fault (Gate C)','Auto-ticket from fan photo · vision AI classified: jam','pill-warn','Triaged','')}
    ${qrow('📋','rgba(45,217,196,.12)','Incident #2231 report','AI summary drafted · awaiting supervisor sign-off','pill-teal','Draft','')}
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 6px"><div class="section-title">Recent Activity</div><button class="link">View all →</button></div>
    <div id="activityFeed">
      ${act('🚑','chip-red','Medical dispatched','Unit M-3 → Section 114','2m ago')}
      ${act('✓','chip-lime','Alert resolved','Gate B queue normalized','6m ago')}
      ${act('⚠','chip-amber','Stream quality alert','CCTV node 7 buffering','8m ago')}
      ${act('▶','chip-teal','Match started','MEX vs RSA — kickoff','1h ago')}
    </div>
  </div>
</div>

<div class="section-row"><div class="section-title">AI Insights</div>
  <div style="display:flex;gap:10px;align-items:center">
    <span class="pill pill-ok"><span class="dot dot-lime pulse"></span>gemini-2.5-flash</span>
    <button class="btn btn-ghost" onclick="genInsights(this)">↻ Regenerate live</button>
    <button class="btn btn-lime" onclick="genExecSummary(this)">✦ Executive Summary</button>
  </div></div>
<div id="execSummary"></div>
<div class="grid-3" id="insightCards">
  <div class="card"><div class="qtitle">🔮 Crowd prediction</div><div class="act-sub" style="margin-top:8px;line-height:1.6">Halftime concourse surge predicted in <b style="color:var(--accent-lime)">38 min</b>. Sections 104–107 will exceed 80% density. Pre-position 6 stewards at Ramp C.</div></div>
  <div class="card"><div class="qtitle">🍔 Food inventory</div><div class="act-sub" style="margin-top:8px;line-height:1.6">Concourse B will exhaust cold beverages by minute 71 at current velocity. Restock run scheduled — saves an estimated <b style="color:var(--accent-teal)">2,400 lost sales</b>.</div></div>
  <div class="card"><div class="qtitle">🌦 Weather impact</div><div class="act-sub" style="margin-top:8px;line-height:1.6">Rain probability 64% post-match. Expect covered-transit demand +30%. Transport dashboard notified automatically.</div></div>
</div>`,

security: () => `
<div class="view-head"><div class="view-title">Security Dashboard</div>
<div class="view-sub">Live crowd heatmap · AI-flagged anomalies surface first · detection → dispatch target &lt; 90s</div></div>
<div class="split-21">
  <div class="card">
    <div class="section-row" style="margin:0 0 12px"><div class="section-title">Live Crowd Heatmap</div>
    <span class="pill pill-live"><span class="dot dot-red pulse"></span>LIVE · 24 sections</span></div>
    ${stadiumSVG()}
    <div class="legend">
      <span><i class="sw" style="background:#3a4d3f"></i>&lt;50% nominal</span>
      <span><i class="sw" style="background:#2DD9C4"></i>50–70% busy</span>
      <span><i class="sw" style="background:#F0A63B"></i>70–85% watch</span>
      <span><i class="sw" style="background:#E8433B"></i>&gt;85% intervene</span>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-title" style="margin-bottom:12px">Threat Alerts</div>
      ${qrow('🔴','rgba(232,67,59,.14)','Density surge — Section 105','ETA to threshold: 8 min · confidence 91%','pill-pending','Act now','sec-105')}
      ${qrow('👁','rgba(240,166,59,.14)','Unattended bag — Gate D','CCTV-flagged · steward en route','pill-warn','Dispatched','')}
      ${qrow('🚧','rgba(45,217,196,.12)','Ramp C flow anomaly','Counter-flow detected, minor','pill-teal','Monitor','')}
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">AI Recommendation</div>
      <button class="btn btn-ghost" onclick="genSecRec(this)" style="padding:6px 13px;font-size:11px">✦ Regenerate</button></div>
      <div class="act-sub" id="secRec" style="line-height:1.65">Reallocate <b style="color:var(--text-primary)">6 stewards</b> from Gate A (idle) to Section 105 concourse. Predicted density peak drops 88% → 74%.</div>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn-lime" onclick="approveRec(this)">✓ Approve</button>
        <button class="btn btn-ghost" onclick="editPlan('secRec',this)">✎ Modify</button>
        <button class="btn btn-ghost" onclick="rejectPlan('secRec',this,'Recommendation')">✕ Reject</button>
      </div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Gate Flow Advisor</div>
      <button class="btn btn-ghost" onclick="genGateRec(this)" style="padding:6px 13px;font-size:11px">✦ Advise</button></div>
      <div class="act-sub" id="gateRec" style="line-height:1.65">96/104 gates open. Ask the AI which gates to open, close, or re-staff based on live flow.</div>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn-lime" onclick="approvePlan('gateRec',this,'Gate plan')">✓ Approve</button>
        <button class="btn btn-ghost" onclick="editPlan('gateRec',this)">✎ Modify</button>
        <button class="btn btn-ghost" onclick="rejectPlan('gateRec',this,'Gate plan')">✕ Reject</button>
      </div>
    </div>
  </div>
</div>
<div class="section-row"><div class="section-title">Camera Grid — AI-flagged first</div><button class="link">All 214 cameras →</button></div>
<div class="grid-4">
  ${cam('CAM-105-N','Section 105','flagged: density')}${cam('CAM-D-02','Gate D','flagged: object')}
  ${cam('CAM-C-RAMP','Ramp C','flagged: flow')}${cam('CAM-114-S','Section 114','nominal')}
</div>`,

emergency: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Emergency Command Center</div>
  <div class="view-sub">Live incident board · every dispatch decision in &lt; 30s</div></div>
  <button class="btn btn-red">⚠ &nbsp;Mass Notification</button>
</div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('⏱','chip-lime','glow-lime','Avg Response','74s','−12s','delta-up','target < 90s')}
  ${kpi('🚑','chip-red','glow-red','Units Available','11/14','3 deployed','delta-warn','2 medical · 1 security')}
  ${kpi('📋','chip-teal','glow-teal','Open Incidents','5','2 critical','delta-warn','vs 9 last match')}
  ${kpi('✓','chip-lime','glow-lime','Resolved Today','23','+18%','delta-up','faster than baseline')}
</div>
<div class="kanban">
  ${kanCol('REPORTED', [
    ['Fan collapse — Sec 114 row 22','sev-hi','HIGH','AI triage: probable heat syncope','2m'],
    ['Spilled liquid — Concourse B','sev-lo','LOW','Cleaning queue auto-added','5m']])}
  ${kanCol('DISPATCHED', [
    ['Crowd surge watch — Sec 105','sev-hi','HIGH','6 stewards en route · ETA 3m','4m'],
    ['Unattended bag — Gate D','sev-md','MED','Security unit S-2 · ETA 1m','7m']])}
  ${kanCol('ON-SCENE', [
    ['Medical — Sec 114','sev-hi','HIGH','Unit M-3 treating · stable','1m']])}
  ${kanCol('RESOLVED', [
    ['Gate B queue overflow','sev-md','MED','Rerouted via Gate A · AI-suggested','12m'],
    ['Turnstile T-14 jam','sev-lo','LOW','Maintenance closed ticket','26m']])}
</div>
<div class="card" style="margin-top:20px">
  <div class="section-row" style="margin:0 0 10px"><div class="section-title">AI Evacuation Plan — Section 105 (draft)</div>
  <div style="display:flex;gap:10px;align-items:center">
    <span class="pill pill-warn"><span class="dot dot-amber"></span>Human approval required</span>
    <button class="btn btn-ghost" onclick="genEvacPlan(this)">✦ Regenerate with Gemini</button>
    <button class="btn btn-ghost" onclick="genIncidentBrief(this)">✦ AI Incident Briefing</button>
  </div></div>
  <div class="act-sub" id="evacText" style="line-height:1.7;white-space:pre-wrap">Route 105 → Vomitory 105-W → Ramp C → Gate C (capacity 4,200/min). Contraflow barrier at Concourse junction B4. Est. clear time 6m 40s for 3,850 occupants. Broadcast in EN/ES/FR simultaneously.</div>
  <div id="incidentBrief"></div>
  <div style="display:flex;gap:10px;margin-top:14px">
    <button class="btn btn-lime" onclick="approvePlan('evacText',this,'Evacuation plan')">✓ Approve &amp; sign</button>
    <button class="btn btn-ghost" onclick="editPlan('evacText',this)">✎ Edit plan</button>
    <button class="btn btn-ghost" onclick="rejectPlan('evacText',this,'Evacuation plan')">✕ Reject</button>
  </div>
</div>`,

twin: () => `
<div class="view-head"><div class="view-title">Stadium Digital Twin</div>
<div class="view-sub">MetLife Stadium · live overlays · click any section to drill down</div></div>
<div class="split-21">
  <div class="card">
    <div class="section-row" style="margin:0 0 12px"><div class="section-title">Live Model</div>
      <div style="display:flex;gap:8px">
        <button class="pill pill-ok" onclick="toast('Layer toggled','Crowd density overlay')">Crowd</button>
        <button class="pill pill-dim" onclick="toast('Layer toggled','Temperature overlay')">Temp</button>
        <button class="pill pill-dim" onclick="toast('Layer toggled','Incident overlay')">Incidents</button>
        <button class="pill pill-dim" onclick="toast('Layer toggled','Cleaning routes')">Cleaning</button>
      </div></div>
    ${stadiumSVG(true)}
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card"><div class="section-title" style="margin-bottom:12px">Section Drill-down</div>
      <div id="secDetail"><div class="act-sub">Click a section on the model.</div></div></div>
    <div class="card"><div class="section-title" style="margin-bottom:12px">Environment</div>
      ${row2('Pitch temp','24.1 °C')}${row2('Concourse temp','27.8 °C')}${row2('Humidity','58%')}${row2('Noise level','96 dB')}${row2('Air quality (AQI)','41 — good')}
    </div>
  </div>
</div>`,

transport: () => `
<div class="view-head"><div class="view-title">Transport Dashboard</div>
<div class="view-sub">Zero surprise congestion — surge predicted 40 min before it forms</div></div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('🚇','chip-teal','glow-teal','Transit Load','72%','stable','delta-up','Meadowlands line')}
  ${kpi('🅿','chip-lime','glow-lime','Parking Occupancy','84%','Lot F full','delta-warn','AI rerouting to Lot H')}
  ${kpi('🚌','chip-teal','glow-teal','Shuttle Headway','4.2 min','−0.8','delta-up','18 units running')}
  ${kpi('🛣','chip-amber','glow-amber','Road Congestion','Moderate','Rt-3 W slow','delta-warn','clears est. 21:40')}
</div>
<div class="split-21">
  <div class="card">
    <div class="section-title" style="margin-bottom:6px">Departure Surge Forecast</div>
    <div class="act-sub">Predicted egress demand by mode, next 3 hours</div>
    <div class="chart-wrap">${surgeChart()}</div>
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:12px">Parking by Zone</div>
    ${pRow('Lot A — VIP','62%','var(--accent-teal)')}${pRow('Lot C — General','78%','var(--accent-teal)')}
    ${pRow('Lot F — General','98%','var(--accent-red)')}${pRow('Lot H — Overflow','31%','var(--accent-lime)')}
    ${pRow('Rideshare Zone','88%','var(--accent-amber)')}
    <div class="card" style="margin-top:14px;padding:14px;background:rgba(198,241,53,.05);border-color:rgba(198,241,53,.2)">
      <div style="display:flex;justify-content:space-between;align-items:center"><div class="qtitle" style="font-size:12.5px">✦ AI recommendation</div>
      <button class="btn btn-ghost" onclick="genEgress(this)" style="padding:5px 11px;font-size:10.5px">✦ Regenerate</button></div>
      <div class="act-sub" id="egressRec" style="margin-top:5px;line-height:1.55">Push notification to 12,400 fans parked in Lot F: delay departure 15 min or reroute to Gate H exit. Predicted queue cut: 34%.</div>
    </div>
    <div class="card" style="margin-top:12px;padding:14px;background:rgba(198,241,53,.04);border-color:rgba(198,241,53,.2)">
      <div class="qtitle" style="font-size:12.5px">✦ Fan Exit Planner — per-seat, per-mode</div>
      <div class="act-sub" style="margin:8px 0">Every fan gets a personal exit plan pushed at the 80th minute.</div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <select id="exitSec" style="flex:1;background:var(--bg-canvas);color:var(--text-primary);border:1px solid var(--border-hairline);border-radius:10px;padding:9px;font-size:12px">
          <option>Sec 233 (upper)</option><option>Sec 105 (lower)</option><option>Sec 132 (accessible)</option>
        </select>
        <select id="exitMode" style="flex:1;background:var(--bg-canvas);color:var(--text-primary);border:1px solid var(--border-hairline);border-radius:10px;padding:9px;font-size:12px">
          <option>🚆 Rail</option><option>🚗 Lot F car</option><option>🚕 Rideshare</option><option>♿ Accessible shuttle</option>
        </select>
      </div>
      <button class="btn btn-lime" style="width:100%;padding:9px" onclick="genExitPlan(this)">Generate my exit plan</button>
      <div id="exitPlanOut"></div>
    </div>
    <div class="card" style="margin-top:12px;padding:14px;background:rgba(45,217,196,.05);border-color:rgba(45,217,196,.2)">
      <div style="display:flex;justify-content:space-between;align-items:center"><div class="qtitle" style="font-size:12.5px">🌐 Real-world transit — Google Search</div>
      <button class="btn btn-ghost" onclick="genTransit(this)" style="padding:5px 11px;font-size:10.5px">Check live</button></div>
      <div class="act-sub" id="transitLive" style="margin-top:5px;line-height:1.55">Query live NJ Transit / road conditions around MetLife Stadium via grounded Gemini.</div>
    </div>
  </div>
</div>`,

sustainability: () => `
<div class="view-head"><div class="view-title">Sustainability Dashboard</div>
<div class="view-sub">Live ESG telemetry — dashboards match the end-of-day audit, not vibes</div></div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('⚡','chip-lime','glow-lime','Energy','38.2 MW','−6%','delta-up','vs pre-AI baseline')}
  ${kpi('💧','chip-teal','glow-teal','Water','512 m³','−11%','delta-up','smart-fixture savings')}
  ${kpi('♻','chip-lime','glow-lime','Waste Diversion','78%','+9%','delta-up','target 75% ✓')}
  ${kpi('🌫','chip-teal','glow-teal','Carbon (est.)','41 t CO₂e','−14%','delta-up','per-match basis')}
</div>
<div class="split-21">
  <div class="card">
    <div class="section-title" style="margin-bottom:6px">Energy Profile — Matchday</div>
    <div class="act-sub">MW draw, actual vs AI-optimized schedule</div>
    <div class="chart-wrap">${energyChart()}</div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 12px"><div class="section-title">AI Optimization Queue</div>
    <button class="btn btn-ghost" onclick="genSustain(this)" style="padding:6px 13px;font-size:11px">✦ Generate new</button></div>
    <div id="sustainQueue"></div>
    ${qrow('❄','rgba(45,217,196,.12)','Pre-cool bowl 30 min earlier','Saves 1.8 MWh vs reactive HVAC','pill-ok','Applied','')}
    ${qrow('💡','rgba(198,241,53,.12)','Dim concourse LEDs 20% at halftime','Crowd density permits · saves 0.4 MWh','pill-teal','Pending','')}
    ${qrow('🚿','rgba(45,217,196,.12)','Stagger pitch irrigation','Off-peak water pricing window','pill-ok','Applied','')}
  </div>
</div>`,

aicenter: () => {
  const feats=Object.entries(STADIUM_CONFIG.features);
  const liveN=feats.filter(([,f])=>f.live).length;
  const calls=AI.events.length, fb=AI.events.filter(e=>e.fallback).length;
  const okLat=AI.events.filter(e=>!e.fallback).map(e=>e.latency);
  const avgLat=okLat.length?Math.round(okLat.reduce((a,b)=>a+b,0)/okLat.length):0;
  const toks=AI.events.reduce((a,e)=>a+e.tokens,0);
  return `
<div class="view-head"><div class="view-title">AI Control Center</div>
<div class="view-sub">Model activated: <b style="color:var(--accent-lime)">gemini-2.5-flash</b> (Google Generative Language API) — named &amp; approved by product owner. Deterministic fallback armed on every feature.</div></div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('✦','chip-lime','glow-lime','Live Features',`${liveN}/${feats.length}`,'gemini-2.5-flash','delta-up','one flag each')}
  ${kpi('⚡','chip-teal','glow-teal','Avg Latency',avgLat?`${fmt(avgLat)} ms`:'—',`${calls} calls`,'delta-up','this session')}
  ${kpi('🛡','chip-amber','glow-amber','Fallback Rate',calls?`${Math.round(fb/calls*100)}%`:'0%',`${fb} events`,fb?'delta-warn':'delta-up','target < 2%')}
  ${kpi('🪙','chip-teal','glow-teal','Tokens Used',fmt(toks),'free tier','delta-up','logged to ai_events')}
</div>
<div class="split-21">
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-title" style="margin-bottom:8px">Feature Status Board</div>
      <table class="table">
        <tr><th>Feature</th><th>Model</th><th>Status</th></tr>
        ${feats.map(([k,f])=>`<tr><td style="font-weight:600">${f.label}</td>
          <td class="mono" style="color:var(--text-secondary)">${f.live?STADIUM_CONFIG.model:'—'}</td>
          <td>${f.live?'<span class="pill pill-ok" style="padding:4px 10px;font-size:9.5px"><span class="dot dot-lime pulse"></span>LIVE</span>':'<span class="pill pill-warn" style="padding:4px 10px;font-size:9.5px"><span class="dot dot-amber"></span>NOT CONNECTED</span>'}</td></tr>`).join('')}
      </table>
    </div>
    <div class="card">
      <div class="section-title" style="margin-bottom:8px">ai_events — live call log</div>
      <table class="table" id="aiEventsTable">
        <tr><th>Time</th><th>Feature</th><th>Model</th><th>Latency</th><th>Tokens</th><th>Fallback</th></tr>
        ${AI.events.slice(0,10).map(e=>`<tr><td class="mono">${e.at}</td><td>${e.feature}</td><td class="mono" style="color:var(--text-secondary)">${e.model}</td><td class="mono">${e.latency} ms</td><td class="mono">${e.tokens}</td><td>${e.fallback?`<span style="color:var(--accent-amber)">yes — ${e.note}</span>`:'no'}</td></tr>`).join('')||'<tr><td colspan="6" class="act-sub" style="padding:14px 10px">No AI calls yet this session — use the assistant or any ✦ button.</td></tr>'}
      </table>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-title" style="margin-bottom:12px">Activation Protocol</div>
      <div class="act-sub" style="line-height:1.7">Product owner named, in writing: <b style="color:var(--text-primary)">gemini-2.5-flash</b> via the Google Generative Language API, scoped to ops assistance, summarization, planning drafts &amp; translation. One config value per feature in <span class="mono">config.js</span> — flip a flag and the feature instantly reverts to its safe offline mode.</div>
    </div>
    <div class="card">
      <div class="section-title" style="margin-bottom:12px">Human-Override Log</div>
      ${act('👤','chip-amber','Steward count adjusted','AI said 6, ops lead sent 8 — logged','14m ago')}
      ${act('👤','chip-amber','Reroute rejected','Lot H access road closed (AI unaware)','1h ago')}
    </div>
  </div>
</div>`},

volunteers: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Volunteer Operations</div>
  <div class="view-sub">184 volunteers on shift · AI assigns the right person to the right job, and pings them at every break</div></div>
  <div style="display:flex;gap:10px">
    <button class="btn btn-ghost" onclick="genRoles(this)">✦ Optimize roles</button>
    <button class="btn btn-lime" onclick="breakProtocol(this)">☕ Trigger Break Protocol</button>
  </div>
</div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('🤝','chip-lime','glow-lime','On Shift','184','12 on break','delta-up','4 zones covered')}
  ${kpi('📋','chip-teal','glow-teal','Open Tasks','23','7 urgent','delta-warn','AI-prioritized')}
  ${kpi('⏱','chip-lime','glow-lime','Next Break','75\' cooling','~12 min','delta-up','cleanup auto-queues')}
  ${kpi('🌍','chip-teal','glow-teal','Languages','14','covered','delta-up','AI translates the rest')}
</div>
<div class="split-21">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Roster — AI Role Assignment</div>
    <span class="pill pill-ok"><span class="dot dot-lime pulse"></span>gemini live</span></div>
    <table class="table" id="rosterTable">
      <tr><th>Volunteer</th><th>Skills / Languages</th><th>AI-Assigned Role</th><th>Why</th></tr>
      ${VOLS.map((v,i)=>`<tr>
        <td style="font-weight:600">${v.emoji} ${v.name}</td>
        <td class="act-sub">${v.skills}</td>
        <td><span class="pill pill-teal" style="padding:4px 11px;font-size:10px" id="role-${i}">${v.role}</span></td>
        <td class="act-sub" id="why-${i}">${v.why}</td></tr>`).join('')}
    </table>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-title" style="margin-bottom:10px">Break Protocol</div>
      <div class="act-sub" style="line-height:1.7">At every match break (halftime, cooling breaks), the system automatically notifies off-rotation volunteers with zone-specific cleanup and restock tasks — before the concourse surge hits, not after.</div>
      <div id="breakOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Volunteer Task Queue</div></div>
      <div id="volTasks">
        ${qrow('🧹','rgba(45,217,196,.12)','Concourse B wet-spill sweep','Zone B · assigned: Aisha K.','pill-warn','In progress','vol-task')}
        ${qrow('♿','rgba(198,241,53,.12)','Wheelchair escort — Gate C to Sec 132','Priority · assigned: Marco T.','pill-pending','Urgent','vol-task')}
        ${qrow('📦','rgba(255,255,255,.06)','Restock water — kiosk B4','Before 75-min break · assigned: Chen W.','pill-teal','Queued','vol-task')}
      </div>
    </div>
  </div>
</div>`,

fan: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px">
  <div><div class="view-title">Fan Portal</div>
  <div class="view-sub">What 82,000 fans see at stadiumos.app — Mateo's live session</div></div>
  <div style="display:flex;gap:10px;align-items:center">
    <span class="fan-select-wrap">${ico('globe',14)}<select class="fan-select" onchange="FAN.lang=this.value;toast('Language set','Everything now renders in '+LANGS[this.value])">
      ${Object.entries(LANGS).map(([k,v])=>`<option value="${k}" ${FAN.lang===k?'selected':''}>${v}</option>`).join('')}
    </select></span>
    <button class="pill ${FAN.wheelchair?'pill-ok':'pill-dim'}" style="cursor:pointer" onclick="FAN.wheelchair=!FAN.wheelchair;go('fan');toast(FAN.wheelchair?'Wheelchair mode ON':'Wheelchair mode off',FAN.wheelchair?'All routes step-free — elevators & ramps only':'Standard routing restored')">${ico('access',14)}&nbsp;${FAN.wheelchair?'Accessible: ON':'Accessible mode'}</button>
    <button class="btn btn-red" onclick="fanSOS()">${ico('alert',14)}&nbsp;SOS</button>
  </div>
</div>

<div class="card fan-hero">
  <div>
    <div class="fan-hero-label">FIFA World Cup 2026™ · Group A · MetLife Stadium</div>
    <div class="fan-score">MEX <span>1 – 0</span> RSA</div>
    <div class="fan-hero-meta"><span class="pill pill-live" style="padding:5px 12px"><span class="dot dot-red pulse"></span>Live · 63' second half</span></div>
  </div>
  <div class="fan-hero-right">
    <div class="fan-chip">${ico('seat',15)}<div><b>Sec 233 · Row 12 · Seat 8</b><span>Upper tier, east</span></div></div>
    <div class="fan-chip">${ico('ticket',15)}<div><b>Ticket validated 19:02</b><span>Entered via Gate C</span></div></div>
    ${FAN.order?`<div class="fan-chip" style="border-color:rgba(198,241,53,.4)">${ico('utensils',15)}<div><b>Order on the way — 4 min</b><span>${FAN.order}</span></div></div>`:''}
  </div>
</div>

<div class="grid-3" style="margin-top:18px;align-items:stretch">
  <div class="card">
    <div class="fan-card-head">${ico('compass',17)} Navigate ${FAN.wheelchair?`<span class="pill pill-ok" style="padding:3px 10px;font-size:9.5px;margin-left:auto">${ico('access',11)} step-free</span>`:''}</div>
    <div class="act-sub" style="margin-bottom:12px">${FAN.wheelchair?'Elevators &amp; ramps only · staff alerted if an elevator is down':'Crowd-aware routes — avoiding the busy Section 105 concourse'}</div>
    <div class="fan-dests">
      <button class="fan-dest" onclick="fanRoute('my seat, Section 233 Row 12',this)">${ico('seat',15)} My seat</button>
      <button class="fan-dest" onclick="fanRoute('nearest accessible restroom',this)">${ico('access',15)} Restroom</button>
      <button class="fan-dest" onclick="fanRoute('nearest food stand with a short queue',this)">${ico('utensils',15)} Food</button>
      <button class="fan-dest" onclick="fanRoute('fastest exit to the rail station',this)">${ico('door',15)} Exit</button>
    </div>
    <div id="fanRouteOut" style="margin-top:14px;min-height:120px">
      <div class="act-sub" style="line-height:1.6">Pick a destination — routes update with live crowd data.</div>
    </div>
  </div>

  <div class="card">
    <div class="fan-card-head">${ico('utensils',17)} Order to seat <span class="pill pill-ok" style="padding:3px 10px;font-size:9.5px;margin-left:auto">4 min delivery</span></div>
    ${MENU.map(([icn,name,price],i)=>`<div class="menu-row">
      <span class="menu-ic">${ico(icn,16)}</span>
      <div style="flex:1"><div class="menu-name">${name}</div><div class="act-sub">${price}</div></div>
      <button class="qty-btn" onclick="fanCart(${i},-1)">${ico('minus',13)}</button>
      <span class="mono" id="qty-${i}" style="min-width:18px;text-align:center;font-size:12.5px">${FAN.cart[i]||0}</span>
      <button class="qty-btn qty-add" onclick="fanCart(${i},1)">${ico('plus',13)}</button>
    </div>`).join('')}
    <button class="btn btn-lime" style="width:100%;margin-top:14px;padding:11px" onclick="fanCheckout()">Checkout · <span id="cartTotal">$0</span></button>
    <button class="btn btn-ghost" style="width:100%;margin-top:8px;padding:9px;font-size:11.5px" onclick="fanCombo(this)">${ico('spark',13)} AI combo for the second half</button>
    <div id="comboOut"></div><div id="fanOrderStatus"></div>
  </div>

  <div class="card" style="display:flex;flex-direction:column">
    <div class="fan-card-head">${ico('spark',17)} Assistant <span class="act-sub" style="margin-left:auto;font-size:10px">${LANGS[FAN.lang]} · any language works</span></div>
    <div id="fanChat" class="fan-chat">
      ${FAN.chat.length?FAN.chat.map(([r,t])=>`<div class="msg ${r==='u'?'msg-user':'msg-ai'}" style="font-size:12.5px;${r==='u'?'align-self:flex-end':''}">${t}</div>`).join(''):
      `<div class="msg msg-ai" style="font-size:12.5px">Hi Mateo! Ask me about restrooms, food, your seat or the fastest way out — in any language.</div>`}
    </div>
    <form style="display:flex;gap:8px;margin-top:12px" onsubmit="fanAsk(event)">
      <input id="fanField" placeholder="Ask anything..." style="flex:1;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:999px;padding:10px 16px;font-size:12.5px">
      <button class="btn btn-lime" style="width:40px;height:40px;border-radius:50%;padding:0" title="Send">${ico('send',15)}</button>
    </form>
  </div>
</div>

<div class="grid-3" style="margin-top:18px">
  <div class="card">
    <div class="fan-card-head">${ico('mega',17)} Live announcements
      <button class="btn btn-ghost" style="margin-left:auto;padding:5px 13px;font-size:10.5px" onclick="fanAnnounce(this)">${ico('globe',12)} Translate</button></div>
    <div class="act-sub" id="fanAnnOut" style="line-height:1.65">Stadium PA runs in Spanish — tap Translate to read every announcement in ${LANGS[FAN.lang]}.</div>
  </div>
  <div class="card">
    <div class="fan-card-head">${ico('train',17)} Smart exit</div>
    <div class="act-sub" style="margin-bottom:10px">Personal plan: when to leave, which gate, live transit.</div>
    <select id="fanExitMode" class="fan-select" style="width:100%;margin-bottom:10px">
      <option>Rail — Meadowlands line</option><option>Rideshare pickup</option><option>Parking Lot F</option><option>Accessible shuttle</option>
    </select>
    <button class="btn btn-lime" style="width:100%;padding:10px" onclick="genFanExit(this)">${ico('spark',13)} Plan my exit</button>
    <div id="fanExitOut"></div>
  </div>
  <div class="card">
    <div class="fan-card-head">${ico('wallet',17)} Wallet</div>
    ${row2('Match ticket','Sec 233 · validated')}${row2('Visa ····4got','default payment')}${row2('Stadium credit','$18.50')}${row2("Today's spend",'$31.00')}
    <div class="act-sub" style="margin-top:10px;display:flex;align-items:center;gap:6px">${ico('ticket',13)} Offline-cached — works with zero signal in the bowl</div>
  </div>
</div>`,
};

/* ───── Volunteer Operations ───── */
const VOLS=[
  {emoji:'👩🏽',name:'Aisha K.',skills:'First aid · AR/EN',role:'Medical support — Sec 110s',why:'Certified first aid + near medical hotspot'},
  {emoji:'👨🏻',name:'Marco T.',skills:'Mobility asst. · ES/EN/PT',role:'Accessibility escort — Gate C',why:'Trained escort + trilingual for intl fans'},
  {emoji:'👩🏻',name:'Chen W.',skills:'Logistics · ZH/EN',role:'Restock runner — Concourse B',why:'Fastest restock times this shift'},
  {emoji:'👨🏿',name:'Kwame A.',skills:'Crowd mgmt · FR/EN',role:'Flow steward — Ramp C',why:'Crowd-trained + FR for visiting fans'},
  {emoji:'👩🏼',name:'Elena R.',skills:'Guest services · ES/EN',role:'Info point — Gate B',why:'Highest fan-rating, bilingual'},
];
async function genRoles(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('volunteer_ops',
      `Volunteers on shift: ${VOLS.map(v=>`${v.name} (${v.skills})`).join('; ')}. Current situation needs attention: Section 105 crowding, wheelchair escort backlog at Gate C, 75-min cooling break in ~12 min (cleanup+restock), rain expected at egress. Reassign each volunteer to the OPTIMAL role right now. Output ONLY a JSON array: [{"name":"...","role":"short role — location","why":"under 10 words"}] for all ${VOLS.length}.`,
      { system: stadiumContext(), temperature: 0.6 });
    const roles=extractJSON(raw);
    roles.forEach(r=>{
      const i=VOLS.findIndex(v=>r.name.includes(v.name.split(' ')[0]));
      if(i<0) return;
      const re=document.getElementById(`role-${i}`), we=document.getElementById(`why-${i}`);
      if(re){re.textContent=r.role; re.classList.remove('pill-teal'); re.classList.add('pill-ok');}
      if(we) we.textContent=r.why;
    });
    toast('Roles re-optimized','Each volunteer matched to skills, languages & live conditions');
    pushActivity('🤝','chip-lime','Volunteer roles optimized','AI reassignment across 5 leads · zones rebalanced');
  }catch(e){ toast('Fallback active','Keeping current role assignments','warn'); }
  busy(btn,false);
}
async function breakProtocol(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('volunteer_ops',
      `The 75th-minute cooling break starts NOW. Generate the break protocol as ONLY a JSON array of 4 notifications: [{"to":"volunteer name or team","zone":"...","task":"specific cleanup/restock/reposition task","mins":estimated minutes}]. Base it on: Concourse B trash accumulation, kiosk B4 water low, Section 105 concourse crowding expected, restrooms near Sec 220s need check.`,
      { system: stadiumContext(), temperature: 0.6 });
    const tasks=extractJSON(raw);
    document.getElementById('breakOut').innerHTML=`<div style="margin-top:12px">${tasks.map(t=>
      `<div class="qrow"><div class="qthumb" style="background:rgba(198,241,53,.1)">📲</div>
      <div class="qbody"><div class="qtitle" style="font-size:12.5px">${t.to} → ${t.zone}</div>
      <div class="qmeta">${t.task} · ~${t.mins} min</div></div>
      <span class="pill pill-ok" style="padding:4px 10px;font-size:9.5px">SENT</span></div>`).join('')}</div>`;
    tasks.slice(0,2).forEach((t,i)=>setTimeout(()=>toast(`📲 Break task → ${t.to}`,`${t.zone}: ${t.task}`,'warn'),i*900));
    pushActivity('☕','chip-amber','Break protocol triggered',`${tasks.length} cleanup notifications pushed to volunteers`);
  }catch(e){ toast('Fallback active','Standard break checklist pushed instead','warn'); }
  busy(btn,false);
}
async function genVolInstructions(title,btn){
  busy(btn,true);
  try{
    const txt=await AI.call('volunteer_ops',
      `Write step-by-step instructions (3-4 numbered steps, simple words) for a first-time volunteer doing this task: "${title}". Include where to get supplies and who to radio if blocked.`,
      { system: stadiumContext(), temperature: 0.5 });
    toast('Instructions sent to volunteer app','Step-by-step guide generated');
    const div=document.createElement('div');
    div.innerHTML=`<div class="act-sub" style="line-height:1.65;padding:12px;margin:8px 0;background:rgba(45,217,196,.06);border:1px solid rgba(45,217,196,.25);border-radius:12px"><b style="color:var(--accent-teal)">📲 Sent to volunteer:</b><br>${md(txt)}</div>`;
    btn.closest('.qrow').after(div.firstElementChild);
  }catch(e){ toast('Fallback active','Standard task card sent','warn'); }
  busy(btn,false);
}

/* ───── Fan App — interactive phone ───── */
const FAN={ cart:{}, chat:[], order:null, lang:'en', wheelchair:false };
const LANGS={en:'English',es:'Español',fr:'Français',ar:'العربية',pt:'Português',zh:'中文'};
const MENU=[
  ['utensils','Tacos al pastor','$9'],['utensils','Stadium burger','$12'],['pizza','Pizza slice','$7'],
  ['drop','Agua mineral','$4'],['cup','Cerveza','$10'],['cup','Palomitas','$6'],
];
/* inline SVG icon set (lucide-style, stroke = currentColor) */
const ICONS={
  compass:'<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/><path d="M21 15v7"/>',
  chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  mega:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  access:'<circle cx="12" cy="5" r="2"/><path d="M12 7v5l4 3"/><path d="M17.5 17a5.5 5.5 0 1 1-7.5-6.9"/>',
  train:'<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  wallet:'<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  door:'<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/>',
  seat:'<path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/><path d="M3 18v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/><path d="M4 22v-2"/><path d="M20 22v-2"/>',
  drop:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  cup:'<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
  pizza:'<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/>',
  minus:'<path d="M5 12h14"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
};
function ico(n,s=18){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px">${ICONS[n]||''}</svg>`;}

function fanCart(i,d){
  FAN.cart[i]=Math.max(0,(FAN.cart[i]||0)+d);
  const q=document.getElementById(`qty-${i}`); if(q)q.textContent=FAN.cart[i];
  const total=Object.entries(FAN.cart).reduce((a,[k,v])=>a+v*parseInt(MENU[k][2].slice(1)),0);
  const t=document.getElementById('cartTotal'); if(t)t.textContent=`$${total}`;
}
function fanCheckout(){
  const items=Object.entries(FAN.cart).filter(([,v])=>v>0);
  if(!items.length) return toast('Cart is empty','Add something first','warn');
  FAN.order=items.map(([k,v])=>`${v}× ${MENU[k][1]}`).join(', ');
  FAN.cart={};
  toast('Order placed',`${FAN.order} → seat delivery, Sec 233 · 4 min`);
  pushActivity('🍔','chip-teal','Seat-delivery order','Sec 233 · fan portal checkout');
  document.querySelectorAll('[id^="qty-"]').forEach(q=>q.textContent='0');
  const t=document.getElementById('cartTotal'); if(t)t.textContent='$0';
  const st=document.getElementById('fanOrderStatus');
  if(st) st.innerHTML=`<div class="act-sub" style="margin-top:12px;padding:12px;background:rgba(198,241,53,.06);border:1px solid rgba(198,241,53,.3);border-radius:12px;line-height:1.5"><b style="color:var(--accent-lime)">${ico('utensils',13)} On the way — 4 min</b><br>${FAN.order} · delivered to Sec 233 Row 12</div>`;
}
async function fanCombo(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('fan_assist',
      `Suggest a 2-3 item combo from this menu for a fan watching the second half: ${MENU.map(m=>`${m[1]} ${m[2]}`).join(', ')}. One fun sentence in Spanish with the total price.`,
      { temperature:0.9 });
    document.getElementById('comboOut').innerHTML=`<div class="card" style="padding:12px;margin-top:10px;border-color:rgba(198,241,53,.3)"><div class="act-sub" style="line-height:1.5">${md(txt)}</div></div>`;
  }catch(e){ toast('Fallback active','Combo suggestions unavailable','warn'); }
  busy(btn,false);
}
async function fanRoute(dest,btn){
  const out=document.getElementById('fanRouteOut');
  out.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  try{
    const txt=await AI.call(FAN.wheelchair?'accessibility':'fan_assist',
      `Fan at Section 233 Row 12, MetLife Stadium, wants to reach: ${dest}. Give walking directions in 2-3 numbered steps with estimated time, avoiding the crowded Section 105 concourse.${FAN.wheelchair?' The fan uses a WHEELCHAIR: route MUST be fully step-free — elevators and ramps only, mention the elevator location, add 30% to time estimates, and note the accessible viewing platform if relevant.':''} Answer in ${LANGS[FAN.lang]}, friendly, short.`,
      { system: stadiumContext(), temperature:0.5 });
    out.innerHTML=`<div class="qtitle" style="font-size:12px;margin-bottom:6px">${ico('compass',14)} Route</div><div class="act-sub" style="line-height:1.65">${md(txt)}</div>
    <div class="pbar" style="margin-top:12px"><i style="width:12%;background:var(--accent-lime);animation:routeGo 8s linear forwards"></i></div>`;
  }catch(e){ out.innerHTML='<div class="act-sub">Route unavailable right now — follow the concourse signage or ask any volunteer in a green vest.</div>'; }
}
async function genFanExit(btn){
  busy(btn,true);
  try{
    const mode=document.getElementById('fanExitMode').value;
    const txt=await AI.call('exit_planner',
      `Fan at Sec 233 Row 12 leaving via: ${mode}. Rain likely post-match, rail surge peaks 22:30-23:00, Gate C turnstile fault, Lot F 98% full. Personal exit plan: which match minute to leave, which gate, route, total time vs full-time whistle exit.${FAN.wheelchair||mode.includes('Accessible')?' Fan uses a wheelchair: step-free route, accessible shuttle bay, staff assist point.':''} 3 short numbered steps in ${LANGS[FAN.lang]}.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('fanExitOut').innerHTML=`<div class="act-sub" style="margin-top:12px;line-height:1.65">${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Exit planner busy — try again shortly','warn'); }
  busy(btn,false);
}
async function fanAsk(e){
  e.preventDefault();
  const f=document.getElementById('fanField'), q=f.value.trim(); if(!q)return;
  FAN.chat.push(['u',q.replace(/</g,'&lt;')]); f.value='';
  const box=document.getElementById('fanChat');
  const pend=document.createElement('div');
  pend.className='msg msg-ai'; pend.style.fontSize='12px';
  pend.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  box.insertAdjacentHTML('beforeend',`<div class="msg msg-user" style="font-size:12px;align-self:flex-end">${q.replace(/</g,'&lt;')}</div>`);
  box.appendChild(pend);
  box.scrollTop=box.scrollHeight;
  try{
    const txt=await AI.call('fan_assist',
      `Fan question: ${q}`,
      { system:`You are the fan-facing stadium assistant. The fan is Mateo, seat Sec 233 Row 12. His preferred language is ${LANGS[FAN.lang]} — answer in it unless he writes in another language, then mirror his.${FAN.wheelchair?' He uses a wheelchair: all directions must be step-free (elevators/ramps).':''} Be warm, short (1-3 sentences), practical. ${stadiumContext()}`, temperature:0.7 });
    FAN.chat.push(['a',md(txt)]);
    pend.innerHTML=md(txt);
  }catch(err){
    const fb={en:'The assistant is busy — for restrooms follow the ♿ signs on the concourse; for help find any volunteer in a green vest.',
      es:'El asistente está ocupado — para baños sigue las señales ♿ del pasillo; cualquier voluntario de chaleco verde te ayuda.'}[FAN.lang]||'The assistant is busy — any volunteer in a green vest can help you right away.';
    FAN.chat.push(['a',fb]);
    pend.innerHTML=fb;
  }
  box.scrollTop=box.scrollHeight;
}
async function fanAnnounce(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('translation',
      `These stadium PA announcements were just made in Spanish:
1. "Atención: la puerta C está congestionada, usen la puerta B para salir."
2. "El descanso de hidratación será en el minuto 75."
3. "Se esperan lluvias después del partido — el tren de Meadowlands saldrá cada 6 minutos."
Translate all 3 into ${LANGS[FAN.lang]} as a numbered list, keeping them short.`,
      { temperature:0.2 });
    document.getElementById('fanAnnOut').innerHTML=md(txt);
  }catch(e){ toast('Fallback active','Translation unavailable right now','warn'); }
  busy(btn,false);
}
function fanSOS(){
  toast('🆘 SOS received','Geo-located: Sec 233 · dispatched to Emergency Command Center','crit');
  pushActivity('🆘','chip-red','Fan SOS — Sec 233','Auto-located · unit assigned via fan app');
}

/* ───── Component helpers ───── */
function kpi(ic, chip, glow, label, value, delta, dcls, foot){
  return `<div class="card kpi ${glow}"><div class="kpi-top"><div class="chip ${chip}">${ic}</div><span class="kpi-arrow">↗</span></div>
  <div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>
  <div class="kpi-foot"><span class="delta ${dcls}">${delta}</span>${foot}</div></div></div>`;
}
function match(f1,f2,grp,date,time,watch,live){
  return `<div class="card match-card">
  <div class="match-head"><span class="match-comp">FIFA World Cup 2026™</span><span class="pill pill-dim" style="padding:4px 12px">${grp}</span></div>
  <div class="match-body"><div class="flag">${f1}</div>
  <div class="match-mid"><div class="match-date">${date}</div><div class="match-time">${time}</div></div>
  <div class="flag">${f2}</div></div>
  <div class="match-foot"><span>👁 ${watch} watching</span>
  ${live?'<span class="pill pill-live" style="padding:5px 12px"><span class="dot dot-red pulse"></span>Live</span>':'<span class="pill pill-dim" style="padding:5px 12px">Upcoming</span>'}</div></div>`;
}
function qrow(ic,bg,title,meta,pcls,ptxt,action){
  return `<div class="qrow"><div class="qthumb" style="background:${bg}">${ic}</div>
  <div class="qbody"><div class="qtitle">${title}</div><div class="qmeta">🕐 ${meta}</div></div>
  <span class="pill ${pcls}" style="padding:5px 12px;font-size:10.5px">${ptxt}</span>
  <button class="btn btn-ghost" onclick="reviewAlert('${action}',this)">Review</button></div>`;
}
function act(ic,chip,title,sub,time){
  return `<div class="act-row"><div class="act-chip ${chip}">${ic}</div>
  <div><div class="act-title">${title}</div><div class="act-sub">${sub}</div></div>
  <span class="act-time">🕐 ${time}</span></div>`;
}
function kanCol(name, cards){
  return `<div class="kan-col"><div class="kan-head"><span>${name}</span><span>${cards.length}</span></div>
  ${cards.map(([t,sc,sl,m,ago])=>`<div class="kan-card"><div class="kan-title">${t}</div>
  <span class="sev ${sc}">${sl}</span><div class="kan-meta"><span>${m}</span><span>${ago}</span></div></div>`).join('')}</div>`;
}
function cam(id,loc,tag){
  const flagged = tag.startsWith('flagged');
  return `<div class="card" style="padding:0;overflow:hidden">
  <div style="height:110px;background:linear-gradient(135deg,#141a16,#0d1210);display:grid;place-items:center;font-size:26px;position:relative">
  📹 ${flagged?'<span class="pill pill-pending" style="position:absolute;top:10px;right:10px;padding:3px 10px;font-size:9px"><span class="dot dot-red pulse"></span>AI FLAG</span>':''}</div>
  <div style="padding:12px 16px"><div class="qtitle" style="font-size:12px">${id}</div>
  <div class="act-sub">${loc} · ${tag}</div></div></div>`;
}
function row2(k,v){return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-hairline);font-size:12.5px"><span style="color:var(--text-secondary)">${k}</span><span style="font-weight:600;text-align:right">${v}</span></div>`}
function pRow(label,pct,color){
  return `<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:var(--text-secondary)">${label}</span><span class="mono" style="font-weight:600">${pct}</span></div>
  <div class="pbar"><i style="width:${pct};background:${color}"></i></div></div>`;
}
function aiRow(f,contract,model){
  return `<tr><td style="font-weight:600">${f}</td><td class="mono" style="color:var(--text-secondary);font-size:11px">${contract}</td>
  <td class="mono" style="color:var(--text-secondary)">${model}</td>
  <td><span class="pill pill-warn" style="padding:4px 10px;font-size:9.5px"><span class="dot dot-amber"></span>NOT CONNECTED</span></td></tr>`;
}

/* Stadium SVG — two concentric rings of 12 sections */
function stadiumSVG(twin=false){
  const cx=300, cy=190;
  let paths='';
  S.sections.forEach((s,idx)=>{
    const ring = idx<12?0:1;
    const i = idx%12;
    const r0 = ring?95:135, r1 = ring?128:172;
    const a0=(i*30-90)*Math.PI/180, a1=((i+1)*30-92)*Math.PI/180;
    const p=(r,a)=>`${cx+r*Math.cos(a)},${cy+r*0.72*Math.sin(a)}`;
    paths+=`<path class="sec" data-idx="${idx}" fill="${heatColor(s.density)}" fill-opacity="0.85"
      d="M${p(r0,a0)} A${r0},${r0*0.72} 0 0 1 ${p(r0,a1)} L${p(r1,a1)} A${r1},${r1*0.72} 0 0 0 ${p(r1,a0)} Z">
      <title>Section ${s.id} — ${Math.round(s.density)}% density</title></path>`;
  });
  return `<svg class="stadium-svg" viewBox="0 0 600 385" onclick="secClick(event)">
    <ellipse cx="${cx}" cy="${cy}" rx="88" ry="62" fill="#12241a" stroke="rgba(198,241,53,.35)"/>
    <rect x="${cx-55}" y="${cy-32}" width="110" height="64" fill="none" stroke="rgba(255,255,255,.2)"/>
    <line x1="${cx}" y1="${cy-32}" x2="${cx}" y2="${cy+32}" stroke="rgba(255,255,255,.2)"/>
    <circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="rgba(255,255,255,.2)"/>
    ${paths}
    <text x="${cx}" y="${cy+4}" text-anchor="middle" fill="rgba(245,246,244,.5)" font-size="11" font-weight="600">MEX 1 – 0 RSA · 63'</text>
    ${twin?'':`<text x="${cx}" y="370" text-anchor="middle" fill="#9AA098" font-size="10">Section 105 flagged — click to inspect</text>`}
  </svg>`;
}

/* Charts (pure SVG, no libs) */
function surgeChart(){
  const modes=[['Rail','#2DD9C4'],['Shuttle','#C6F135'],['Car','#F0A63B'],['Walk','#9AA098']];
  const data=[[20,15,30,10],[35,25,45,14],[70,45,80,22],[95,60,90,26],[60,40,55,18],[30,20,25,10]];
  const W=560,H=200,bw=14;
  let bars='',labels='';
  data.forEach((grp,g)=>{
    const x0=40+g*88;
    grp.forEach((v,m)=>{
      const h=v*1.6;
      bars+=`<rect class="bar" x="${x0+m*(bw+4)}" y="${H-20-h}" width="${bw}" height="${h}" rx="4" fill="${modes[m][1]}" fill-opacity=".85"/>`;
    });
    labels+=`<text x="${x0+34}" y="${H-4}" text-anchor="middle" fill="#9AA098" font-size="10">${['21:30','22:00','22:30','23:00','23:30','00:00'][g]}</text>`;
  });
  const legend=modes.map(([n,c],i)=>`<circle cx="${370+i*60}" cy="12" r="4" fill="${c}"/><text x="${378+i*60}" y="16" fill="#9AA098" font-size="10">${n}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H+10}" style="width:100%">${legend}${bars}${labels}
  <line x1="34" y1="${H-20}" x2="${W-10}" y2="${H-20}" stroke="rgba(255,255,255,.1)"/></svg>`;
}
function energyChart(){
  const actual=[30,32,36,44,52,49,42,38,36,40,45,38];
  const opt=[30,31,34,40,46,44,39,36,34,37,41,36];
  const W=560,H=190;
  const pt=a=>a.map((v,i)=>`${40+i*46},${H-15-(v-25)*4.6}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H+10}" style="width:100%">
  <polyline points="${pt(actual)}" fill="none" stroke="#F0A63B" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="${pt(opt)}" fill="none" stroke="#C6F135" stroke-width="2.5"/>
  ${opt.map((v,i)=>`<circle cx="${40+i*46}" cy="${H-15-(v-25)*4.6}" r="3.5" fill="#C6F135"/>`).join('')}
  <circle cx="380" cy="12" r="4" fill="#F0A63B"/><text x="390" y="16" fill="#9AA098" font-size="10">Unoptimized</text>
  <circle cx="470" cy="12" r="4" fill="#C6F135"/><text x="480" y="16" fill="#9AA098" font-size="10">AI-optimized</text>
  <line x1="34" y1="${H-15}" x2="${W-10}" y2="${H-15}" stroke="rgba(255,255,255,.1)"/></svg>`;
}

/* ───── Router ───── */
function go(name){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  views.innerHTML = `<div class="view active">${VIEWS[name]()}</div>`;
  countUp();
}
$('#nav').addEventListener('click',e=>{
  const b=e.target.closest('.nav-item'); if(b) go(b.dataset.view);
});

/* Count-up animation (§0 motion doctrine) */
function countUp(){
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=+el.dataset.count, t0=performance.now(), dur=700;
    const step=t=>{
      const p=Math.min((t-t0)/dur,1), e=1-Math.pow(1-p,3);
      el.textContent=fmt(Math.round(target*e));
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(()=>{ el.textContent=fmt(target); }, dur+120); // rAF stalls in hidden tabs — guarantee the final value
  });
}

/* ───── Interactions ───── */
function secClick(e){
  const t=e.target.closest('.sec'); if(!t) return;
  const s=S.sections[+t.dataset.idx];
  const d=Math.round(s.density);
  const detail=$('#secDetail');
  const html=`<div class="qtitle">Section ${s.id}</div>
    <div class="kpi-value" style="font-size:28px;margin:6px 0">${d}%</div>
    <div class="pbar" style="margin-bottom:12px"><i style="width:${d}%;background:${heatColor(s.density)}"></i></div>
    ${row2('Occupancy',`${Math.round(d*38.5)} / 3,850`)}${row2('Flow rate','↑ entering')}${row2('Nearest unit',d>80?'M-3 · 90s away':'S-1 · 3 min')}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-ghost" onclick="genSectionAnalysis('${s.id}',${d},this)">✦ AI analysis</button>
      ${d>85?'<button class="btn btn-lime" onclick="approveRec(this)">Dispatch stewards</button>':''}</div>
    <div id="secAnalysis"></div>`;
  if(detail){detail.innerHTML=html}
  else toast(`Section ${s.id}`,`Density ${d}% · ${d>85?'INTERVENE':d>70?'watch':'nominal'}`,d>85?'crit':d>70?'warn':'');
}
function reviewAlert(id,btn){
  if(id==='review-105'||id==='sec-105'){ go('security'); toast('Opened Security Dashboard','Section 105 flagged — AI recommendation ready'); }
  else if(id==='vol-task'){ genVolInstructions(btn.closest('.qrow').querySelector('.qtitle').textContent,btn); }
  else toast('Alert opened','Detail panel');
}
function approveRec(btn){
  btn.textContent='✓ Approved'; btn.disabled=true; btn.style.opacity=.6;
  S.sections[4].density=72;
  toast('Recommendation approved','6 stewards reallocated → Section 105 · logged with your identity');
  pushActivity('✓','chip-lime','Steward reallocation approved','Section 105 · by Priya R.');
}

/* ───── Toasts & activity ───── */
function toast(title,sub,cls=''){
  const el=document.createElement('div');
  el.className=`toast ${cls}`;
  el.innerHTML=`<div><div class="toast-title">${title}</div><div class="toast-sub">${sub}</div></div>`;
  $('#toastStack').appendChild(el);
  setTimeout(()=>el.remove(),4200);
}
function pushActivity(ic,chip,title,sub){
  const feed=$('#activityFeed'); if(!feed) return;
  const div=document.createElement('div');
  div.innerHTML=act(ic,chip,title,sub,'now');
  const row=div.firstElementChild; row.classList.add('enter');
  feed.prepend(row);
}

/* ───── AI Assistant (deterministic stub — §14) ───── */
const ANSWERS=[
  [/crowd|density|section/i,'📊 Crowd status: stadium average 61%. Section 105 is at 88% and trending up — a steward reallocation is awaiting approval on the Security Dashboard. All other sections nominal.'],
  [/medical|unit|114/i,'🚑 Nearest medical unit to Section 114: Unit M-3, currently on-scene there (fan collapse, stable). Next available: M-1 at Gate B, 90 seconds out.'],
  [/energy|power|report/i,'⚡ Energy: current draw 38.2 MW, 6% under baseline thanks to pre-cooling optimization. Projected matchday total: 142 MWh. Water at 512 m³ (−11%).'],
  [/evac|emergency/i,'⚠ Draft evacuation plan for Section 105 is ready in the Emergency Command Center. It requires named human sign-off before any broadcast — I will never send it myself.'],
  [/transport|train|parking|exit/i,'🚇 Egress: rail surge predicted 22:30–23:00. Lot F is 98% full; overflow rerouting to Lot H active. Recommend staggered exit notifications at the 85th minute.'],
  [/hello|hi|hey/i,'👋 Hello! I have live context on crowd, incidents, energy, and transport. What do you need?'],
];
function openAssistant(){ $('#assistantOverlay').classList.add('open'); $('#assistantField').focus(); }
function closeAssistant(e){ if(!e||e.target.id==='assistantOverlay'||!e.target) $('#assistantOverlay').classList.remove('open'); }
const chatHistory=[];
let grounding=false;
function toggleGrounding(btn){
  grounding=!grounding;
  btn.classList.toggle('on',grounding);
  const h=$('#groundHint'); if(h) h.textContent=grounding?'🌐 Live Search on — answers use real-world data':'';
}
function clearChat(){
  chatHistory.length=0;
  $('#assistantLog').innerHTML=document.getElementById('chatHero')?'':'';
  $('#assistantLog').appendChild(buildHero());
}
function buildHero(){
  const d=document.createElement('div');
  d.className='chat-hero'; d.id='chatHero';
  d.innerHTML=`<div class="ai-orb" style="width:64px;height:64px"></div>
    <div class="hero-title">How can I help, Priya?</div>
    <div class="hero-sub">I see live crowd, incidents, energy &amp; transport data — ask in any language.</div>
    <div class="hero-chips">
      <button class="sug-chip" onclick="quickAsk(this)">📊 Crowd status</button>
      <button class="sug-chip" onclick="quickAsk(this)">🚑 Nearest medical unit to Sec 114</button>
      <button class="sug-chip" onclick="quickAsk(this)">🌦 Weather risk for egress</button>
      <button class="sug-chip" onclick="quickAsk(this)">⚠ Draft evacuation plan</button>
    </div>`;
  return d;
}
/* tiny markdown → safe HTML: bold, italics, bullets, line breaks */
function md(t){
  t=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|\s)\*(?!\s)([^*\n]+)\*/g,'$1<i>$2</i>');
  const lines=t.split('\n'); let out='',inList=false;
  for(const ln of lines){
    const m=ln.match(/^\s*[*•-]\s+(.*)/);
    if(m){ if(!inList){out+='<ul>';inList=true;} out+=`<li>${m[1]}</li>`; }
    else{ if(inList){out+='</ul>';inList=false;} out+=ln?ln+'<br>':''; }
  }
  if(inList)out+='</ul>';
  return out.replace(/(<br>)+$/,'');
}
function addMsg(role,html){
  const log=$('#assistantLog');
  const row=document.createElement('div');
  row.className=`msg-row ${role==='user'?'user':''}`;
  row.innerHTML=`<div class="msg-avatar ${role==='user'?'user-av':'ai-av'}">${role==='user'?'PR':'✦'}</div>
    <div class="msg ${role==='user'?'msg-user':'msg-ai'}">${html}</div>`;
  log.appendChild(row); log.scrollTop=log.scrollHeight;
  return row.querySelector('.msg');
}
function quickAsk(btn){ $('#assistantField').value=btn.textContent.replace(/^\S+\s/,''); askAssistant(new Event('submit')); }
async function askAssistant(e){
  e.preventDefault();
  const f=$('#assistantField'), q=f.value.trim(); if(!q) return;
  const log=$('#assistantLog');
  document.getElementById('chatHero')?.remove();   // hero disappears on first message
  addMsg('user',q.replace(/</g,'&lt;'));
  f.value=''; f.style.height='auto';
  const el=addMsg('ai','<span class="typing"><i></i><i></i><i></i></span>');
  const t0=performance.now();
  const history=chatHistory.slice(-6).map(([who,txt])=>`${who}: ${txt}`).join('\n');
  const system=`You are the StadiumOS AI assistant for stadium operations staff at FIFA World Cup 2026 (venue: MetLife Stadium, East Rutherford NJ). Be concise (2-5 sentences or a short bullet list), operational, specific. You may use **bold** and "- " bullets, nothing else. Reply in the user's language. Anything dangerous (evacuation broadcast, mass notification) requires named human sign-off — remind them.${grounding?' You have Google Search — use it for live real-world data (weather, transit, news) and combine it with stadium state.':''}\n\n${stadiumContext()}`;
  try{
    let full;
    if(grounding){
      full=await AI.call('assistant',`${history?history+'\n':''}user: ${q}`,{system,grounded:true});
      el.innerHTML=md(full);
    }else{
      full=await AI.stream('assistant',`${history?history+'\n':''}user: ${q}`,
        { system, onChunk:(_,ft)=>{ el.innerHTML=md(ft)+'▍'; log.scrollTop=log.scrollHeight; } });
      el.innerHTML=md(full);
    }
    el.insertAdjacentHTML('beforeend',`<div class="msg-meta">${grounding?'🌐 grounded · ':''}${AI.activeModel} · ${((performance.now()-t0)/1000).toFixed(1)}s</div>
      <div class="msg-actions"><button class="msg-act" onclick="navigator.clipboard.writeText(this.closest('.msg').innerText);this.textContent='✓ Copied'">⧉ Copy</button>
      <button class="msg-act" onclick="$('#assistantField').value=${JSON.stringify(q).replace(/"/g,'&quot;')};askAssistant(new Event('submit'))">↻ Retry</button></div>`);
    const mp=document.getElementById('modelPill'); if(mp) mp.textContent=AI.activeModel;
    chatHistory.push(['user',q],['assistant',full]);
  }catch(err){
    // deterministic fallback — the assistant never dies on stage
    if(AI.serverUp===false){
      el.innerHTML=md('**The AI backend is offline.** Open a terminal in the project folder and run `node server.js`, then refresh this page. Meanwhile I can still give you cached answers about crowd status, medical units, energy, evacuation plans, and transport.');
    }else{
      const hit=ANSWERS.find(([re])=>re.test(q));
      el.innerHTML=md(hit?hit[1]:'Live model unreachable — deterministic fallback active. I can still answer about crowd status, medical units, energy, evacuation plans, and transport.');
    }
    el.insertAdjacentHTML('beforeend','<div class="msg-meta">⚠ fallback (stub)</div>');
  }
  log.scrollTop=log.scrollHeight;
}
/* Voice input — Web Speech API */
function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return toast('Voice unavailable','This browser lacks the Web Speech API','warn');
  const btn=$('#voiceBtn'), rec=new SR();
  rec.lang='en-US'; rec.interimResults=true;
  btn.classList.add('rec');
  rec.onresult=ev=>{ $('#assistantField').value=[...ev.results].map(r=>r[0].transcript).join(''); };
  rec.onend=()=>{ btn.classList.remove('rec'); if($('#assistantField').value.trim()) askAssistant(new Event('submit')); };
  rec.onerror=()=>btn.classList.remove('rec');
  rec.start();
}

/* ───── GenAI tools (live Gemini) ───── */
/* Models wrap JSON in prose or fences more often than not — pull out the
   first JSON array/object instead of trusting the raw string. */
function extractJSON(raw){
  const m=raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if(!m) throw new Error('no JSON in response');
  return JSON.parse(m[0]);
}
function busy(btn,on,label){ if(!btn)return; if(on){btn.dataset.l=btn.textContent;btn.textContent='✦ Generating…';btn.disabled=true;btn.style.opacity=.6}else{btn.textContent=label||btn.dataset.l;btn.disabled=false;btn.style.opacity=1} }

async function genInsights(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('crowd_prediction',
      `Generate exactly 3 short operational insights as a JSON array: [{"icon":"emoji","title":"...","body":"one or two sentences, specific numbers"}]. Topics: crowd prediction, food/inventory or transport, and REAL current weather at East Rutherford NJ (use Google Search) and its operational impact. Output ONLY the JSON array, no markdown.`,
      { system: stadiumContext(), temperature: 0.8, grounded: true });
    const cards=extractJSON(raw);
    $('#insightCards').innerHTML=cards.map(c=>`<div class="card"><div class="qtitle">${c.icon} ${c.title}</div><div class="act-sub" style="margin-top:8px;line-height:1.6">${c.body}</div></div>`).join('');
    toast('AI Insights refreshed','Generated live by gemini-2.5-flash from current stadium state');
  }catch(e){ toast('Fallback active','Live model unavailable — showing cached insights','warn'); }
  busy(btn,false);
}

async function genExecSummary(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('exec_summary',
      `Write a crisp executive summary of current stadium operations for a FIFA administrator: 4-5 sentences, lead with overall status, mention the most important risk and the biggest win. Plain text, no headers.`,
      { system: stadiumContext(), temperature: 0.5 });
    $('#execSummary').innerHTML=`<div class="card" style="margin-bottom:18px;border-color:rgba(198,241,53,.25)">
      <div class="section-row" style="margin:0 0 8px"><div class="section-title">✦ Executive Summary — generated ${now()}</div>
      <span class="pill pill-ok"><span class="dot dot-lime"></span>gemini-2.5-flash</span></div>
      <div class="act-sub" style="line-height:1.75;font-size:13px">${txt}</div></div>`;
  }catch(e){ toast('Fallback active','Executive summary unavailable — model unreachable','warn'); }
  busy(btn,false);
}

async function genEvacPlan(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('evac_planning',
      `Draft a concise evacuation plan for Section 105 (3,850 occupants, density 88%). Include: primary route, contraflow measures, estimated clear time, and broadcast languages. 4-6 lines, plain text. This is a DRAFT for human approval — do not phrase as an executed order.`,
      { system: stadiumContext(), temperature: 0.4 });
    $('#evacText').textContent=txt;
    toast('Draft regenerated','Still requires named human sign-off before broadcast','warn');
  }catch(e){ toast('Fallback active','Keeping last approved draft','warn'); }
  busy(btn,false);
}

async function genIncidentBrief(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('incident_summary',
      `Summarize all open incidents into a 3-sentence shift-handover briefing for the incoming emergency commander. Prioritize by severity.`,
      { system: stadiumContext(), temperature: 0.4 });
    $('#incidentBrief').innerHTML=`<div class="card" style="margin-top:14px;padding:16px;background:rgba(45,217,196,.05);border-color:rgba(45,217,196,.25)">
      <div class="qtitle" style="font-size:12.5px">✦ Shift-handover briefing — ${now()}</div>
      <div class="act-sub" style="margin-top:6px;line-height:1.7">${txt}</div></div>`;
  }catch(e){ toast('Fallback active','Incident summaries unavailable','warn'); }
  busy(btn,false);
}

async function translateFan(btn){
  const src=$('#xlateIn').value.trim(); if(!src) return toast('Type an announcement first','','warn');
  busy(btn,true);
  try{
    const raw=await AI.call('translation',
      `Translate this stadium announcement into Spanish, French, Arabic and Portuguese. Output ONLY a JSON object: {"es":"...","fr":"...","ar":"...","pt":"..."}. Announcement: "${src}"`,
      { temperature: 0.2 });
    const t=extractJSON(raw);
    $('#xlateOut').innerHTML=[['🇪🇸 ES',t.es],['🇫🇷 FR',t.fr],['🇸🇦 AR',t.ar],['🇵🇹 PT',t.pt]]
      .map(([l,v])=>`<div style="padding:8px 0;border-bottom:1px solid var(--border-hairline)"><span class="act-sub" style="margin-right:8px">${l}</span><span style="font-size:12.5px">${v}</span></div>`).join('');
  }catch(e){ toast('Fallback active','Translation unavailable — model unreachable','warn'); }
  busy(btn,false);
}

async function genSecRec(btn){
  busy(btn,true);
  try{
    const hot=S.sections.filter(s=>s.density>70).map(s=>`Section ${s.id}: ${Math.round(s.density)}%`).join(', ')||'none above 70%';
    const txt=await AI.call('crowd_prediction',
      `Current hot sections: ${hot}. Write ONE specific, actionable security recommendation (2-3 sentences) for the security lead: what resource to move, from where, to where, and the predicted effect with numbers. Plain text.`,
      { system: stadiumContext(), temperature: 0.6 });
    $('#secRec').innerHTML=md(txt);
    toast('Recommendation regenerated','From live section densities — gemini-2.5-flash');
  }catch(e){ toast('Fallback active','Keeping last recommendation','warn'); }
  busy(btn,false);
}

async function genSectionAnalysis(id,d,btn){
  busy(btn,true);
  try{
    const txt=await AI.call('crowd_prediction',
      `Analyze Section ${id} at ${d}% density right now. Give a 3-sentence tactical read: trend risk, recommended action, and what to watch next. Plain text.`,
      { system: stadiumContext(), temperature: 0.6 });
    const t=$('#secAnalysis'); if(t) t.innerHTML=`<div class="act-sub" style="margin-top:12px;line-height:1.65;padding:12px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.2);border-radius:12px">${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Section analysis unavailable','warn'); }
  busy(btn,false);
}

async function genEgress(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('crowd_prediction',
      `Write ONE specific egress-management recommendation (2-3 sentences) with numbers, based on parking and transit state. Plain text.`,
      { system: stadiumContext(), temperature: 0.6 });
    $('#egressRec').innerHTML=md(txt);
  }catch(e){ toast('Fallback active','Keeping last recommendation','warn'); }
  busy(btn,false);
}

async function genExitPlan(btn){
  busy(btn,true);
  try{
    const sec=document.getElementById('exitSec').value, mode=document.getElementById('exitMode').value;
    const txt=await AI.call('exit_planner',
      `A fan seated at ${sec} wants to leave via ${mode}. Rain is likely post-match, Lot F is 98% full, rail surge peaks 22:30-23:00, Gate C has a turnstile fault. Build their personal exit plan: WHEN to leave the seat (which match minute), WHICH gate, the walking route, and expected total time vs leaving at full-time whistle. ${mode.includes('♿')?'Fan uses a wheelchair — step-free route, accessible shuttle bay, staff assistance point.':''} 3-4 short numbered steps.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('exitPlanOut').innerHTML=`<div class="act-sub" style="margin-top:10px;line-height:1.65">${md(txt)}</div>`;
    pushActivity('🚇','chip-teal','Exit plan generated',`${sec} → ${mode} · pushed to fan app`);
  }catch(e){ toast('Fallback active','Exit planner unavailable','warn'); }
  busy(btn,false);
}
async function genTransit(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('crowd_prediction',
      `Using Google Search, check current real-world conditions relevant to post-match egress from MetLife Stadium, East Rutherford NJ tonight: NJ Transit Meadowlands rail status, Route 3 / NJ Turnpike traffic, and weather. Summarize in 3 short bullets with an operational takeaway.`,
      { grounded: true, temperature: 0.4 });
    $('#transitLive').innerHTML=md(txt)+'<div class="msg-meta" style="margin-top:8px">🌐 grounded in Google Search · live web data</div>';
  }catch(e){ toast('Fallback active','Live search unavailable','warn'); }
  busy(btn,false);
}

async function genSustain(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('energy_opt',
      `Generate 2 new energy/water/waste optimization actions as a JSON array: [{"icon":"emoji","title":"short action","impact":"quantified saving"}]. Be specific to current state. Output ONLY the JSON array.`,
      { system: stadiumContext(), temperature: 0.8 });
    const items=extractJSON(raw);
    $('#sustainQueue').innerHTML=items.map(i=>qrow(i.icon,'rgba(198,241,53,.1)',i.title,i.impact,'pill-teal','AI · New','')).join('');
    toast('Optimizations generated','2 new actions from live telemetry — gemini-2.5-flash');
  }catch(e){ toast('Fallback active','Optimization generation unavailable','warn'); }
  busy(btn,false);
}

/* ── Universal plan controls: approve / edit / reject on any AI output ── */
function approvePlan(id,btn,label){
  const el=document.getElementById(id);
  if(el?.isContentEditable){ el.contentEditable=false; el.style.cssText+='border:none;padding:0;background:none'; }
  btn.textContent='✓ Approved'; btn.disabled=true; btn.style.opacity=.6;
  toast(`${label} approved`,'Signed: Priya R. · logged to audit trail','crit');
  pushActivity('✓','chip-lime',`${label} approved`,'Signed by Priya R. · audit-logged');
}
function editPlan(id,btn){
  const el=document.getElementById(id); if(!el) return;
  if(el.isContentEditable){
    el.contentEditable=false;
    el.style.cssText=el.dataset.css||'';
    btn.textContent=btn.dataset.l||'✎ Edit plan';
    toast('Edits saved','Human revision recorded · marked as human-edited');
    pushActivity('✎','chip-amber','Plan edited by human','AI draft revised by Priya R.');
  }else{
    el.dataset.css=el.style.cssText; btn.dataset.l=btn.textContent;
    el.contentEditable=true; el.focus();
    el.style.cssText+=';border:1px dashed rgba(198,241,53,.5);border-radius:12px;padding:12px;background:rgba(198,241,53,.04);outline:none';
    btn.textContent='💾 Save';
    toast('Edit mode','Click into the text, make changes, then Save','warn');
  }
}
function rejectPlan(id,btn,label){
  const el=document.getElementById(id);
  if(el){ el.style.opacity=.45; el.style.textDecoration='line-through'; }
  btn.textContent='✕ Rejected'; btn.disabled=true;
  toast(`${label} rejected`,'Logged to human-override audit trail — AI will learn from this','warn');
  pushActivity('👤','chip-amber',`${label} rejected`,'Human override · logged for AI Control Center');
}

async function genGateRec(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('gate_rec',
      `As the gate-flow advisor: 96 of 104 gates are open. Gate C has a turnstile fault, Gate B queue was just rerouted to Gate A, Lot F parking is full (fans walking to Gate H side), and egress surge starts ~22:30. Recommend exactly which gates to open/close/re-staff in the next 30 minutes, with reasons. 3 short bullets.`,
      { system: stadiumContext(), temperature: 0.5 });
    const el=document.getElementById('gateRec');
    el.style.opacity=1; el.style.textDecoration='none';
    el.innerHTML=md(txt);
  }catch(e){ toast('Fallback active','Gate advisor unavailable','warn'); }
  busy(btn,false);
}

/* keep the AI Control Center live while it's on screen */
document.addEventListener('ai-event',()=>{
  if(document.querySelector('.nav-item.active')?.dataset.view==='aicenter') go('aicenter');
});

/* ───── Live simulation loop ───── */
setInterval(()=>{
  $('#clock').textContent=now();
},1000);
setInterval(()=>{
  // drift densities
  S.sections.forEach(s=>{ s.density=Math.max(20,Math.min(96,s.density+(Math.random()-0.5)*6)); });
  // repaint heatmap if visible
  document.querySelectorAll('.sec').forEach(p=>{
    p.setAttribute('fill',heatColor(S.sections[+p.dataset.idx].density));
  });
},3000);
const FEED_EVENTS=[
  ['🎫','chip-lime','Gate throughput spike','Gate C +18% — within capacity'],
  ['🧹','chip-teal','Cleaning route optimized','Concourse B — AI-sequenced'],
  ['🚇','chip-teal','Transit update','Rail headway improved to 6 min'],
  ['⚠','chip-amber','Queue forming','Food stall B4 — 12 min predicted'],
  ['✦','chip-lime','AI insight','Halftime surge model refreshed'],
];
setInterval(()=>{
  const ev=FEED_EVENTS[Math.floor(Math.random()*FEED_EVENTS.length)];
  pushActivity(...ev);
  const b=$('#notifBadge'); b.textContent=Math.min(99,+b.textContent+1);
},12000);

/* boot */
go('dashboard');
$('#clock').textContent=now();
