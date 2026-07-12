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
  <div class="view-sub">Welcome back, Udit. One pane of glass — all systems nominal except Section 105.</div></div>
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
</div>

<div class="section-row" style="margin-top:26px"><div class="section-title">Live Fan Experience Score</div>
  <button class="btn btn-ghost" onclick="genFX(this)">✦ Recompute</button></div>
<div class="card" id="fxCard">${fxCardBody(window.LIVE?.fan_experience?.[0])}</div>`,

brain: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Explainable Stadium Brain</div>
  <div class="view-sub">A decision intelligence platform — it observes, predicts, explains, and recommends. You decide.</div></div>
  <div style="display:flex;gap:10px">
    <button class="btn btn-ghost" onclick="voiceBrief(this)">🎙 Executive Brief</button>
    <button class="btn btn-lime" onclick="genBrain(this)">✦ Think now</button>
  </div>
</div>
<div id="briefOut"></div>

<div class="split-21">
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card" id="brainCard">
      <div class="section-row" style="margin:0 0 12px"><div class="section-title">The Brain — observe → predict → explain → recommend</div>
      <span class="pill pill-ok" id="brainStamp"><span class="dot dot-lime pulse"></span>last thought: on load</span></div>
      <div id="brainOut">
        ${brainBlock({situation:'Gate 2 operating normally · 96/104 gates open · Section 105 at 88% density.',
          prediction:'Gate 2 will exceed safe capacity in 11 minutes.',
          reason:'Three shuttle buses are arriving simultaneously while rail wave 19:15 is still clearing security.',
          actions:['Open Gate 5','Deploy 4 volunteers to the north entrance','Redirect shuttle arrivals through the north concourse'],
          expected:'Crowd density at Gate 2 reduced by ~38%; no queue spillover onto the plaza.',
          confidence:96,risk:'Very Low',improvement:'41%',time_saved:'9 min',
          alternatives:[{opt:'Hold shuttles at the depot for 10 min',why_not:'delays 1,400 fans and pushes the surge into the halftime window'},
                        {opt:'Do nothing',why_not:'Gate 2 queue breaches safe capacity with 89% probability'}]})}
      </div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">🧠 Reasoning Engine — never an alert without a why</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        ${['Why is Parking P3 full?','Why did the Gate C queue spike?','Why is Section 105 so hot?','Why did food sales drop at halftime?'].map(q=>
          `<button class="pill pill-dim" style="cursor:pointer" onclick="document.getElementById('whyIn').value='${q}';genReason(this)">${q}</button>`).join('')}
      </div>
      <div style="display:flex;gap:10px">
        <input id="whyIn" placeholder="Why … ?" style="flex:1;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:12px;padding:11px 14px;font-size:13px" onkeydown="if(event.key==='Enter')genReason(this)">
        <button class="btn btn-lime" onclick="genReason(this)">✦ Explain</button>
      </div>
      <div id="whyOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">🏅 Operational Scorecard — tonight</div>
      <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="genScorecard(this)">✦ AI verdict</button></div>
      <div class="grid-3">
        ${[['Safety','98%','var(--accent-lime)'],['Transport','91%','var(--accent-teal)'],['Medical','95%','var(--accent-lime)'],['Accessibility','100%','var(--accent-lime)'],['Sustainability','93%','var(--accent-teal)'],['Overall','95.4%','var(--accent-lime)']].map(([k,v,c])=>
          `<div class="card" style="padding:14px 16px"><div class="qmeta">${k}</div><div class="kpi-value" style="font-size:24px;color:${c}">${v}</div></div>`).join('')}
      </div>
      <div id="scoreOut"></div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">🌐 AI Situation Room</div>
      <span class="pill pill-live"><span class="dot dot-red pulse"></span>live timeline</span></div>
      <div class="sit-timeline" id="sitTimeline">${SIT_EVENTS.map(sitRow).join('')}</div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">🌡 Heat Stress Prediction</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="genHeatStress(this)">✦ Predict</button></div>
      ${row2('Pitch-side temp','31.4 °C · rising')}${row2('Heat index','39 °C feels-like')}${row2('Vulnerable visitors flagged','412 (elderly · pregnant · disabled)')}
      <div id="heatOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">🚑 Hospital Coordination</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="genHospital(this)">✦ Choose hospital</button></div>
      <div class="act-sub" style="margin-bottom:8px;line-height:1.5">Cardiac case, Sec 114 — not the nearest hospital, the <b style="color:var(--text-primary)">fastest suitable</b> one.</div>
      ${row2('Hackensack UMC','7.2 mi · ER load 91% · cath lab ✓')}
      ${row2('St. Joseph’s Paterson','9.8 mi · ER load 54% · cath lab ✓')}
      ${row2('Clara Maass','6.1 mi · ER load 62% · no cath lab')}
      <div id="hospOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">📚 Venue Learning</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="genLessons(this)">✦ Lessons learned</button></div>
      <div class="act-sub" style="line-height:1.6">After every match the stadium gets smarter — the AI writes its own post-match lessons and applies them to the next event.</div>
      <div id="lessonsOut"></div>
    </div>
  </div>
</div>`,

mission: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Predictive Mission Control</div>
  <div class="view-sub">Not a dashboard — a decision engine. What's happening, what happens next, why, and the top actions to prevent it.</div></div>
  <button class="btn btn-lime" onclick="genHorizon(this)">✦ Forecast next 30 min</button>
</div>

<div class="grid-4" id="horizonStrip">
  ${hzCard('NOW','pill-ok','Section 105 at 88% and rising; all other systems nominal. 41% international crowd.')}
  ${hzCard('+5 MIN','pill-teal','Halftime queue pressure begins at Concourse B food stalls. Gate C fault slows entry re-admissions.')}
  ${hzCard('+15 MIN','pill-warn','Sections 104–107 exceed 80% density as concourse surge peaks. Ramp C counter-flow risk.')}
  ${hzCard('+30 MIN','pill-pending','If no action: medical access to Sec 105 corridor constrained; rail platform pre-surge begins early.')}
</div>

<div class="split-21" style="margin-top:22px">
  <div class="card">
    <div class="section-row" style="margin:0 0 8px"><div class="section-title">What-If Simulator — test the disaster before it happens</div>
    <span class="pill pill-ok"><span class="dot dot-lime pulse"></span>digital war room</span></div>
    <div class="act-sub" style="margin-bottom:12px;line-height:1.55">Type any scenario. The AI simulates crowd movement, cascade effects, evacuation time, medical impact, revenue loss — and drafts the best response plan.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      ${['Gate 4 suddenly closes','Rain starts in 10 minutes','Train with 10,000 fans delayed 40 min','Power fails in Section B concourse'].map(s=>
        `<button class="pill pill-dim" style="cursor:pointer" onclick="document.getElementById('whatifIn').value='${s}';runWhatIf(this)">${s}</button>`).join('')}
    </div>
    <div style="display:flex;gap:10px">
      <input id="whatifIn" placeholder="What if ... ?" style="flex:1;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:var(--r-input,12px);padding:11px 14px;font-size:13px">
      <button class="btn btn-lime" onclick="runWhatIf(this)">▶ Simulate</button>
    </div>
    <div id="whatifOut"></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">AI Trust Score — incoming reports</div></div>
      <div class="act-sub" style="margin-bottom:8px;line-height:1.5">Every report is cross-checked against cameras, sensors and crowd telemetry before anyone scrambles.</div>
      ${TRUST_REPORTS.map((r,i)=>`<div class="qrow"><div class="qthumb" style="background:${r.bg}">${ico(r.ic,16)}</div>
        <div class="qbody"><div class="qtitle" style="font-size:12.5px">${r.title}</div><div class="qmeta">${r.src}</div></div>
        <button class="btn btn-ghost" style="padding:6px 12px;font-size:11px" onclick="scoreReport(${i},this)">✦ Verify</button></div>
        <div id="trust-${i}"></div>`).join('')}
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Crowd Emotion Map</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="readEmotions(this)">✦ Read the room</button></div>
      ${EMO_ZONES.map(z=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-hairline)">
        <span style="font-size:12.5px">${z.zone}</span>
        <span class="pill ${z.pill}" style="padding:3px 11px;font-size:10px">${z.emo}</span></div>`).join('')}
      <div id="emoOut"></div>
    </div>
  </div>
</div>

<div class="grid-2" style="margin-top:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Root Cause Explorer</div>
    <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="genRootCause(this)">✦ Explain why</button></div>
    <div class="act-sub" style="line-height:1.6">The system never just says "congestion happened." Pick the live anomaly and it reconstructs the causal chain — metro delays, gate maintenance, weather reroutes, screening slowdowns.</div>
    <div class="qrow" style="margin-top:8px"><div class="qthumb" style="background:rgba(240,166,59,.14)">${ico('alert',16)}</div>
      <div class="qbody"><div class="qtitle">Anomaly: Concourse B congestion +34% vs forecast</div><div class="qmeta">detected 4 min ago · cause unknown to humans</div></div></div>
    <div id="rootOut"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Operational Twin Score — predicted vs actual</div>
    <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="genTwinScore(this)">✦ Learn from mismatch</button></div>
    <table class="table">
      <tr><th>Metric</th><th style="text-align:right">Predicted</th><th style="text-align:right">Actual</th><th style="text-align:right">Δ</th></tr>
      ${TWIN_METRICS.map(m=>`<tr><td style="font-weight:600">${m.k}</td><td class="mono" style="text-align:right">${m.p}</td><td class="mono" style="text-align:right">${m.a}</td>
        <td class="mono" style="text-align:right;color:${m.ok?'var(--accent-lime)':'var(--accent-amber)'}">${m.d}</td></tr>`).join('')}
    </table>
    <div id="twinOut"></div>
  </div>
</div>

<div class="grid-2" style="margin-top:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Mutual Aid Network — 16 stadiums, one inventory</div>
    <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="genMutualAid(this)">✦ Find resources</button></div>
    <div class="act-sub" style="margin-bottom:8px;line-height:1.5">MetLife is running low on medical kits. The network discovers surplus across venues and city agencies, plans the transfer, and preps the receiving team.</div>
    ${row2('MetLife — medical kits','<span style="color:var(--accent-red)">14 left · burn rate 6/hr</span>')}
    ${row2('Red Bull Arena (11 mi)','62 kits · surplus 30')}
    ${row2('NJ EMS depot, Secaucus (4 mi)','40 kits · on standby')}
    ${row2('Hard Rock Miami','no surplus tonight')}
    <div id="aidOut"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Swarm Coordination — one intelligent network</div>
    <button class="btn btn-lime" style="padding:6px 13px;font-size:11px" onclick="genSwarm(this)">✦ Coordinate swarm</button></div>
    <div class="act-sub" style="margin-bottom:8px;line-height:1.5">Guards, volunteers, medics, cleaners and robots treated as one system — the AI issues coordinated micro-orders, humans approve the set.</div>
    <div id="swarmOut">
      ${row2('Security Team Bravo','holding — Gate D cordon')}
      ${row2('Volunteer 18 (Kwame A.)','Ramp C flow steward')}
      ${row2('Medical M-1','staged — Gate B')}
      ${row2('Cleaning Robot 3','idle — dock 2')}
    </div>
  </div>
</div>

<div class="card" style="margin-top:18px">
  <div class="section-row" style="margin:0 0 10px"><div class="section-title">Ops Replay — Google-Maps-Timeline for the whole stadium</div>
  <span class="pill pill-dim">works fully offline · scrub the matchday</span></div>
  <div class="split-21">
    <div id="replayBox">${stadiumSVG(true)}</div>
    <div>
      <div class="kpi-value" style="font-size:26px;margin-bottom:4px" id="replayClock">19:00</div>
      <div class="act-sub" id="replayEvent" style="min-height:56px;line-height:1.6">Doors open. Early rail wave fills lower-east sections first.</div>
      <input type="range" min="0" max="24" value="0" style="width:100%;margin-top:10px;accent-color:var(--accent-lime)" oninput="replayTick(+this.value)">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-top:4px"><span>19:00 doors</span><span>21:00 kickoff</span><span>23:00 egress</span></div>
    </div>
  </div>
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
      <div class="section-row" style="margin:0 0 12px"><div class="section-title">Threat Alerts</div>
      <button class="btn btn-ghost" onclick="genThreatBrief(this)" style="padding:6px 13px;font-size:11px">✦ Shift briefing</button></div>
      <div id="threatList">${THREATS.map(threatRow).join('')}</div>
      <div id="threatBrief"></div>
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
</div>
<div class="section-row"><div class="section-title">International Visitor Safety</div>
<span class="pill pill-teal"><span class="dot dot-teal pulse"></span>41% of tonight's crowd is international</span></div>
<div class="grid-2">
  <div class="card">
    <div class="fan-card-head">${ico('mega',16)} Multilingual Safety Broadcast</div>
    <div class="act-sub" style="margin-bottom:10px;line-height:1.55">Type a safety instruction once — every fan phone receives it in their own language, instantly. Human sign-off required before send.</div>
    <input id="safetyIn" placeholder="e.g. Section 105 concourse congested — use Ramp D" style="width:100%;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:var(--r-input);padding:11px 14px;font-size:13px;margin-bottom:10px">
    <button class="btn btn-lime" onclick="genSafetyBroadcast(this)">✦ Generate in 5 languages</button>
    <div id="safetyOut"></div>
  </div>
  <div class="card">
    <div class="fan-card-head">${ico('pin',16)} Lost Person Finder — AI matching</div>
    <div class="act-sub" style="margin-bottom:10px;line-height:1.55">Describe a missing companion — AI matches against live found-person and sighting reports from stewards.</div>
    <input id="lostIn" placeholder="e.g. boy, ~8, red Mexico jersey, near Gate C" style="width:100%;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:var(--r-input);padding:11px 14px;font-size:13px;margin-bottom:10px">
    <button class="btn btn-lime" onclick="genLostMatch(this)">✦ Search reports</button>
    <div id="lostOut"></div>
  </div>
</div>
<div class="section-row"><div class="section-title">Advanced Detection &amp; Decision Support</div>
<span class="pill pill-dim">audio leads video by ~6 seconds</span></div>
<div class="grid-2">
  <div class="card">
    <div class="fan-card-head">${ico('mic',16)} Acoustic Sentinel — crowd sound as a signal</div>
    <div class="act-sub" style="margin-bottom:12px;line-height:1.55">Ambient mic arrays listen for panic-tone shifts — screaming, sudden silence, chant anomalies — seconds before cameras catch movement.</div>
    ${AUDIO_ZONES.map(z=>`<div class="audio-row" id="az-${z.id}">
      <span class="audio-zone">${z.name}</span>
      <span class="audio-bars ${z.alert?'alert':''}">${'<i></i>'.repeat(7)}</span>
      <span class="pill ${z.alert?'pill-pending':'pill-dim'}" style="padding:3px 10px;font-size:9.5px">${z.alert?'TONE DEVIATION':z.label}</span>
    </div>`).join('')}
    <button class="btn btn-red" style="margin-top:12px" onclick="classifyAudio(this)">✦ Classify Section 105 signal</button>
    <div id="audioOut"></div>
  </div>
  <div class="card">
    <div class="fan-card-head">${ico('spark',16)} Resource Conflict Negotiator</div>
    <div class="act-sub" style="margin-bottom:12px;line-height:1.55">Two zones want the same 3 stewards. The AI doesn't just alert — it resolves the trade-off on risk score and proposes; you approve.</div>
    <div class="qrow"><div class="qthumb" style="background:rgba(232,67,59,.12)">${ico('alert',16)}</div>
      <div class="qbody"><div class="qtitle">Section 104 requests 3 stewards</div><div class="qmeta">density 76% ↗ · halftime surge in 12 min</div></div></div>
    <div class="qrow"><div class="qthumb" style="background:rgba(240,166,59,.12)">${ico('alert',16)}</div>
      <div class="qbody"><div class="qtitle">Gate D requests 3 stewards</div><div class="qmeta">unattended bag cordon · crowd building at cordon edge</div></div></div>
    <button class="btn btn-lime" style="margin-top:12px" onclick="negotiate(this)">✦ Negotiate allocation</button>
    <div id="negOut"></div>
  </div>
</div>`,

emergency: () => `
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Emergency Intelligence Center</div>
  <div class="view-sub">The AI predicts, coordinates and assists before humans react — the commander only approves.</div></div>
  <button class="btn btn-red" id="emergBtn" onclick="emergencyMode(this)" style="padding:12px 22px;font-weight:700">${EMERG.active?'◼ EMERGENCY MODE ACTIVE':'⚡ Activate Emergency Mode'}</button>
</div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('⏱','chip-lime','glow-lime','Avg Response','74s','−12s','delta-up','target < 90s')}
  ${kpi('🚑','chip-red','glow-red','Units Available','11/14','3 deployed','delta-warn','2 medical · 1 security')}
  ${kpi('📋','chip-teal','glow-teal','Open Incidents','5','2 critical','delta-warn','vs 9 last match')}
  ${kpi('📡','chip-teal','glow-teal','Comms Health','93%','1 unit silent','delta-warn','radio + app + PA')}
</div>

<div class="card" style="margin-bottom:18px">
  <div class="section-row" style="margin:0 0 8px"><div class="section-title">🎤 Emergency Copilot — ask the command center anything</div>
  <span class="pill pill-live"><span class="dot dot-red pulse"></span>fused: CCTV · sensors · reports · crowd</span></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
    ${["What's happening right now?",'Where is the nearest AED to Section 114?','How many people are near Gate 4?','Show all medical emergencies','Generate an incident summary'].map(s=>
      `<button class="pill pill-dim" style="cursor:pointer" onclick="document.getElementById('copField').value='${s}';copilotAsk()">${s}</button>`).join('')}
  </div>
  <div style="display:flex;gap:10px">
    <input id="copField" placeholder="Ask the copilot — or use voice" style="flex:1;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:12px;padding:11px 14px;font-size:13px" onkeydown="if(event.key==='Enter')copilotAsk()">
    <button class="btn btn-ghost" id="copVoiceBtn" onclick="copVoice()" title="Voice command">${ico('mic',15)}</button>
    <button class="btn btn-red" onclick="copilotAsk()">▶ Ask</button>
  </div>
  <div id="copilotOut"></div>
</div>

<div class="split-21" style="margin-bottom:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">Live Hazard Map — dynamic safe zones</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="genSafeZones(this)">✦ Recompute safe zones</button>
      <button class="btn btn-lime" style="padding:6px 13px;font-size:11px" onclick="genEvacRoutes(this)">✦ Dynamic evac routes</button>
    </div></div>
    <div id="hazMap">${stadiumSVG(true)}</div>
    <div class="legend">
      <span><i class="sw" style="background:#E8433B"></i>hazard: fire · Food Court B</span>
      <span><i class="sw" style="background:#C6F135"></i>dynamic safe zone</span>
      <span><i class="sw" style="background:#F0A63B"></i>smoke drift → Gate 7</span>
    </div>
    <div id="evacRoutesOut"></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Multi-Hazard Board</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="prioritizeHazards(this)">✦ Prioritize</button></div>
      <div id="hazList">${HAZARDS.map(h=>`<div class="qrow"><div class="qthumb" style="background:${h.bg}">${h.ic}</div>
        <div class="qbody"><div class="qtitle" style="font-size:12.5px">${h.t}</div><div class="qmeta">${h.m}</div></div>
        <span class="pill ${h.pill}" style="padding:4px 11px;font-size:9.5px">${h.s}</span></div>`).join('')}</div>
      <div id="hazOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Stampede Prevention</div>
      <button class="btn btn-red" style="padding:5px 12px;font-size:10.5px" onclick="predictStampede(this)">✦ Predict</button></div>
      ${row2('Density Δ (Sec 105)','88% · +6%/5min')}
      ${row2('Walking speed','−38% vs normal')}
      ${row2('Direction changes','erratic · +210%')}
      ${row2('Noise level','96 dB → panic-tone check')}
      <div id="stampedeOut"></div>
    </div>
  </div>
</div>

<div class="grid-2" style="margin-bottom:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">🚑 Medical Priority Engine</div>
    <button class="btn btn-lime" style="padding:6px 13px;font-size:11px" onclick="triagePatients(this)">✦ AI triage</button></div>
    <table class="table" id="triageTable">
      <tr><th>Patient / report</th><th>Location</th><th>AI Priority</th></tr>
      ${PATIENTS.map((p,i)=>`<tr><td style="font-weight:600">${p.c}</td><td class="act-sub">${p.loc}</td>
        <td id="tri-${i}"><span class="pill pill-dim" style="padding:4px 11px;font-size:10px">unscored</span></td></tr>`).join('')}
    </table>
    <div id="triageOut"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">🎯 Responder Optimizer</div>
    <button class="btn btn-lime" style="padding:6px 13px;font-size:11px" onclick="optimizeResponder(this)">✦ Pick best unit</button></div>
    <div class="act-sub" style="margin-bottom:8px;line-height:1.5">Incident: <b style="color:var(--text-primary)">cardiac arrest, Sec 114 row 22</b>. Not the nearest unit — the fastest suitable one.</div>
    ${row2('M-1 (Gate B)','340m · defib ✓ · path 61% dense')}
    ${row2('M-3 (Sec 114)','on-scene other case · defib ✓')}
    ${row2('M-4 (North bay)','520m · defib ✓ · clear corridor')}
    ${row2('Volunteer first-aid 22','80m · CPR-trained · no defib')}
    <div id="respOut"></div>
  </div>
</div>

<div class="grid-2" style="margin-bottom:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">📱 Smart Zone Broadcast</div></div>
    <div class="act-sub" style="margin-bottom:10px;line-height:1.5">One incident, different instructions per zone — no stadium-wide panic. Human sign-off before send.</div>
    <input id="zbIn" placeholder="e.g. Smoke near Food Court B, spreading toward Gate 7" style="width:100%;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:12px;padding:11px 14px;font-size:13px;margin-bottom:10px">
    <button class="btn btn-red" onclick="zoneBroadcast(this)">✦ Generate zone-targeted instructions</button>
    <div id="zbOut"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">👶 Family Reunification</div></div>
    <div class="act-sub" style="margin-bottom:10px;line-height:1.5">Separated during an evacuation? QR tickets + checkpoint scans + AI pick the most likely reunion point.</div>
    <input id="reunIn" placeholder="e.g. Lost my son, 8, we got split at Ramp C during the crowd push" style="width:100%;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:12px;padding:11px 14px;font-size:13px;margin-bottom:10px">
    <button class="btn btn-lime" onclick="reunify(this)">✦ Find reunion point</button>
    <div id="reunOut"></div>
  </div>
</div>

<div class="grid-2" style="margin-bottom:18px">
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">📡 Comms Health — who acknowledged?</div>
    <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="commsAudit(this)">✦ Audit &amp; fix gaps</button></div>
    ${COMMS.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-hairline)">
      <span style="font-size:12.5px">${c.u}</span><span class="pill ${c.ok?'pill-ok':'pill-pending'}" style="padding:3px 11px;font-size:9.5px">${c.ok?'ACK '+c.t:'NO ACK · '+c.t}</span></div>`).join('')}
    <div id="commsOut"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 10px"><div class="section-title">🛰 Resource Map — fastest, not just nearest</div>
    <button class="btn btn-ghost" style="padding:6px 13px;font-size:11px" onclick="nearestResource(this)">✦ Nearest AED to Sec 114</button></div>
    ${row2('Ambulances','3 staged · 1 rolling')}
    ${row2('AEDs','28 mapped · 26 in cabinet')}
    ${row2('Wheelchairs','14 · 3 in use')}
    ${row2('Fire extinguishers','212 · all inspected')}
    ${row2('First-aid kits','<span style="color:var(--accent-red)">14 · mutual aid inbound</span>')}
    <div id="resOut"></div>
  </div>
</div>

<div class="card" style="margin-bottom:18px">
  <div class="section-row" style="margin:0 0 8px"><div class="section-title">🎥 Incident Auto-Recorder</div>
  <button class="btn btn-lime" style="padding:6px 13px;font-size:11px" onclick="genFinalReport(this)">✦ Generate final incident report</button></div>
  <div class="act-sub" style="margin-bottom:8px">Every incident starts its own timeline: CCTV refs, staff actions, response times — the report writes itself.</div>
  <div id="recLog">${EMERG.log.length?EMERG.log.map(l=>recRow(l)).join(''):'<div class="act-sub" style="padding:10px 4px">No active recording. Activating Emergency Mode (or any dispatch) starts the timeline automatically.</div>'}</div>
  <div id="reportOut"></div>
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
      <div style="display:flex;gap:8px;align-items:center">
        <button class="pill pill-ok" onclick="toast('Layer toggled','Crowd density overlay')">Crowd</button>
        <button class="pill pill-dim" onclick="toast('Layer toggled','Temperature overlay')">Temp</button>
        <button class="pill pill-dim" onclick="toast('Layer toggled','Incident overlay')">Incidents</button>
        <button class="btn btn-lime" style="padding:6px 14px;font-size:11px" onclick="ghostSim(this)">▶ Ghost simulation</button>
      </div></div>
    ${stadiumSVG(true)}
    <div id="ghostOut"></div>
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
<div class="view-head" style="display:flex;justify-content:space-between;align-items:flex-end">
  <div><div class="view-title">Sustainability Dashboard</div>
  <div class="view-sub">Live ESG telemetry — dashboards match the end-of-day audit, not vibes</div></div>
  <button class="btn btn-lime" onclick="genESGReport(this)">✦ ESG Report</button>
</div>
<div id="esgOut"></div>
<div class="grid-4" style="margin-bottom:22px">
  ${kpi('⚡','chip-lime','glow-lime','Energy','38.2 MW','−6%','delta-up','vs pre-AI baseline')}
  ${kpi('💧','chip-teal','glow-teal','Water','512 m³','−11%','delta-up','smart-fixture savings')}
  ${kpi('♻','chip-lime','glow-lime','Waste Diversion','78%','+9%','delta-up','target 75% ✓')}
  ${kpi('🌫','chip-teal','glow-teal','Carbon (est.)','41 t CO₂e','−14%','delta-up','per-match basis')}
</div>
<div class="split-21">
  <div class="card">
    <div class="section-row" style="margin:0 0 6px"><div class="section-title">Energy Profile — Matchday</div>
    <button class="btn btn-ghost" onclick="genChartExplain(this)" style="padding:6px 13px;font-size:11px">✦ Explain</button></div>
    <div class="act-sub">MW draw, actual vs AI-optimized schedule</div>
    <div class="chart-wrap">${energyChart()}</div>
    <div id="chartExplain"></div>
  </div>
  <div class="card">
    <div class="section-row" style="margin:0 0 12px"><div class="section-title">AI Optimization Queue</div>
    <button class="btn btn-ghost" onclick="genSustain(this)" style="padding:6px 13px;font-size:11px">✦ Generate new</button></div>
    <div id="sustainQueue"></div>
    ${qrow('❄','rgba(45,217,196,.12)','Pre-cool bowl 30 min earlier','Saves 1.8 MWh vs reactive HVAC','pill-ok','Applied','sus-detail')}
    ${qrow('💡','rgba(198,241,53,.12)','Dim concourse LEDs 20% at halftime','Crowd density permits · saves 0.4 MWh','pill-teal','Pending','sus-detail')}
    ${qrow('🚿','rgba(45,217,196,.12)','Stagger pitch irrigation','Off-peak water pricing window','pill-ok','Applied','sus-detail')}
  </div>
</div>

<div class="section-row" style="margin-top:26px"><div class="section-title">🍔 AI Food Waste Predictor</div>
  <button class="btn btn-lime" onclick="predictWaste(this)">✦ Predict pre-halftime waste</button></div>
<div class="card">
  <div class="act-sub" style="margin-bottom:10px">Gemini forecasts unsold inventory per outlet before halftime and recommends transfers — waste prevented before it exists. Saved to <span class="mono">food_waste</span>, live on every client.</div>
  <div id="wasteOut">${wasteTable(window.LIVE?.food_waste)}</div>
</div>`,

graph: () => `
<div class="view-head"><div class="view-title">Tournament Knowledge Graph</div>
<div class="view-sub">No module thinks alone — weather → crowd → transport → food → waste → operations. Ask anything; the AI reasons across every connected system and shows its causal path.</div></div>
<div class="card">
  <div style="display:flex;gap:10px">
    <input id="kgIn" placeholder='e.g. "Rain starts at minute 70 — what happens to food waste?"'
      style="flex:1;background:var(--bg-canvas);color:var(--text-primary);border:1px solid var(--border-hairline);border-radius:12px;padding:12px 14px;font-size:13px"
      onkeydown="if(event.key==='Enter')askGraph(this.nextElementSibling)">
    <button class="btn btn-lime" onclick="askGraph(this)">✦ Reason across systems</button>
  </div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
    ${['Rain at minute 70 — impact on waste?','Metro delay of 20 min — food demand?','Attendance +15% — sustainability hit?'].map(q=>
      `<button class="btn btn-ghost" style="padding:6px 12px;font-size:11px" onclick="document.getElementById('kgIn').value='${q}';askGraph(this)">${q}</button>`).join('')}
  </div>
  <div id="kgOut"></div>
</div>
<div class="card" style="margin-top:18px">
  <div class="section-title" style="margin-bottom:10px">The connected domains</div>
  <div class="cascade">${['🌦 Weather','◍ Crowd','🚇 Transport','🍔 Food','♻ Waste','⚡ Operations'].map(s=>`<span class="cas-step">${s}</span>`).join('<span class="cas-arrow">→</span>')}</div>
  <div class="act-sub" style="margin-top:12px;line-height:1.7">Every AI answer on this platform is grounded in one shared state (<span class="mono">stadiumContext()</span>) — so a question about waste can be answered through weather, crowd, and transport in a single causal chain, not module-by-module guesses.</div>
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
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Cross-Stadium Learning</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="genCrossLearn(this)">✦ Sync</button></div>
      <div class="act-sub" style="line-height:1.6;margin-bottom:8px">Incidents at any of the 16 venues update risk models tournament-wide when layout and crowd patterns match.</div>
      ${act('⇄','chip-teal','NRG Houston → 4 venues','Turnstile-jam surge pattern · models updated','31m ago')}
      ${act('⇄','chip-teal','Azteca CDMX → MetLife','Rain-egress rail crush pattern · threshold −5%','2h ago')}
      <div id="crossOut"></div>
    </div>
    <div class="card">
      <div class="section-row" style="margin:0 0 10px"><div class="section-title">Trust Loop — self-correcting alerts</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="genTrustLoop(this)">✦ Recalibrate</button></div>
      <div class="act-sub" style="line-height:1.6;margin-bottom:10px">Over-alerting trains humans to ignore alerts. The AI tracks its own dismissal rate per alert type and adjusts thresholds itself.</div>
      ${row2('Ramp flow anomaly','14 dismissals → threshold 62% → 75%')}
      ${row2('Queue-length warning','alerts −41% · zero missed incidents')}
      ${row2('Density surge','0 dismissals → threshold unchanged')}
      <div id="trustOut"></div>
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
    <button class="pill ${FAN.sensory?'pill-teal':'pill-dim'}" style="cursor:pointer" onclick="FAN.sensory=!FAN.sensory;go('fan');toast(FAN.sensory?'Sensory-friendly mode ON':'Sensory mode off',FAN.sensory?'Routes avoid loud, bright and crowded zones':'Standard routing restored')">${ico('drop',14)}&nbsp;${FAN.sensory?'Sensory: ON':'Sensory mode'}</button>
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
    ${FAN.sensory?`<div style="margin:12px 0 2px">
      <div class="act-sub" style="font-weight:600;color:var(--text-primary);margin-bottom:8px">Sensory load map</div>
      ${[['Concourse B','loud · bright','pill-pending'],['North plaza','calm · quiet','pill-ok'],['Ramp C','crowded','pill-warn'],['East gallery','low-sensory route','pill-ok']].map(([z,l,p])=>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-hairline)"><span style="font-size:12px">${z}</span><span class="pill ${p}" style="padding:3px 10px;font-size:9px">${l}</span></div>`).join('')}
    </div>`:''}
    <div id="fanRouteOut" style="margin-top:14px;min-height:120px">
      <div class="act-sub" style="line-height:1.6">Pick a destination — routes update with live crowd data${FAN.sensory?' and avoid loud, bright, crowded zones':''}.</div>
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
const FAN={ cart:{}, chat:[], order:null, lang:'en', wheelchair:false, sensory:false };
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
  mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
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
      `Fan at Section 233 Row 12, MetLife Stadium, wants to reach: ${dest}. Give walking directions in 2-3 numbered steps with estimated time, avoiding the crowded Section 105 concourse.${FAN.wheelchair?' The fan uses a WHEELCHAIR: route MUST be fully step-free — elevators and ramps only, mention the elevator location, add 30% to time estimates, and note the accessible viewing platform if relevant.':''}${FAN.sensory?' The fan is SENSORY-SENSITIVE: avoid loud zones (Concourse B), bright LED walls and dense crowds; prefer the quiet East gallery and North plaza; mention the calm room near Guest Services if they need a break.':''} Answer in ${LANGS[FAN.lang]}, friendly, short.`,
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

/* ───── Explainable Stadium Brain ───── */
function brainBlock(d){
  return `
  <div class="brain-seg"><div class="brain-k">CURRENT SITUATION</div><div class="brain-v">${d.situation}</div></div>
  <div class="brain-seg brain-warn"><div class="brain-k">PREDICTION</div><div class="brain-v">${d.prediction}</div></div>
  <div class="brain-seg"><div class="brain-k">REASON</div><div class="brain-v">${d.reason}</div></div>
  <div class="brain-seg brain-act"><div class="brain-k">RECOMMENDATION</div><div class="brain-v">${d.actions.map((a,i)=>`<div style="padding:2px 0"><b style="color:var(--accent-lime)">${i+1}.</b> ${a}</div>`).join('')}</div></div>
  <div class="brain-seg"><div class="brain-k">EXPECTED RESULT</div><div class="brain-v">${d.expected}</div></div>
  <div class="brain-score">
    <span class="pill pill-ok" style="padding:5px 13px">Confidence ${d.confidence}%</span>
    <span class="pill pill-teal" style="padding:5px 13px">Risk: ${d.risk}</span>
    <span class="pill pill-ok" style="padding:5px 13px">Improvement ${d.improvement}</span>
    <span class="pill pill-teal" style="padding:5px 13px">Saves ${d.time_saved}</span>
  </div>
  <div class="brain-alt"><div class="brain-k" style="margin-bottom:6px">ALTERNATIVES CONSIDERED — AND WHY NOT</div>
    ${d.alternatives.map(a=>`<div class="act-sub" style="padding:3px 0;line-height:1.5">• <b style="color:var(--text-primary)">${a.opt}</b> — ${a.why_not}</div>`).join('')}
  </div>
  <div style="display:flex;gap:10px;margin-top:14px">
    <button class="btn btn-lime" onclick="approvePlan('brainOut',this,'Brain recommendation');pushActivity('🧠','chip-lime','Brain recommendation approved','${(d.actions[0]||'').replace(/'/g,'')} · signed')">✓ Approve</button>
    <button class="btn btn-ghost" onclick="editPlan('brainOut',this)">✎ Modify</button>
    <button class="btn btn-ghost" onclick="rejectPlan('brainOut',this,'Brain recommendation')">✕ Reject</button>
  </div>`;
}
async function genBrain(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('brain',
      `You are the Stadium Brain. From the live state, pick the SINGLE most important thing happening right now and produce one decision cycle. Output ONLY JSON:
{"situation":"1-2 sentences, what is happening","prediction":"one sentence, what will happen and in how many minutes","reason":"one sentence, WHY it will happen","actions":["3 specific actions"],"expected":"one sentence with a number","confidence":<0-100>,"risk":"Very Low"|"Low"|"Medium"|"High","improvement":"e.g. 38%","time_saved":"e.g. 9 min","alternatives":[{"opt":"alternative considered","why_not":"why rejected"},{"opt":"...","why_not":"..."}]}`,
      { system: stadiumContext(), temperature: 0.5 });
    const d=extractJSON(raw);
    document.getElementById('brainOut').innerHTML=brainBlock(d);
    const st=document.getElementById('brainStamp'); if(st) st.innerHTML=`<span class="dot dot-lime pulse"></span>last thought: ${now()}`;
    sitPush('🧠',`Brain cycle: ${d.prediction}`,'prediction');
    pushActivity('🧠','chip-lime','Stadium Brain cycle',d.prediction.slice(0,70));
  }catch(e){ toast('Fallback active','Showing last decision cycle','warn'); }
  busy(btn,false);
}
/* Situation Room — explained live timeline */
const SIT_EVENTS=[
  {t:'19:30',txt:'Rain detected on approach radar',kind:'signal'},
  {t:'19:34',txt:'AI predicts slower entry — screening under canopy only',kind:'prediction'},
  {t:'19:36',txt:'Traffic increasing on Rt-3 W · +14% vs forecast',kind:'signal'},
  {t:'19:38',txt:'Gate 4 opened automatically (human-approved)',kind:'action'},
  {t:'19:41',txt:'Congestion avoided — entry rate back inside target',kind:'result'},
];
const SIT_STYLE={signal:'pill-teal',prediction:'pill-warn',action:'pill-ok',result:'pill-ok'};
function sitRow(e){
  return `<div class="sit-row"><span class="sit-t mono">${e.t}</span><span class="sit-dot ${e.kind}"></span>
  <span class="sit-txt">${e.txt}</span>
  <button class="sit-why" title="Why?" onclick="document.getElementById('whyIn').value='Why: ${e.txt.replace(/'/g,'')}';genReason(this)">why?</button></div>`;
}
function sitPush(ic,txt,kind='signal'){
  SIT_EVENTS.push({t:now().slice(0,5),txt,kind});
  const el=document.getElementById('sitTimeline');
  if(el){ el.insertAdjacentHTML('beforeend',sitRow(SIT_EVENTS[SIT_EVENTS.length-1])); el.scrollTop=el.scrollHeight; }
}
async function genReason(btn){
  const q=document.getElementById('whyIn').value.trim(); if(!q) return toast('Ask a why-question first','','warn');
  busy(btn,true);
  try{
    const raw=await AI.call('reasoning',
      `Explainable-AI analysis. Question: "${q}". Invent a plausible causal analysis consistent with the stadium state (you may assume: Brazil supporters arrived early, Metro Line 2 delayed 12 min, VIP buses occupy reserved parking, rain shower at 19:30, Gate C turnstile fault). Output ONLY JSON: {"causes":["3-4 short causal bullets, most important first"],"confidence":<0-100>,"fix":"one-line corrective action"}`,
      { system: stadiumContext(), temperature: 0.5 });
    const d=extractJSON(raw);
    document.getElementById('whyOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:13px 15px;margin-top:12px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.3);border-radius:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="color:var(--accent-teal)">AI Analysis — ${q.replace(/</g,'&lt;')}</b>
      <span class="pill pill-ok" style="padding:3px 11px;font-size:9.5px">confidence ${d.confidence}%</span></div>
      ${d.causes.map(c=>`• ${c}<br>`).join('')}
      <b style="color:var(--accent-lime)">→ ${d.fix}</b></div>`;
    pushActivity('🔍','chip-teal','Reasoning engine',q.slice(0,60));
  }catch(e){ toast('Fallback active','Causal analysis queued','warn'); }
  busy(btn,false);
}
async function voiceBrief(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('exec_voice',
      `Write the Stadium Director's spoken executive brief: 4-5 short sentences, calm chief-of-staff tone, starting "Good evening." Cover: overall status, the one thing that needs attention soon (with minutes), medical, parking/transit, and end with the risk level. Plain text, no formatting.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('briefOut').innerHTML=`<div class="card" style="margin-bottom:18px;border-color:rgba(198,241,53,.25)">
      <div class="section-row" style="margin:0 0 8px"><div class="section-title">🎙 Executive Brief — ${now()}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="speechSynthesis.cancel()">◼ Stop voice</button>
        <span class="pill pill-ok"><span class="dot dot-lime pulse"></span>speaking</span></div></div>
      <div class="act-sub" style="line-height:1.75;font-size:13px">${md(txt)}</div></div>`;
    if('speechSynthesis' in window){
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(txt.replace(/\*/g,''));
      u.rate=1.02; u.pitch=0.95; speechSynthesis.speak(u);
    }
    pushActivity('🎙','chip-lime','Executive brief delivered','Spoken by the AI chief of staff');
  }catch(e){ toast('Fallback active','Brief unavailable — model busy','warn'); }
  busy(btn,false);
}
async function genScorecard(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('scorecard',
      `Tonight's operational scorecard: Safety 98%, Transport 91%, Medical 95%, Accessibility 100%, Sustainability 93%, Overall 95.4%. Write the AI verdict in 3 short lines: the single weakest area and why, the standout win, and the one investment that raises the overall score most next match.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('scoreOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:12px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.25);border-radius:12px">${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Verdict unavailable','warn'); }
  busy(btn,false);
}
async function genHeatStress(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('heat_stress',
      `Heat stress forecast: pitch-side 31.4°C rising, heat index 39°C, humidity 58%, 82,450 attendance, 412 flagged vulnerable visitors, cooling break at 75'. Output ONLY JSON: {"peak":"expected peak feels-like with time","cases":<expected dehydration cases>,"actions":["3 preventive actions with numbers"],"vulnerable":"one line: what the 412 flagged visitors get automatically"}`,
      { system: stadiumContext(), temperature: 0.4 });
    const d=extractJSON(raw);
    document.getElementById('heatOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px">
      <b style="color:var(--accent-amber)">Peak: ${d.peak} · expected dehydration cases: ${d.cases}</b><br>
      ${d.actions.map((a,i)=>`<b style="color:var(--accent-lime)">${i+1}.</b> ${a}<br>`).join('')}
      <i style="color:var(--text-secondary)">${d.vulnerable}</i></div>`;
    sitPush('🌡',`Heat stress: ~${d.cases} dehydration cases predicted`,'prediction');
  }catch(e){ toast('Fallback active','Standard heat protocol remains','warn'); }
  busy(btn,false);
}
async function genHospital(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('hospital_coord',
      `Cardiac case at Sec 114 (stabilizing, needs cath lab). Hospitals: Hackensack UMC (7.2mi, ER 91% load, cath lab, traffic moderate), St Joseph's Paterson (9.8mi, ER 54%, cath lab, highway clear), Clara Maass (6.1mi, ER 62%, NO cath lab). Ambulance ready at North bay. Choose. Output ONLY JSON: {"hospital":"...","eta_min":n,"why":"one line beating the naive nearest choice","prealert":"one line: what the ER is told before arrival"}`,
      { temperature: 0.3 });
    const d=extractJSON(raw);
    document.getElementById('hospOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">→ ${d.hospital} · ETA ${d.eta_min} min</b><br>${d.why}<br>
      <i style="color:var(--text-secondary)">Pre-alert: ${d.prealert}</i></div>`;
    sitPush('🚑',`Hospital selected: ${d.hospital}`,'action');
  }catch(e){ toast('Fallback active','Nearest-hospital protocol used','warn'); }
  busy(btn,false);
}
async function genLessons(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('venue_learning',
      `Post-match venue learning. Tonight's data: Gate 6 caused entry congestion 19:40-20:05; Food Court B ran out of cold drinks minute 71; medical response improved 18% vs last match; rain egress handled cleanly via staggered exits. Write "Lessons Learned" as 3 short bullets + ONE structural recommendation for the next event. The stadium should get smarter.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('lessonsOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.3);border-radius:12px"><b style="color:var(--accent-teal)">Lessons — auto-applied to the next event model</b><br>${md(txt)}</div>`;
    sitPush('📚','Venue learning updated — next event model patched','result');
    pushActivity('📚','chip-teal','Venue learning','Stadium got smarter · lessons applied');
  }catch(e){ toast('Fallback active','Lessons deferred to post-match batch','warn'); }
  busy(btn,false);
}

/* ───── AI Emergency Intelligence System ───── */
const EMERG={ active:false, log:[] };
const HAZARDS=[
  {ic:'🔥',bg:'rgba(232,67,59,.14)',t:'Fire — Food Court B',m:'thermal + smoke sensor · CCTV confirmed',pill:'pill-pending',s:'CRITICAL'},
  {ic:'🌫',bg:'rgba(240,166,59,.14)',t:'Smoke drift → Gate 7',m:'HVAC pulling east · visibility dropping',pill:'pill-warn',s:'HIGH'},
  {ic:'⛈',bg:'rgba(45,217,196,.12)',t:'Lightning cell — 18 km out',m:'ETA ~35 min · open plaza exposure',pill:'pill-teal',s:'WATCH'},
  {ic:'⚡',bg:'rgba(240,166,59,.14)',t:'Power dip — Section B concourse',m:'UPS carried it · grid feed unstable',pill:'pill-warn',s:'MED'},
];
const PATIENTS=[
  {c:'Cardiac arrest (suspected)',loc:'Sec 114 row 22'},
  {c:'Panic attack',loc:'Ramp C mid-level'},
  {c:'Broken arm (fall)',loc:'Concourse B stairs'},
  {c:'Minor cuts (glass)',loc:'Food Court B edge'},
  {c:'Heat exhaustion, pregnant',loc:'Sec 233 upper'},
];
const COMMS=[
  {u:'Fire Team Alpha',ok:true,t:'4s'},{u:'Medical M-1 / M-3 / M-4',ok:true,t:'6s'},
  {u:'Security Bravo (Gate D)',ok:true,t:'9s'},{u:'Volunteer net — Ramp C',ok:false,t:'92s silent'},
  {u:'PA / signboard controller',ok:true,t:'2s'},
];
function recRow(l){return `<div class="act-row"><div class="act-chip ${l.chip}">${l.ic}</div>
  <div><div class="act-title">${l.t}</div><div class="act-sub">${l.s}</div></div><span class="act-time mono">${l.at}</span></div>`;}
function recLog(ic,chip,t,s){
  EMERG.log.unshift({ic,chip,t,s,at:now()});
  const box=document.getElementById('recLog');
  if(box) box.innerHTML=EMERG.log.map(recRow).join('');
}
function paintHazard(){
  const svg=document.querySelector('#hazMap svg'); if(!svg) return;
  svg.querySelectorAll('.sec').forEach(p=>{
    const i=+p.dataset.idx;
    if(i===6||i===7){ p.setAttribute('fill','#E8433B'); p.setAttribute('stroke','#ff8b85'); p.setAttribute('stroke-width','2'); }
    else if(i===8){ p.setAttribute('fill','#F0A63B'); }
    else if([0,1,12,13,23].includes(i)){ p.setAttribute('stroke','#C6F135'); p.setAttribute('stroke-width','2'); }
  });
  svg.insertAdjacentHTML('beforeend',
    `<text x="470" y="120" font-size="20">🔥</text><text x="500" y="170" font-size="14">🌫</text>
     <text x="130" y="90" font-size="13">🟢 SAFE</text><text x="120" y="300" font-size="13">🟢 SAFE</text>`);
}
async function emergencyMode(btn){
  if(EMERG.active) return toast('Emergency Mode already active','Stand-down requires commander sign-off in the recorder log','warn');
  EMERG.active=true;
  btn.textContent='◼ EMERGENCY MODE ACTIVE'; btn.style.animation='pulse 1.2s infinite';
  toast('⚡ EMERGENCY MODE ACTIVATED','Digital Commander sequencing the full response','crit');
  recLog('⚡','chip-red','EMERGENCY MODE ACTIVATED','Fire — Food Court B · declared by Udit');
  const steps=[
    ['🔒','chip-red','Unsafe gates locked','Gate 7 + Food Court B doors sealed remotely'],
    ['🚪','chip-lime','Safe exits opened','Gates 3 & 5 opened to full width · signboards updated'],
    ['🚒','chip-red','Fire Team Alpha dispatched','ETA 90s · route via service corridor S-2'],
    ['🚑','chip-red','Medical staged','M-1 + M-4 to triage point North plaza · hospitals alerted'],
    ['📣','chip-amber','Multilingual PA live','Zone-targeted instructions in EN/ES/FR/AR/PT'],
    ['📍','chip-teal','Evac tracking on','2,340 fans in affected zone · progress telemetry live'],
  ];
  steps.forEach((s,i)=>setTimeout(()=>{ recLog(...s); toast(s[2],s[3],i<3?'crit':'warn'); },(i+1)*1100));
  try{
    const raw=await AI.call('emergency_mode',
      `EMERGENCY MODE just activated: fire at Food Court B, smoke drifting to Gate 7, ~2,340 fans in affected zone, Gates 3 & 5 available, Fire Team Alpha + M-1/M-4 available. As Digital Commander produce the decision package. Output ONLY JSON: {"actions":["5-6 imperative actions, under 10 words each"],"evac_time":"m:ss estimate","affected":2340,"confidence":<0-100>,"watch":"one line: the thing most likely to go wrong next"}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    document.getElementById('copilotOut').insertAdjacentHTML('afterbegin',
      `<div class="act-sub" style="line-height:1.7;padding:14px 16px;margin-top:12px;background:rgba(232,67,59,.07);border:1px solid rgba(232,67,59,.35);border-radius:12px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><b style="color:#ff8b85;font-size:13px">⚡ DIGITAL COMMANDER — decision package</b>
      <span class="pill pill-pending" style="padding:3px 10px;font-size:9.5px">confidence ${d.confidence}%</span>
      <span class="pill pill-warn" style="padding:3px 10px;font-size:9.5px">evac est. ${d.evac_time}</span></div>
      ${d.actions.map((a,i)=>`<div style="padding:3px 0"><b style="color:var(--accent-lime)">${i+1}.</b> ${a}</div>`).join('')}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-hairline)"><b style="color:var(--accent-amber)">Watch:</b> ${d.watch}</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-red" onclick="this.textContent='✓ APPROVED — executing';this.disabled=true;recLog('✓','chip-lime','Commander approved decision package','Signed: Udit · all units executing');toast('Decision package approved','All units executing · logged','crit')">✓ Approve — execute all</button>
        <button class="btn btn-ghost" onclick="rejectPlan('copilotOut',this,'Decision package')">✕ Reject</button></div></div>`);
    recLog('🤖','chip-lime','AI decision package ready',`${d.actions.length} actions · confidence ${d.confidence}% · awaiting approval`);
  }catch(e){ recLog('🤖','chip-amber','AI package unavailable','Standard fire playbook FP-1 loaded instead'); }
}
async function copilotAsk(){
  const f=document.getElementById('copField'), q=f.value.trim(); if(!q) return;
  f.value='';
  const out=document.getElementById('copilotOut');
  out.insertAdjacentHTML('afterbegin',`<div id="copPend" style="margin-top:12px"><span class="typing"><i></i><i></i><i></i></span></div>`);
  try{
    const txt=await AI.call('emergency_copilot',
      `Command-center query: "${q}"`,
      { system:`You are the Emergency Copilot at the stadium command center. Live emergency picture: fire detected at Food Court B (CCTV+thermal confirmed), smoke drifting toward Gate 7, ~2,340 fans in the affected zone, Gates 3 & 5 designated safe exits, Fire Team Alpha ETA 90s, medical units M-1/M-4 staged North plaza, cardiac-arrest case Sec 114, volunteer radio net on Ramp C silent 92s. 28 AEDs mapped (nearest to Sec 114: cabinet AED-114E, concourse east, 40m). Answer like a calm military operations officer: terse "- " bullets, numbers first, end with the single recommended next action. ${stadiumContext()}`, temperature:0.3 });
    document.getElementById('copPend').outerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:13px 15px;margin-top:12px;background:rgba(255,255,255,.03);border:1px solid var(--border-hairline);border-radius:12px">
      <b style="color:var(--accent-teal)">◈ ${q.replace(/</g,'&lt;')}</b><br>${md(txt)}</div>`;
    recLog('🎤','chip-teal','Copilot query',q.slice(0,60));
  }catch(e){
    document.getElementById('copPend').outerHTML=`<div class="act-sub" style="padding:12px;margin-top:12px">Copilot busy — situation board: fire Food Court B, smoke → Gate 7, 2,340 affected, Gates 3 & 5 safe, Fire Team Alpha ETA 90s.</div>`;
  }
}
function copVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return toast('Voice unavailable','This browser lacks the Web Speech API','warn');
  const btn=document.getElementById('copVoiceBtn'), rec=new SR();
  rec.lang='en-US'; rec.interimResults=true;
  btn.classList.add('rec');
  rec.onresult=ev=>{ document.getElementById('copField').value=[...ev.results].map(r=>r[0].transcript).join(''); };
  rec.onend=()=>{ btn.classList.remove('rec'); if(document.getElementById('copField').value.trim()) copilotAsk(); };
  rec.onerror=()=>btn.classList.remove('rec');
  rec.start();
}
async function genEvacRoutes(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('safe_zones',
      `Generate DYNAMIC evacuation routes (not the static map). Constraints: fire at Food Court B (sections 107-108 area), smoke closing Gate 7, elevator E-2 disabled, Ramp C at 84% congestion, Gates 3 & 5 open and clear. For 3 groups — (a) Sections 105-108, (b) upper tier 200s, (c) wheelchair users — give each ONE route line: exit path → gate, with est. minutes. Then one line on what each fan's phone shows. 4 short lines total.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('evacRoutesOut').innerHTML=`<div class="act-sub" style="line-height:1.75;padding:13px 15px;margin-top:12px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">Live routes — avoiding fire, smoke, congestion &amp; dead elevators</b><br>${md(txt)}
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-red" onclick="this.textContent='✓ Pushed to 2,340 phones';this.disabled=true;recLog('📱','chip-lime','Personal evac routes pushed','2,340 fans · per-seat, per-mobility routing');toast('Routes pushed','Each fan sees their own safe route — signed Udit','crit')">Push to affected fans — sign-off</button></div></div>`;
    recLog('🗺','chip-lime','Dynamic evac routes computed','3 groups · hazard-aware · awaiting push approval');
  }catch(e){ toast('Fallback active','Static evacuation map remains authoritative','warn'); }
  busy(btn,false);
}
async function genSafeZones(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('safe_zones',
      `Recompute dynamic safe assembly zones. Inputs: fire Food Court B, smoke → Gate 7, rain starting in ~25 min (open plaza exposure), North plaza clear, West lot half-empty, Gate 3/5 corridors clear. Name the 2 best safe zones RIGHT NOW with capacity each, say which previous assembly point is now unsafe and why. 3 short lines.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('evacRoutesOut').innerHTML=`<div class="act-sub" style="line-height:1.75;padding:13px 15px;margin-top:12px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.3);border-radius:12px">
      <b style="color:var(--accent-teal)">Safe zones recomputed — assembly points are not fixed anymore</b><br>${md(txt)}</div>`;
    recLog('🚧','chip-teal','Safe zones recomputed','Weather + hazard aware · signboards queued');
  }catch(e){ toast('Fallback active','Default assembly points remain','warn'); }
  busy(btn,false);
}
async function prioritizeHazards(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('emergency_copilot',
      `Multi-hazard prioritization. Active: ${HAZARDS.map(h=>`${h.t} (${h.m})`).join('; ')}. Plus cardiac arrest Sec 114. Rank the response order, state which hazards share resources vs conflict, and the ONE interaction between hazards nobody would spot (e.g. power dip disables smoke extraction). 4 short lines.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('hazOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(232,67,59,.06);border:1px solid rgba(232,67,59,.3);border-radius:12px"><b style="color:#ff8b85">Response order — resource-aware</b><br>${md(txt)}</div>`;
    recLog('🌪','chip-red','Multi-hazard prioritized','4 hazards + medical ranked · interaction flagged');
    // Persist the emergency recommendation → emergency_alerts (live).
    window.Firestore?.save('emergency',{ title:'Multi-hazard prioritization', description:HAZARDS.map(h=>h.t).join('; '),
      type:'multi-hazard', severity:'high', location:'Command Center', status:'in_progress', aiRecommendation:txt });
  }catch(e){ toast('Fallback active','Severity-order fallback: fire, smoke, power, weather','warn'); }
  busy(btn,false);
}
async function predictStampede(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('stampede',
      `Stampede risk assessment, Section 105 concourse. Signals: density 88% rising 6%/5min, walking speed −38%, direction changes +210% (erratic), noise 96 dB with chant collapse, two counter-flows meeting at Ramp C. Output ONLY JSON: {"risk":<0-100>,"eta_min":<minutes to critical if unchecked>,"trigger":"most likely trigger event","actions":["3 preventive actions, under 10 words each"]}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    const col=d.risk>=70?'var(--accent-red)':d.risk>=40?'var(--accent-amber)':'var(--accent-teal)';
    document.getElementById('stampedeOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(232,67,59,.06);border:1px solid rgba(232,67,59,.3);border-radius:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span class="kpi-value" style="font-size:24px;color:${col}">${d.risk}%</span>
      <span><b style="color:var(--text-primary)">stampede risk</b><br><span class="qmeta">critical in ~${d.eta_min} min if unchecked</span></span></div>
      <b style="color:var(--accent-amber)">Trigger:</b> ${d.trigger}<br>${d.actions.map((a,i)=>`<b style="color:var(--accent-lime)">${i+1}.</b> ${a}<br>`).join('')}</div>`;
    recLog('🏃','chip-red','Stampede risk scored',`${d.risk}% · Section 105 · preventive actions issued`);
  }catch(e){ toast('Fallback active','Manual crowd-watch posture maintained','warn'); }
  busy(btn,false);
}
async function triagePatients(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('med_triage',
      `Triage these simultaneous cases: ${PATIENTS.map((p,i)=>`${i+1}. ${p.c} at ${p.loc}`).join('; ')}. Output ONLY a JSON array, same order: [{"i":<index 0-based>,"pr":"CRITICAL"|"HIGH"|"MEDIUM"|"LOW","unit":"which unit/volunteer to send","why":"under 8 words"}]`,
      { system: stadiumContext(), temperature: 0.2 });
    const rows=extractJSON(raw);
    const pill={CRITICAL:'pill-pending',HIGH:'pill-warn',MEDIUM:'pill-teal',LOW:'pill-ok'};
    rows.forEach(r=>{ const el=document.getElementById(`tri-${r.i}`);
      if(el) el.innerHTML=`<span class="pill ${pill[r.pr]||'pill-dim'}" style="padding:4px 11px;font-size:10px">${r.pr}</span><div class="qmeta" style="margin-top:3px">${r.unit} · ${r.why}</div>`; });
    recLog('🚑','chip-red','Medical triage complete',`${rows.length} cases prioritized · units matched`);
    toast('Triage complete','Every medic knows who to help first','crit');
  }catch(e){ toast('Fallback active','Protocol triage: cardiac first, then heat/pregnancy','warn'); }
  busy(btn,false);
}
async function optimizeResponder(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('responder_opt',
      `Cardiac arrest Sec 114 row 22. Candidates: M-1 Gate B (340m, defib, path 61% crowd density); M-3 (already on-scene Sec 114 treating another case, has defib); M-4 North bay (520m, defib, clear corridor); Volunteer 22 (80m, CPR-trained, NO defib). Pick the optimal PLAY (may combine units). Output ONLY JSON: {"play":"one line","first_on_scene":"unit + eta seconds","defib_eta":"seconds","why":"one line beating the naive nearest-unit choice"}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    document.getElementById('respOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">Optimal play:</b> ${d.play}<br>
      <b style="color:var(--text-primary)">First on scene:</b> ${d.first_on_scene} · <b style="color:var(--text-primary)">Defib:</b> ${d.defib_eta}<br>
      <i style="color:var(--text-secondary)">${d.why}</i>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-red" onclick="this.textContent='✓ Dispatched';this.disabled=true;recLog('🎯','chip-red','Optimized dispatch executed','Cardiac Sec 114 · combined play · signed Udit');toast('Dispatch executed','CPR starts before defib arrives — seconds saved','crit')">✓ Dispatch</button></div></div>`;
  }catch(e){ toast('Fallback active','Nearest-unit dispatch: M-1 rolling','warn'); }
  busy(btn,false);
}
async function zoneBroadcast(btn){
  const q=document.getElementById('zbIn').value.trim()||'Smoke near Food Court B, spreading toward Gate 7';
  busy(btn,true);
  try{
    const raw=await AI.call('zone_broadcast',
      `Incident: "${q}". Write ZONE-TARGETED emergency instructions — different per zone, calm, imperative, under 15 words each. Output ONLY JSON: {"sec_a":"Sections 105-108 (nearest hazard)","sec_c":"far sections","upper":"upper tier 200s","vip":"VIP boxes","concourse":"fans already on concourse"} — values are the instructions.`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    const zones=[['Sec 105–108',d.sec_a,'pill-pending'],['Far sections',d.sec_c,'pill-ok'],['Upper 200s',d.upper,'pill-teal'],['VIP boxes',d.vip,'pill-warn'],['Concourse',d.concourse,'pill-warn']];
    document.getElementById('zbOut').innerHTML=zones.map(([z,t,p])=>`<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-hairline)">
      <span class="pill ${p}" style="padding:3px 10px;font-size:9.5px;min-width:86px;text-align:center">${z}</span><span style="font-size:12.5px;line-height:1.4">${t}</span></div>`).join('')+
      `<button class="btn btn-red" style="margin-top:12px" onclick="this.textContent='✓ Sent — signed: Udit';this.disabled=true;recLog('📣','chip-amber','Zone-targeted broadcast sent','5 zones, 5 different instructions · multilingual');toast('Zone broadcast sent','Each zone got only what it needs — no stadium-wide panic','crit')">Send per-zone — requires sign-off</button>`;
  }catch(e){ toast('Fallback active','Uniform PA announcement queued instead','warn'); }
  busy(btn,false);
}
async function reunify(btn){
  const q=document.getElementById('reunIn').value.trim(); if(!q) return toast('Describe who you lost','','warn');
  busy(btn,true);
  try{
    const raw=await AI.call('reunify',
      `Family separation during evacuation. Report: "${q}". System data: child-wristband ping near Gate 3 checkpoint 2 min ago; QR ticket for the family group scanned at Gate 3 (1 of 3 tickets); parent reporting from Ramp C; Guest Services North is inside the current safe zone; crowd flow Ramp C → Gate 5. Output ONLY JSON: {"likely_loc":"where the missing person probably is","reunion_point":"best reunion point given evacuation flow","route":"one-line route for the reporter","notify":"one line: what both parties' phones show","confidence":<0-100>}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    document.getElementById('reunOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.06);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">Probable location (${d.confidence}%):</b> ${d.likely_loc}<br>
      <b style="color:var(--text-primary)">Reunion point:</b> ${d.reunion_point}<br>
      <b style="color:var(--text-primary)">Your route:</b> ${d.route}<br>
      <i style="color:var(--text-secondary)">${d.notify}</i></div>`;
    recLog('👶','chip-lime','Reunification match','Wristband + QR + checkpoint fused · both parties notified');
  }catch(e){ toast('Fallback active','Description pushed to all checkpoint stewards','warn'); }
  busy(btn,false);
}
async function commsAudit(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('comms_health',
      `Comms audit during active fire response. Status: ${COMMS.map(c=>`${c.u}: ${c.ok?'ACK '+c.t:'NO ACK, silent '+c.t}`).join('; ')}. The volunteer net on Ramp C is silent 92s during an evacuation — that zone is mid-flow. Give: severity of the gap, most likely cause, the backup channel to use RIGHT NOW, and who physically checks on them. 4 short lines.`,
      { system: stadiumContext(), temperature: 0.3 });
    document.getElementById('commsOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px"><b style="color:var(--accent-amber)">Comms gap — Ramp C volunteer net</b><br>${md(txt)}</div>`;
    recLog('📡','chip-amber','Comms gap flagged','Ramp C net silent 92s · backup channel activated');
  }catch(e){ toast('Fallback active','Runner dispatched to Ramp C to check','warn'); }
  busy(btn,false);
}
async function nearestResource(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('responder_opt',
      `Nearest AED to Section 114 row 22: candidates AED-114E (concourse east, 40m, cabinet), AED-G-B (Gate B, 340m), AED-M1 (on unit M-1, currently 340m moving closer). Crowd on east concourse 61%. Answer in 2 lines: which AED, who grabs it (steward vs bystander), and the retrieval time estimate.`,
      { system: stadiumContext(), temperature: 0.2 });
    document.getElementById('resOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.3);border-radius:12px"><b style="color:var(--accent-teal)">Fastest AED play</b><br>${md(txt)}</div>`;
    recLog('🛰','chip-teal','Resource located','AED routed to Sec 114 · fastest retrieval path');
  }catch(e){ toast('Fallback active','AED cabinet map opened for manual lookup','warn'); }
  busy(btn,false);
}
async function genFinalReport(btn){
  busy(btn,true);
  try{
    const timeline=EMERG.log.length?EMERG.log.slice().reverse().map(l=>`${l.at} — ${l.t}: ${l.s}`).join('\n'):'(no recorded events this session — use last match: fire drill Food Court B, 6m42s clear, zero injuries)';
    const txt=await AI.call('auto_recorder',
      `Write the official post-incident report from this auto-recorded timeline:\n${timeline}\n\nFormat: 1) Incident summary (2 sentences). 2) Response timeline highlights (3 bullets with times). 3) What worked / what to fix (2 bullets). 4) One recommendation for the next match. Professional, audit-ready.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('reportOut').innerHTML=`<div class="card" style="margin-top:12px;border-color:rgba(198,241,53,.25)">
      <div class="section-row" style="margin:0 0 8px"><div class="section-title">✦ Post-Incident Report — ${now()}</div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="navigator.clipboard.writeText(this.closest('.card').innerText);this.textContent='✓ Copied'">⧉ Copy</button></div>
      <div class="act-sub" style="line-height:1.75">${md(txt)}</div></div>`;
    toast('Report generated','From the auto-recorded timeline — nobody wrote it by hand');
    // Persist the incident summary → ai_reports (live to every dashboard).
    window.Firestore?.save('incident',{ title:`Post-incident report — ${now()}`, summary:txt, generatedBy:AI.activeModel });
  }catch(e){ toast('Fallback active','Raw timeline exported for manual write-up','warn'); }
  busy(btn,false);
}

/* ───── Predictive Mission Control ───── */
function hzCard(t,pill,body){
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
  <span class="pill ${pill}" style="padding:4px 12px;font-size:10px;font-weight:700">${t}</span></div>
  <div class="act-sub" style="line-height:1.6">${body}</div></div>`;
}
const TRUST_REPORTS=[
  {ic:'alert',bg:'rgba(232,67,59,.14)',title:'"Fire near Gate 8"',src:'volunteer radio · 40s ago',
   evidence:'Smoke sensor Gate 8: clear. CAM-G8: food-stand steam visible. No other reports. Crowd movement normal.'},
  {ic:'pin',bg:'rgba(240,166,59,.14)',title:'"Fight breaking out, Sec 121"',src:'fan app report · 2m ago',
   evidence:'CAM-121-S: cluster of 8-10 people, raised arms. Acoustic array: chant spike, no panic tones. 2 more fan reports from same section in last 90s.'},
  {ic:'drop',bg:'rgba(45,217,196,.12)',title:'"Flooding in restroom B4"',src:'cleaning staff · 5m ago',
   evidence:'Water-flow meter B4: +380% vs nominal. Cleaning queue: no prior ticket. Adjacent camera: fans avoiding entrance.'},
];
async function scoreReport(i,btn){
  const r=TRUST_REPORTS[i]; busy(btn,true);
  const box=document.getElementById(`trust-${i}`);
  try{
    const raw=await AI.call('trust_score',
      `Incoming stadium report: ${r.title} (${r.src}). Cross-check evidence: ${r.evidence}. Score how likely this is a REAL incident. Output ONLY JSON: {"confidence":<0-100>,"verdict":"Likely Real Incident"|"Probably False Alarm"|"Needs Human Eyes","why":"one line","action":"one-line dispatch or stand-down instruction"}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    const col=d.confidence>=70?'var(--accent-red)':d.confidence>=40?'var(--accent-amber)':'var(--accent-teal)';
    box.innerHTML=`<div class="act-sub" style="line-height:1.65;padding:11px 13px;margin:4px 0 8px;background:rgba(255,255,255,.03);border:1px solid var(--border-hairline);border-radius:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span class="kpi-value" style="font-size:22px;color:${col}">${d.confidence}%</span>
        <b style="color:var(--text-primary)">${d.verdict}</b></div>
      ${d.why}<br><b style="color:var(--accent-lime)">→ ${d.action}</b></div>`;
    pushActivity('🛡','chip-teal','Report trust-scored',`${r.title} · ${d.confidence}% · ${d.verdict}`);
  }catch(e){ box.innerHTML='<div class="act-sub" style="padding:8px 4px">Verification service busy — dispatching steward to eyeball it (standard protocol).</div>'; }
  busy(btn,false);
}
const EMO_ZONES=[
  {zone:'Bowl — home sections',emo:'😊 excited',pill:'pill-ok'},
  {zone:'Section 105 concourse',emo:'😫 frustrated',pill:'pill-warn'},
  {zone:'Gate D cordon edge',emo:'😐 tense-calm',pill:'pill-teal'},
  {zone:'Away block 118–121',emo:'😡 agitated',pill:'pill-pending'},
  {zone:'Family zone, North',emo:'😊 relaxed',pill:'pill-ok'},
];
async function readEmotions(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('emotion_map',
      `Crowd emotion estimates by zone: ${EMO_ZONES.map(z=>`${z.zone}: ${z.emo.replace(/^\S+\s/,'')}`).join('; ')}. Signals: away block chanting turned hostile after the 60th-minute tackle; Sec 105 queue wait 14 min. As crowd-psychology advisor, give the ops lead a 3-sentence read: which single zone worries you most, what emotion shift would be the tripwire, and the one soft intervention (not force) to defuse it.`,
      { system: stadiumContext(), temperature: 0.6 });
    document.getElementById('emoOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:11px 13px;margin-top:10px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px">${md(txt)}</div>`;
    pushActivity('🎭','chip-amber','Crowd emotion read','Away block flagged · soft intervention proposed');
  }catch(e){ toast('Fallback active','Emotion telemetry cached from last cycle','warn'); }
  busy(btn,false);
}
async function genHorizon(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('horizon',
      `Predictive mission control. Forecast stadium operations at four horizons. Output ONLY a JSON array of 4: [{"t":"NOW"|"+5 MIN"|"+15 MIN"|"+30 MIN","risk":"low"|"med"|"high","body":"1-2 specific sentences with numbers: what happens, why, and the single best preventive action"}]`,
      { system: stadiumContext(), temperature: 0.6 });
    const cards=extractJSON(raw);
    const pill={low:'pill-ok',med:'pill-warn',high:'pill-pending'};
    document.getElementById('horizonStrip').innerHTML=cards.map(c=>hzCard(c.t,pill[c.risk]||'pill-teal',c.body)).join('');
    toast('Horizon refreshed','Forecast regenerated from live stadium state');
    pushActivity('🔮','chip-lime','Predictive horizon updated','NOW / +5 / +15 / +30 min re-forecast');
    // Persist the Gemini forecast → Firestore (crowd_predictions + ai_reports),
    // which streams back to every connected dashboard in real time.
    const risky=cards.find(c=>c.risk==='high')||cards[cards.length-1];
    const riskMap={high:'high',med:'medium',low:'low'};
    window.Firestore?.save('crowd',{ zone:'Stadium-wide', currentCrowd:S.attendance,
      predictedCrowd:Math.round(S.attendance*1.02), riskLevel:riskMap[risky?.risk]||'medium',
      confidence:0.8, recommendation:risky?.body||'Monitoring nominal.' });
    window.Firestore?.save('report',{ title:'Predictive horizon', summary:cards.map(c=>`${c.t}: ${c.body}`).join(' '),
      generatedBy:AI.activeModel });
  }catch(e){ toast('Fallback active','Showing last computed horizon','warn'); }
  busy(btn,false);
}
async function runWhatIf(btn){
  const q=document.getElementById('whatifIn').value.trim();
  if(!q) return toast('Describe a scenario first','e.g. "Gate 4 suddenly closes"','warn');
  busy(btn,true);
  const out=document.getElementById('whatifOut');
  out.innerHTML='<div style="margin-top:14px"><span class="typing"><i></i><i></i><i></i></span></div>';
  try{
    const raw=await AI.call('what_if',
      `WHAT-IF SIMULATION. Scenario: "${q}". Simulate the full operational impact. Output ONLY JSON:
{"cascade":["4-6 short domino steps, each under 8 words, in causal order"],
"evac_min":"est. evacuation/clear time if needed, e.g. 7.5",
"medical":"one-line medical impact",
"revenue":"est. revenue impact, e.g. -$48k concessions",
"crowd":"one-line crowd movement shift",
"plan":[{"n":1,"act":"specific action"},{"n":2,"act":"..."},{"n":3,"act":"..."}],
"outcome":"one line: expected result if the plan is executed"}`,
      { system: stadiumContext(), temperature: 0.5 });
    const d=extractJSON(raw);
    out.innerHTML=`<div style="margin-top:16px">
      <div class="cascade">${d.cascade.map(s=>`<span class="cas-step">${s}</span>`).join('<span class="cas-arrow">→</span>')}</div>
      <div class="grid-4" style="margin-top:14px">
        ${[['⏱ Clear time',d.evac_min+' min'],['✚ Medical',d.medical],['💸 Revenue',d.revenue],['◍ Crowd shift',d.crowd]].map(([k,v])=>
          `<div class="card" style="padding:13px 15px"><div class="qmeta" style="margin-bottom:5px">${k}</div><div style="font-size:12.5px;font-weight:600;line-height:1.45">${v}</div></div>`).join('')}
      </div>
      <div class="card" style="margin-top:14px;padding:16px;background:rgba(198,241,53,.05);border-color:rgba(198,241,53,.25)">
        <div class="qtitle" style="font-size:12.5px;margin-bottom:8px">✦ Best response plan</div>
        ${d.plan.map(p=>`<div class="act-sub" style="padding:4px 0;line-height:1.55"><b style="color:var(--accent-lime)">${p.n}.</b> ${p.act}</div>`).join('')}
        <div class="act-sub" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-hairline)"><b style="color:var(--text-primary)">Expected outcome:</b> ${d.outcome}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-lime" onclick="approvePlan('whatifOut',this,'Contingency plan')">✓ Adopt as contingency</button>
          <button class="btn btn-ghost" onclick="rejectPlan('whatifOut',this,'Simulation')">✕ Discard</button></div>
      </div></div>`;
    pushActivity('🧪','chip-lime','What-if simulation run',`"${q}" · cascade + response plan drafted`);
  }catch(e){
    out.innerHTML=`<div class="act-sub" style="margin-top:14px;padding:12px 14px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px">Simulator busy — cached run for a similar scenario: gate closure shifts ~4,100 fans to adjacent gates, queue +9 min, medical corridor unaffected. Standard playbook GC-2 applies.</div>`;
  }
  busy(btn,false);
}
async function genRootCause(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('root_cause',
      `Anomaly: Concourse B congestion is +34% vs forecast. Contributing signals: metro arrived 12 min late; 2 gates under maintenance; rain shower redirected plaza pedestrians inside; security screening throughput down 18% after a staffing swap. Reconstruct the causal chain as 4 short bullets (cause → contribution %), then ONE sentence naming the dominant cause and the fix.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('rootOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.25);border-radius:12px"><b style="color:var(--accent-teal)">Causal chain reconstructed</b><br>${md(txt)}</div>`;
    pushActivity('🔍','chip-teal','Root cause identified','Concourse B congestion · dominant cause named');
  }catch(e){ toast('Fallback active','Causal analysis queued','warn'); }
  busy(btn,false);
}
const TWIN_METRICS=[
  {k:'Crowd',p:'71,000',a:'70,845',d:'−0.2%',ok:true},
  {k:'Peak queue',p:'8 min',a:'9 min',d:'+12%',ok:false},
  {k:'Medical cases',p:'11',a:'10',d:'−1',ok:true},
  {k:'Egress (rail)',p:'32 min',a:'31 min',d:'−1 min',ok:true},
];
async function genTwinScore(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('twin_score',
      `Digital-twin calibration. Predicted vs actual tonight: crowd 71,000→70,845; peak queue 8→9 min; medical 11→10; rail egress 32→31 min. The queue prediction missed by 12%. In 3 short lines: overall twin accuracy score (0-100), why the queue model missed, and what parameter you are updating so next match is sharper.`,
      { temperature: 0.4 });
    document.getElementById('twinOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.25);border-radius:12px"><b style="color:var(--accent-lime)">The twin just learned from its own mismatch</b><br>${md(txt)}</div>`;
    pushActivity('📈','chip-lime','Twin model recalibrated','Queue parameter updated from tonight\'s miss');
  }catch(e){ toast('Fallback active','Calibration deferred to post-match batch','warn'); }
  busy(btn,false);
}
async function genMutualAid(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('mutual_aid',
      `Mutual aid: MetLife has 14 medical kits left, burn rate 6/hr, match ends in ~90 min. Available: Red Bull Arena (11 mi, 30 surplus kits, own match ends 22:00), NJ EMS depot Secaucus (4 mi, 40 kits, on standby, 15-min dispatch). Decide the best transfer. Output ONLY JSON: {"source":"...","qty":n,"route":"one line with road + ETA","eta_min":n,"receiving":"one-line prep instruction for MetLife medical bay","why":"one line"}`,
      { temperature: 0.4 });
    const d=extractJSON(raw);
    document.getElementById('aidOut').innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:12px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">Transfer proposed: ${d.qty} kits ← ${d.source} · ETA ${d.eta_min} min</b><br>
      ${d.route}<br><i style="color:var(--text-secondary)">${d.why}</i><br><b style="color:var(--text-primary)">Receiving team:</b> ${d.receiving}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-lime" onclick="this.textContent='✓ Both ops teams notified';this.disabled=true;toast('Mutual aid transfer approved','Source + receiving teams notified · route shared','crit');pushActivity('🤝','chip-lime','Mutual aid transfer','Medical kits inbound · cross-venue network')">✓ Approve transfer</button>
        <button class="btn btn-ghost" onclick="rejectPlan('aidOut',this,'Transfer')">✕ Reject</button></div></div>`;
  }catch(e){ toast('Fallback active','Escalated to city EMS coordinator by phone','warn'); }
  busy(btn,false);
}
async function genSwarm(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('swarm_ops',
      `Swarm coordination. Units: Security Team Bravo (Gate D cordon), Volunteer 18 Kwame (Ramp C), Medical M-1 (staged Gate B), Cleaning Robot 3 (idle dock 2), Volunteer 7 Elena (Gate B info point). Situation: Section 105 at 88%, halftime surge in 10 min, wet spill Exit C, unattended bag Gate D nearly cleared. Issue one coordinated micro-order per unit. Output ONLY a JSON array: [{"unit":"...","order":"under 10 words","why":"under 8 words"}]`,
      { system: stadiumContext(), temperature: 0.5 });
    const orders=extractJSON(raw);
    document.getElementById('swarmOut').innerHTML=orders.map(o=>`<div class="qrow">
      <div class="qthumb" style="background:rgba(198,241,53,.1)">📡</div>
      <div class="qbody"><div class="qtitle" style="font-size:12.5px">${o.unit} — ${o.order}</div><div class="qmeta">${o.why}</div></div>
      <span class="pill pill-ok" style="padding:4px 10px;font-size:9.5px">QUEUED</span></div>`).join('')+
      `<div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-lime" onclick="this.textContent='✓ Swarm executing';this.disabled=true;toast('Swarm orders approved','${orders.length} units re-tasked as one network — signed Udit','crit');pushActivity('📡','chip-lime','Swarm coordinated','${orders.length} units re-tasked in one approval')">✓ Approve all</button>
        <button class="btn btn-ghost" onclick="rejectPlan('swarmOut',this,'Swarm plan')">✕ Reject</button></div>`;
  }catch(e){ toast('Fallback active','Units keep current assignments','warn'); }
  busy(btn,false);
}
/* Ops Replay — deterministic matchday timeline, no network needed */
const REPLAY_EVENTS=[
  [0,'19:00','Doors open. Early rail wave fills lower-east sections first.'],
  [4,'19:40','Gate C turnstile fault begins — flow shifts to Gates B and D.'],
  [8,'20:20','Lot F fills. Walk-up crowd re-routes along the east plaza.'],
  [12,'21:00','Kickoff. Concourses drain into the bowl within 9 minutes.'],
  [15,'21:45','Halftime surge — Sections 104–107 concourse peaks at 88%.'],
  [18,'22:15','Steward reallocation approved · Section 105 cools 88% → 74%.'],
  [21,'22:45','Final whistle. Staggered egress notifications hold 22% of fans in-seat.'],
  [24,'23:00','Rail surge absorbed — headway 6 min, zero platform closures.'],
];
function replayTick(t){
  const ev=[...REPLAY_EVENTS].reverse().find(e=>t>=e[0])||REPLAY_EVENTS[0];
  document.getElementById('replayClock').textContent=`${String(19+Math.floor(t/6)).padStart(2,'0')}:${String((t%6)*10).padStart(2,'0')}`;
  document.getElementById('replayEvent').textContent=ev[2];
  document.querySelectorAll('#replayBox .sec').forEach(p=>{
    const i=+p.dataset.idx;
    // arrival wave → kickoff drain → halftime spike → egress fade
    const base=30+((i*37)%40), phase=Math.sin((t/24)*Math.PI*2+i*0.5)*12;
    const half=t>=14&&t<=17&&i>=4&&i<=7?30:0, egress=t>=21?-(t-20)*8:0;
    p.setAttribute('fill',heatColor(Math.max(15,Math.min(96,base+phase+half+egress))));
  });
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

/* ───── Global search — command palette ───── */
function searchIndex(){
  const idx=[];
  const P=(label,sub,view,ic)=>idx.push({type:'Pages',label,sub,ic,run:()=>go(view)});
  P('Dashboard','overview · KPIs · alerts','dashboard','▦');
  P('Stadium Brain','predictions · reasoning · executive brief','brain','🧠');
  P('Mission Control','what-if simulator · trust scores · replay','mission','◎');
  P('Security','heatmap · threats · cameras · broadcast','security','🛡');
  P('Emergency','copilot · evacuation · triage · hazards','emergency','🚨');
  P('Digital Twin','live model · ghost simulation','twin','🏟');
  P('Volunteers','roster · roles · break protocol','volunteers','🤝');
  P('Transport','parking · rail · exit planner','transport','🚇');
  P('Sustainability','energy · water · waste · ESG','sustainability','♻');
  P('AI Control','models · call log · trust loop','aicenter','✦');
  P('Fan App','navigate · food · assistant · wallet','fan','📱');
  S.sections.forEach(s=>idx.push({type:'Sections',label:`Section ${s.id}`,sub:`density ${Math.round(s.density)}% · ${s.density>85?'INTERVENE':s.density>70?'watch':'nominal'}`,ic:'◍',
    run:()=>{go('twin');setTimeout(()=>{const p=document.querySelector(`.sec[data-idx="${S.sections.indexOf(s)}"]`);if(p)secClick({target:p});},80);}}));
  THREATS.forEach(t=>idx.push({type:'Incidents',label:t.title,sub:`${t.meta} · ${t.status}`,ic:'⚠',run:()=>go('security')}));
  [['Fan collapse — Sec 114','medical · on-scene'],['Unattended bag — Gate D','security · dispatched'],['Turnstile T-14 jam (Gate C)','maintenance · resolved'],['Gate B queue overflow','resolved · rerouted']]
    .forEach(([l,s2])=>idx.push({type:'Incidents',label:l,sub:s2,ic:'📋',run:()=>go('emergency')}));
  VOLS.forEach(v=>idx.push({type:'People',label:v.name,sub:`${v.skills} · ${v.role}`,ic:v.emoji,run:()=>go('volunteers')}));
  const A=(label,sub,fn,ic='⚡')=>idx.push({type:'Actions',label,sub,ic,run:fn});
  A('Activate Emergency Mode','digital commander · full response',()=>{go('emergency');setTimeout(()=>document.getElementById('emergBtn')?.click(),150);},'🚨');
  A('Executive Brief (voice)','AI chief of staff speaks the status',()=>{go('brain');setTimeout(()=>voiceBrief(document.createElement('button')),150);},'🎙');
  A('Run Brain cycle','observe → predict → explain → recommend',()=>{go('brain');setTimeout(()=>genBrain(document.createElement('button')),150);},'🧠');
  A('Generate ESG report','audit-ready sustainability summary',()=>{go('sustainability');setTimeout(()=>genESGReport(document.createElement('button')),150);},'♻');
  A('Ghost simulation','pre-gate crowd flow test',()=>{go('twin');setTimeout(()=>ghostSim(document.createElement('button')),150);},'👻');
  A('Ask the assistant','open the AI drawer',()=>openAssistant(),'✦');
  return idx;
}
let SRES=[], SSEL=0;
function runSearch(q){
  const drop=document.getElementById('searchDrop');
  q=q.trim().toLowerCase();
  if(!q){drop.hidden=true;return;}
  const words=q.split(/\s+/);
  SRES=searchIndex().map(item=>{
    const hay=(item.label+' '+item.sub+' '+item.type).toLowerCase();
    let score=0;
    for(const w of words){ if(!hay.includes(w)){score=-1;break;} score+=item.label.toLowerCase().startsWith(w)?3:item.label.toLowerCase().includes(w)?2:1; }
    return {...item,score};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,9);
  SRES.push({type:'AI',label:`Ask AI: “${q}”`,sub:'send to the stadium assistant',ic:'✦',run:()=>{openAssistant();setTimeout(()=>{const f=document.getElementById('assistantField');f.value=q;askAssistant(new Event('submit'));},120);}});
  SSEL=0; renderSearch();
  drop.hidden=false;
}
function renderSearch(){
  const drop=document.getElementById('searchDrop');
  let lastType='';
  drop.innerHTML=SRES.map((r,i)=>{
    const head=r.type!==lastType?`<div class="sd-group">${r.type}</div>`:'';
    lastType=r.type;
    return `${head}<button class="sd-item ${i===SSEL?'sel':''}" onmousedown="event.preventDefault();pickSearch(${i})" onmousemove="SSEL=${i};renderSearch()">
      <span class="sd-ic">${r.ic}</span><span class="sd-body"><b>${r.label}</b><span>${r.sub}</span></span>
      ${i===SSEL?'<span class="sd-enter">↵</span>':''}</button>`;
  }).join('');
}
function pickSearch(i){
  const r=SRES[i]; if(!r) return;
  document.getElementById('searchDrop').hidden=true;
  const f=document.getElementById('globalSearch'); f.value=''; f.blur();
  r.run();
  toast('⌕ '+r.label,r.sub);
}
(function initSearch(){
  const f=document.getElementById('globalSearch'), drop=document.getElementById('searchDrop');
  if(!f) return;
  f.addEventListener('input',()=>runSearch(f.value));
  f.addEventListener('focus',()=>{ if(f.value.trim()) runSearch(f.value); });
  f.addEventListener('keydown',e=>{
    if(drop.hidden) return;
    if(e.key==='ArrowDown'){e.preventDefault();SSEL=Math.min(SRES.length-1,SSEL+1);renderSearch();}
    else if(e.key==='ArrowUp'){e.preventDefault();SSEL=Math.max(0,SSEL-1);renderSearch();}
    else if(e.key==='Enter'){e.preventDefault();pickSearch(SSEL);}
    else if(e.key==='Escape'){drop.hidden=true;f.blur();}
  });
  document.addEventListener('click',e=>{ if(!e.target.closest('#searchWrap')) drop.hidden=true; });
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();f.focus();f.select();}
  });
})();

/* ───── Router ───── */
function go(name){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  views.innerHTML = `<div class="view active">${VIEWS[name]()}</div>`;
  countUp();
  document.body.classList.remove('nav-open');   // mobile: close the drawer after navigating
  if(name==='emergency') paintHazard();
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
  else if(id==='sus-detail'){ genSusDetail(btn.closest('.qrow').querySelector('.qtitle').textContent,btn); }
  else toast('Alert opened','Detail panel');
}
function approveRec(btn){
  btn.textContent='✓ Approved'; btn.disabled=true; btn.style.opacity=.6;
  S.sections[4].density=72;
  toast('Recommendation approved','6 stewards reallocated → Section 105 · logged with your identity');
  pushActivity('✓','chip-lime','Steward reallocation approved','Section 105 · by Udit');
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
  $('#assistantLog').innerHTML='';
  $('#assistantLog').appendChild(buildHero());
}
function heroAsk(prompt){
  $('#assistantField').value=prompt;
  askAssistant(new Event('submit'));
}
function buildHero(){
  const d=document.createElement('div');
  d.className='chat-hero'; d.id='chatHero';
  d.innerHTML=`
    <div class="hero-title">Ask<br>Anything</div>
    <div class="hero-cards">
      <button class="hero-card" onclick="heroAsk('Give me a full stadium status briefing right now')">
        <div class="hero-card-ic">${ico('spark',18)}</div>
        <div class="hero-card-row">Stadium<br>Briefing <span>→</span></div>
      </button>
      <button class="hero-card" onclick="heroAsk('What are the biggest crowd risks in the next 30 minutes and what should we do?')">
        <div class="hero-card-ic">${ico('compass',18)}</div>
        <div class="hero-card-row">Crowd<br>Advisor <span>→</span></div>
      </button>
    </div>
    <div class="hero-recent-head"><b>Recent Activities</b><button onclick="go('aicenter');closeAssistant()">See All</button></div>
    <button class="recent-row" onclick="heroAsk('Where is the nearest available medical unit to Section 114?')">
      <span class="recent-ic">${ico('alert',15)}</span>
      <span class="recent-t"><b>Medical lookup</b><span>Nearest unit to Section 114</span></span><span>›</span>
    </button>
    <button class="recent-row" onclick="heroAsk('What is the weather risk for egress tonight?')">
      <span class="recent-ic">${ico('globe',15)}</span>
      <span class="recent-t"><b>Weather risk</b><span>Egress conditions tonight</span></span><span>›</span>
    </button>
    <button class="recent-row" onclick="heroAsk('Draft an evacuation plan for Section 105')">
      <span class="recent-ic">${ico('door',15)}</span>
      <span class="recent-t"><b>Evacuation draft</b><span>Section 105 · needs human sign-off</span></span><span>›</span>
    </button>
    <button class="recent-row" onclick="heroAsk('Which gates should we open or close in the next 30 minutes?')">
      <span class="recent-ic">${ico('ticket',15)}</span>
      <span class="recent-t"><b>Gate advisor</b><span>Open / close / re-staff</span></span><span>›</span>
    </button>`;
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
  row.innerHTML=`<div class="msg-avatar ${role==='user'?'user-av':'ai-av'}">${role==='user'?'U':ico('spark',13)}</div>
    <div class="msg ${role==='user'?'msg-user':'msg-ai'}">${html}</div>`;
  log.appendChild(row); log.scrollTop=log.scrollHeight;
  return row.querySelector('.msg');
}
function quickAsk(btn){ $('#assistantField').value=btn.textContent.replace(/^\S+\s/,''); askAssistant(new Event('submit')); }
/* Claude/ChatGPT-style typewriter: network chunks land in bursts, so we
   buffer the target text and reveal it smoothly at ~character level with a
   blinking caret, easing faster when the buffer runs long. */
function smoothTyper(el,log){
  /* setTimeout, not rAF — rAF freezes in hidden tabs and the reply would
     hang on the typing dots until the tab is refocused */
  let target='', shown=0, timer=null, done=false;
  const render=()=>{
    const behind=target.length-shown;
    shown=Math.min(target.length, shown+Math.max(1,Math.ceil(behind/24)));
    el.innerHTML=md(target.slice(0,shown))+(shown<target.length||!done?'<span class="caret"></span>':'');
    log.scrollTop=log.scrollHeight;
    timer=shown<target.length?setTimeout(render,16):null;
  };
  return {
    push(text){ target=text; if(!timer) render(); },
    finish(full){ return new Promise(res=>{
      target=full??target; done=true;
      const t0=Date.now();
      const wait=()=>{
        if(shown>=target.length||Date.now()-t0>1500){   // grace period, then snap to full text
          if(timer)clearTimeout(timer); timer=null;
          el.innerHTML=md(target); log.scrollTop=log.scrollHeight; res();
        } else setTimeout(wait,40);
      };
      if(!timer&&shown<target.length) render();
      wait();
    });},
  };
}
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
    const typer=smoothTyper(el,log);
    if(grounding){
      full=await AI.call('assistant',`${history?history+'\n':''}user: ${q}`,{system,grounded:true});
      typer.push(full);            // grounded calls aren't streamed — type them out anyway
    }else{
      full=await AI.stream('assistant',`${history?history+'\n':''}user: ${q}`,
        { system, onChunk:(_,ft)=>typer.push(ft) });
    }
    await typer.finish(full);
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
    // Persist the transport/egress advice → ai_reports (live).
    window.Firestore?.save('report',{ title:'Transport egress advice', summary:txt, generatedBy:AI.activeModel });
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
    $('#sustainQueue').innerHTML=items.map(i=>qrow(i.icon,'rgba(198,241,53,.1)',i.title,i.impact,'pill-teal','AI · New','sus-detail')).join('');
    toast('Optimizations generated','2 new actions from live telemetry — gemini-2.5-flash');
    // Persist the sustainability insight → sustainability singleton (live).
    const top=items[0];
    if(top) window.Firestore?.save('sustainability',{ energyUsage:S.powerMW, waterUsage:S.waterM3,
      wasteCollected:78, carbonEmission:41, aiSuggestion:`${top.title} — ${top.impact}` });
  }catch(e){ toast('Fallback active','Optimization generation unavailable','warn'); }
  busy(btn,false);
}

/* ───── Security: stateful threat alerts ───── */
const THREATS=[
  {id:'t1',ic:'alert',bg:'rgba(232,67,59,.14)',title:'Density surge — Section 105',meta:'ETA to threshold: 8 min · confidence 91%',sev:'pill-pending',status:'Act now',active:true},
  {id:'t2',ic:'pin',bg:'rgba(240,166,59,.14)',title:'Unattended bag — Gate D',meta:'CCTV-flagged · steward en route',sev:'pill-warn',status:'Dispatched',active:true},
  {id:'t3',ic:'compass',bg:'rgba(45,217,196,.12)',title:'Ramp C flow anomaly',meta:'Counter-flow detected, minor',sev:'pill-teal',status:'Monitor',active:true},
];
function threatRow(t){
  return `<div class="qrow" id="row-${t.id}"><div class="qthumb" style="background:${t.bg}">${ico(t.ic,18)}</div>
  <div class="qbody"><div class="qtitle">${t.title}</div><div class="qmeta">${t.meta}</div></div>
  <span class="pill ${t.sev}" style="padding:5px 12px;font-size:10.5px" id="st-${t.id}">${t.status}</span>
  ${t.status==='Act now'?`<button class="btn btn-red" style="padding:7px 14px;font-size:11px" onclick="actNow('${t.id}',this)">Act now</button>`:''}
  <button class="btn btn-ghost" onclick="reviewThreat('${t.id}',this)">Review</button></div>
  <div id="detail-${t.id}"></div>`;
}
async function actNow(id,btn){
  const t=THREATS.find(x=>x.id===id);
  busy(btn,true);
  try{
    const txt=await AI.call('crowd_prediction',
      `IMMEDIATE ACTION ORDER needed for: "${t.title}" (${t.meta}). Give the security lead exactly 3 numbered actions to execute in the next 5 minutes — who moves where, what gets closed/opened, what to broadcast. Terse command style.`,
      { system: stadiumContext(), temperature: 0.4 });
    const st=document.getElementById(`st-${id}`);
    st.textContent='Responding'; st.className='pill pill-warn';
    btn.textContent='✓ Executing'; btn.disabled=true; btn.style.opacity=.6;
    document.getElementById(`detail-${id}`).innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin:6px 0 10px;background:rgba(232,67,59,.06);border:1px solid rgba(232,67,59,.3);border-radius:12px">
      <b style="color:#ff8b85">${ico('alert',12)} Action order — executing</b><br>${md(txt)}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-lime" onclick="resolveThreat('${id}',this)">✓ Mark resolved</button>
        <button class="btn btn-ghost" onclick="editPlan('detail-${id}',this)">✎ Modify</button>
      </div></div>`;
    toast('Action order issued',`${t.title} · units moving now`,'crit');
    pushActivity('🛡','chip-red','Action order executed',`${t.title} · by Udit`);
  }catch(e){ toast('Fallback active','Standard response protocol dispatched instead','warn'); }
  busy(btn,false);
}
async function reviewThreat(id,btn){
  const t=THREATS.find(x=>x.id===id);
  busy(btn,true);
  try{
    const txt=await AI.call('incident_summary',
      `Threat assessment for the security lead: "${t.title}" (${t.meta}). Give: current risk level (LOW/MED/HIGH), what happens if we do nothing for 10 minutes, and the recommended posture. 3 short lines.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById(`detail-${id}`).innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin:6px 0 10px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.25);border-radius:12px">
      <b style="color:var(--accent-teal)">AI assessment</b><br>${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Assessment unavailable — camera feed still live','warn'); }
  busy(btn,false);
}
function resolveThreat(id,btn){
  const t=THREATS.find(x=>x.id===id);
  t.status='Resolved'; t.sev='pill-ok';
  const st=document.getElementById(`st-${id}`);
  st.textContent='Resolved'; st.className='pill pill-ok';
  document.getElementById(`detail-${id}`).innerHTML='';
  if(id==='t1'){ S.sections[4].density=68; }   // resolving the surge cools the section on the heatmap
  toast('Threat resolved',`${t.title} · logged as prevented incident`);
  pushActivity('✓','chip-lime','Threat resolved',`${t.title} · prevented, not reacted to`);
}
async function genThreatBrief(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('incident_summary',
      `Write a 3-sentence security shift briefing covering all active threats: ${THREATS.map(t=>`${t.title} (${t.status})`).join('; ')}. Prioritize, then one watch-item for the next 30 minutes.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('threatBrief').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.25);border-radius:12px"><b style="color:var(--accent-lime)">Shift briefing — ${now()}</b><br>${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Briefing unavailable','warn'); }
  busy(btn,false);
}

/* ───── International visitor safety ───── */
async function genSafetyBroadcast(btn){
  const src=$('#safetyIn').value.trim(); if(!src) return toast('Type the instruction first','','warn');
  busy(btn,true);
  try{
    const raw=await AI.call('translation',
      `Safety instruction for stadium fans: "${src}". Render it calm, clear and short in English, Spanish, French, Arabic and Portuguese. Output ONLY JSON: {"en":"...","es":"...","fr":"...","ar":"...","pt":"..."}`,
      { temperature: 0.2 });
    const t=extractJSON(raw);
    $('#safetyOut').innerHTML=[['EN',t.en],['ES',t.es],['FR',t.fr],['AR',t.ar],['PT',t.pt]]
      .map(([l,v])=>`<div style="padding:8px 0;border-bottom:1px solid var(--border-hairline)"><span class="pill pill-dim" style="padding:2px 9px;font-size:9px;margin-right:8px">${l}</span><span style="font-size:12.5px">${v}</span></div>`).join('')+
      `<button class="btn btn-red" style="margin-top:12px" onclick="this.textContent='✓ Sent — signed: Udit';this.disabled=true;toast('Broadcast sent to 82,450 fan apps','Each fan received it in their own language','crit');pushActivity('📣','chip-red','Safety broadcast sent','5 languages · signed by Udit')">Send to all fan apps — requires sign-off</button>`;
  }catch(e){ toast('Fallback active','Translation service busy','warn'); }
  busy(btn,false);
}
const FOUND_REPORTS=[
  'Steward S-4 (Gate C, 5 min ago): child ~7-9yo, red football jersey, waiting at Guest Services C',
  'Steward S-9 (Sec 118, 12 min ago): elderly man, blue jacket, asking for directions in French',
  'Guest Services B (20 min ago): teenage girl, white hijab, green scarf, waiting with staff',
];
async function genLostMatch(btn){
  const q=$('#lostIn').value.trim(); if(!q) return toast('Describe the person first','','warn');
  busy(btn,true);
  try{
    const raw=await AI.call('lost_found',
      `Missing person report: "${q}". Found/sighting reports on file:\n${FOUND_REPORTS.map((r,i)=>`${i+1}. ${r}`).join('\n')}\nOutput ONLY JSON: {"match":<report number or 0>,"confidence":<0-100>,"reason":"...","action":"one-line instruction for the reporter"}`,
      { temperature: 0.2 });
    const m=extractJSON(raw);
    $('#lostOut').innerHTML=m.match>0
      ?`<div class="act-sub" style="line-height:1.7;padding:12px 14px;background:rgba(198,241,53,.06);border:1px solid rgba(198,241,53,.3);border-radius:12px">
        <b style="color:var(--accent-lime)">Probable match — ${m.confidence}% confidence</b><br>${FOUND_REPORTS[m.match-1]}<br><i style="color:var(--text-secondary)">${m.reason}</i><br><b style="color:var(--text-primary)">→ ${m.action}</b></div>`
      :`<div class="act-sub" style="padding:12px 14px;background:rgba(240,166,59,.07);border:1px solid rgba(240,166,59,.3);border-radius:12px">No match yet — description pushed to all 184 volunteers' devices. ${m.action||''}</div>`;
    pushActivity('🔎','chip-teal','Lost-person search',`AI matched against ${FOUND_REPORTS.length} live reports`);
  }catch(e){ toast('Fallback active','Description relayed to stewards by radio','warn'); }
  busy(btn,false);
}

/* ───── Sustainability: functional queue + reports ───── */
async function genSusDetail(title,btn){
  busy(btn,true);
  try{
    const txt=await AI.call('energy_opt',
      `Explain this stadium sustainability action for the ops lead: "${title}". Give: how it works (1 line), quantified saving, any comfort/safety trade-off, and go/no-go recommendation. 4 short lines.`,
      { system: stadiumContext(), temperature: 0.4 });
    const div=document.createElement('div');
    div.innerHTML=`<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin:6px 0 10px;background:rgba(45,217,196,.05);border:1px solid rgba(45,217,196,.25);border-radius:12px">
      ${md(txt)}<div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-lime" onclick="applySus('${title.replace(/'/g,'')}',this)">✓ Apply</button>
      <button class="btn btn-ghost" onclick="this.closest('div').parentElement.parentElement.remove()">Dismiss</button></div></div>`;
    btn.closest('.qrow').after(div.firstElementChild);
  }catch(e){ toast('Fallback active','Detail unavailable','warn'); }
  busy(btn,false);
}
function applySus(title,btn){
  S.powerMW=Math.max(30,+(S.powerMW-0.6).toFixed(1));
  btn.textContent='✓ Applied'; btn.disabled=true; btn.style.opacity=.6;
  toast('Optimization applied',`${title} · power draw now ${S.powerMW} MW`);
  pushActivity('♻','chip-lime','Optimization applied',`${title} · by Udit`);
}
async function genESGReport(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('exec_summary',
      `Write tonight's ESG report for FIFA sustainability officers: energy ${S.powerMW} MW (−6% vs baseline), water ${S.waterM3} m³ (−11%), waste diversion 78% (target 75%), carbon 41 t CO2e (−14%). 4-5 sentences: status vs targets, the single biggest saving driver, one risk, one next action. Plain text.`,
      { system: stadiumContext(), temperature: 0.5 });
    $('#esgOut').innerHTML=`<div class="card" style="margin-bottom:18px;border-color:rgba(198,241,53,.25)">
      <div class="section-row" style="margin:0 0 8px"><div class="section-title">✦ ESG Report — ${now()}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="padding:5px 12px;font-size:10.5px" onclick="navigator.clipboard.writeText(this.closest('.card').innerText);this.textContent='✓ Copied'">⧉ Copy</button>
        <span class="pill pill-ok"><span class="dot dot-lime"></span>audit-ready</span></div></div>
      <div class="act-sub" style="line-height:1.75;font-size:13px">${md(txt)}</div></div>`;
  }catch(e){ toast('Fallback active','Report generation busy','warn'); }
  busy(btn,false);
}
async function genChartExplain(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('energy_opt',
      `The matchday energy chart shows actual draw peaking at 52 MW around kickoff vs the AI-optimized schedule peaking at 46 MW, converging near 36-38 MW late. Explain to a non-engineer in 2-3 sentences what the optimization did and what it saved.`,
      { temperature: 0.5 });
    $('#chartExplain').innerHTML=`<div class="act-sub" style="line-height:1.7;margin-top:10px;padding:12px 14px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.25);border-radius:12px">${md(txt)}</div>`;
  }catch(e){ toast('Fallback active','Explanation unavailable','warn'); }
  busy(btn,false);
}

/* ───── Acoustic Sentinel (feature 11) ───── */
const AUDIO_ZONES=[
  {id:'a1',name:'Section 105',alert:true,label:''},
  {id:'a2',name:'Concourse B',alert:false,label:'chanting · nominal'},
  {id:'a3',name:'Gate D',alert:false,label:'crowd murmur'},
  {id:'a4',name:'North plaza',alert:false,label:'quiet'},
];
async function classifyAudio(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('audio_sentinel',
      `Acoustic array Section 105 detected: chant volume dropped 60% in 8 seconds, followed by scattered high-pitch vocal bursts and rising shuffle noise. Cameras show nothing unusual yet. Classify the signal (panic precursor / celebration / false positive), state confidence, and give the ONE immediate action. 3 short lines.`,
      { system: stadiumContext(), temperature: 0.3 });
    document.getElementById('audioOut').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(232,67,59,.06);border:1px solid rgba(232,67,59,.3);border-radius:12px">
      <b style="color:#ff8b85">${ico('mic',12)} Signal classified — audio led video by ~6s</b><br>${md(txt)}
      <div style="margin-top:10px"><button class="btn btn-red" onclick="actNow('t1',this)">Act now on Section 105</button></div></div>`;
    pushActivity('🎙','chip-red','Acoustic anomaly classified','Section 105 · audio preceded video by ~6s');
  }catch(e){ toast('Fallback active','Signal flagged for manual review','warn'); }
  busy(btn,false);
}

/* ───── Resource Conflict Negotiator (feature 12) ───── */
async function negotiate(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('negotiator',
      `Resource conflict: only 3 stewards available. Request A: Section 104, density 76% rising, halftime surge in 12 min, 3850 occupants. Request B: Gate D, unattended-bag cordon, crowd building at cordon edge, security unit S-2 already on scene. Compute risk scores (0-100) for each, decide the allocation (may split), and justify in 2 lines. Output ONLY JSON: {"scoreA":n,"scoreB":n,"allocation":"...","rationale":"..."}`,
      { system: stadiumContext(), temperature: 0.3 });
    const d=extractJSON(raw);
    document.getElementById('negOut').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <div style="display:flex;gap:14px;margin-bottom:8px">
        <span class="pill ${d.scoreA>=d.scoreB?'pill-pending':'pill-dim'}" style="padding:4px 12px;font-size:10px">Sec 104 risk: ${d.scoreA}</span>
        <span class="pill ${d.scoreB>d.scoreA?'pill-pending':'pill-dim'}" style="padding:4px 12px;font-size:10px">Gate D risk: ${d.scoreB}</span></div>
      <b style="color:var(--accent-lime)">Proposed:</b> ${d.allocation}<br><i style="color:var(--text-secondary)">${d.rationale}</i>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-lime" onclick="this.textContent='✓ Approved — stewards moving';this.disabled=true;toast('Allocation approved','Signed: Udit · logged','crit');pushActivity('⚖','chip-lime','Resource conflict resolved','AI-negotiated, human-approved')">✓ Approve</button>
        <button class="btn btn-ghost" onclick="rejectPlan('negOut',this,'Allocation')">✕ Override</button></div></div>`;
  }catch(e){ toast('Fallback active','Escalated to ops lead for manual allocation','warn'); }
  busy(btn,false);
}

/* ───── Digital Twin Ghosts — pre-gate flow simulation (feature 13) ───── */
async function ghostSim(btn){
  busy(btn,true);
  toast('Ghost simulation running','Simulating 82,450 ticketed fans arriving — doors have not opened');
  // animate simulated arrival waves across the bowl
  const waves=[[0,1,2],[3,4,5,11],[6,7,10],[8,9],[12,13,14,15],[16,17,18,19],[20,21,22,23]];
  waves.forEach((secs,i)=>setTimeout(()=>{
    secs.forEach(s=>{
      const p=document.querySelector(`.sec[data-idx="${s}"]`);
      if(p){ p.setAttribute('fill','#C6F135'); p.setAttribute('fill-opacity','0.5'); }
    });
  },i*600));
  setTimeout(()=>document.querySelectorAll('.sec').forEach(p=>{
    p.setAttribute('fill',heatColor(S.sections[+p.dataset.idx].density));
    p.setAttribute('fill-opacity','0.85');
  }),waves.length*600+1200);
  try{
    const txt=await AI.call('flow_sim',
      `Pre-gate fan-flow simulation for tonight: 82,450 tickets sold, 61% arriving via rail (surges 18:40 and 19:15), Gate C has a known turnstile fault, Lot F fills by 19:00 historically. Predict the top 2 bottlenecks with time and location, and the pre-emptive fix for each. 4 short lines. This is a simulation run hours BEFORE doors open.`,
      { system: stadiumContext(), temperature: 0.5 });
    document.getElementById('ghostOut').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:12px;background:rgba(198,241,53,.05);border:1px solid rgba(198,241,53,.3);border-radius:12px">
      <b style="color:var(--accent-lime)">Ghost run complete — bottlenecks caught on paper, not in person</b><br>${md(txt)}</div>`;
    pushActivity('👻','chip-lime','Ghost simulation complete','2 bottlenecks predicted pre-gates · fixes queued');
  }catch(e){ toast('Fallback active','Simulation queued for re-run','warn'); }
  busy(btn,false);
}

/* ───── Cross-stadium learning + trust loop (features 14, 16) ───── */
async function genCrossLearn(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('cross_stadium',
      `Tournament-wide learning sync: Hard Rock Miami just logged a rideshare-zone crush during a rain delay (similar east-plaza layout to MetLife). State in 2 lines: what pattern transfers to MetLife tonight (rain 64% post-match) and what threshold or staffing changes automatically.`,
      { system: stadiumContext(), temperature: 0.4 });
    document.getElementById('crossOut').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(45,217,196,.06);border:1px solid rgba(45,217,196,.3);border-radius:12px">
      <b style="color:var(--accent-teal)">New transfer — Hard Rock Miami → MetLife</b><br>${md(txt)}</div>`;
    pushActivity('⇄','chip-teal','Cross-stadium model sync','Miami rain-crush pattern applied to tonight');
  }catch(e){ toast('Fallback active','Sync deferred to next cycle','warn'); }
  busy(btn,false);
}
async function genTrustLoop(btn){
  busy(btn,true);
  try{
    const txt=await AI.call('trust_loop',
      `Alert-fatigue recalibration: "Ramp flow anomaly" was dismissed 14/16 times this shift; "queue-length warning" dismissed 8/19; "density surge" dismissed 0/4. Explain in 3 short lines what thresholds you are adjusting and why over-alerting is more dangerous than under-alerting, ending with the new alert-precision estimate.`,
      { temperature: 0.4 });
    document.getElementById('trustOut').innerHTML=
      `<div class="act-sub" style="line-height:1.7;padding:12px 14px;margin-top:10px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px">
      <b style="color:var(--accent-amber)">Recalibrated — the AI just tuned itself</b><br>${md(txt)}</div>`;
    pushActivity('🎯','chip-amber','Alert thresholds self-adjusted','Based on 39 human override decisions');
  }catch(e){ toast('Fallback active','Thresholds unchanged this cycle','warn'); }
  busy(btn,false);
}

/* ── Universal plan controls: approve / edit / reject on any AI output ── */
function approvePlan(id,btn,label){
  const el=document.getElementById(id);
  if(el?.isContentEditable){ el.contentEditable=false; el.style.cssText+='border:none;padding:0;background:none'; }
  btn.textContent='✓ Approved'; btn.disabled=true; btn.style.opacity=.6;
  toast(`${label} approved`,'Signed: Udit · logged to audit trail','crit');
  pushActivity('✓','chip-lime',`${label} approved`,'Signed by Udit · audit-logged');
}
function editPlan(id,btn){
  const el=document.getElementById(id); if(!el) return;
  if(el.isContentEditable){
    el.contentEditable=false;
    el.style.cssText=el.dataset.css||'';
    btn.textContent=btn.dataset.l||'✎ Edit plan';
    toast('Edits saved','Human revision recorded · marked as human-edited');
    pushActivity('✎','chip-amber','Plan edited by human','AI draft revised by Udit');
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
    if(p.closest('#replayBox')||p.closest('#hazMap')) return;   // replay + hazard map own their SVGs
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
  if(document.getElementById('sitTimeline')) sitPush(ev[0],ev[2]+' — '+ev[3],'signal');
  const b=$('#notifBadge'); b.textContent=Math.min(99,+b.textContent+1);
},12000);

/* ───── Fan Experience Score · Food Waste Predictor · Knowledge Graph ─────
   All three follow the platform loop: Gemini → Firestore (backend write) →
   snapshot listener → every connected dashboard repaints live. */

const FX_DEFAULT={overallScore:94,navigation:98,foodWait:91,accessibility:100,transport:88,safety:99,
  aiExplanation:'Transport is the drag: Lot F saturation adds 9 min to car egress. Fix: push staggered-exit notifications at minute 80.'};

function fxBar(label,v){
  const c=v>=95?'var(--accent-lime)':v>=85?'var(--accent-teal)':'var(--accent-amber)';
  return `<div style="flex:1;min-width:110px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px">
    <span style="color:var(--text-secondary)">${label}</span><b>${Math.round(v)}%</b></div>
    <div style="height:5px;border-radius:3px;background:var(--border-hairline)"><div style="height:5px;border-radius:3px;width:${v}%;background:${c}"></div></div></div>`;
}
function fxCardBody(d){
  d=d||FX_DEFAULT;
  const face=d.overallScore>=90?'😊':d.overallScore>=75?'🙂':'😟';
  return `<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
    <div style="text-align:center;min-width:120px"><div style="font-size:34px">${face}</div>
      <div style="font-size:30px;font-weight:700;color:var(--accent-lime)">${Math.round(d.overallScore)}%</div>
      <div class="qmeta">overall experience</div></div>
    <div style="flex:1;display:flex;gap:16px;flex-wrap:wrap;min-width:260px">
      ${fxBar('Navigation',d.navigation)}${fxBar('Food wait',d.foodWait)}${fxBar('Accessibility',d.accessibility)}
      ${fxBar('Transport',d.transport)}${fxBar('Safety',d.safety)}</div>
    </div>
  <div class="act-sub" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border-hairline);line-height:1.6"><b style="color:var(--accent-lime)">✦ Why:</b> ${d.aiExplanation}</div>`;
}
async function genFX(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('exec_summary',
      `Score the live fan experience from stadium state. Output ONLY JSON: {"overallScore":0-100,"navigation":0-100,"foodWait":0-100,"accessibility":0-100,"transport":0-100,"safety":0-100,"aiExplanation":"1-2 sentences: which category drags the score down, why (with a number), and the single best fix"}`,
      { system: stadiumContext(), temperature: 0.5 });
    const d=extractJSON(raw);
    const el=document.getElementById('fxCard'); if(el) el.innerHTML=fxCardBody(d);
    window.Firestore?.save('experience',d);
    toast('Experience score recomputed','Saved to fan_experience — live on every client');
    pushActivity('😊','chip-lime','Fan experience scored',`${Math.round(d.overallScore)}% overall — AI explained the drag`);
  }catch(e){ toast('Fallback active','Showing last computed score','warn'); }
  busy(btn,false);
}

function wasteRow(w,i){
  const conf=Math.round((w.confidence||0)*100);
  return `<tr><td style="font-weight:600">${w.outlet}</td><td>${w.item}</td>
    <td class="mono" style="color:var(--accent-amber)">${w.predictedUnsold} units</td>
    <td class="mono">${conf}%</td><td class="act-sub" style="line-height:1.5">${w.recommendation}</td>
    <td>${w.status==='actioned'?'<span class="pill pill-ok" style="padding:4px 10px;font-size:9.5px">✓ Actioned</span>'
      :`<button class="btn btn-lime" style="padding:5px 12px;font-size:10.5px" onclick="actionWaste('${w.id||''}',this)">Transfer</button>`}</td></tr>`;
}
function wasteTable(list){
  if(!list||!list.length) return `<div class="act-sub" style="padding:10px 0">No predictions yet — run the predictor to forecast unsold inventory before halftime.</div>`;
  return `<table class="table"><tr><th>Outlet</th><th>Item</th><th>Predicted unsold</th><th>Confidence</th><th>Recommendation</th><th></th></tr>
    ${list.slice(0,6).map(wasteRow).join('')}</table>`;
}
async function predictWaste(btn){
  busy(btn,true);
  try{
    const raw=await AI.call('energy_opt',
      `Food-waste prediction, 20 minutes before halftime. Forecast unsold inventory for 3 outlets. Output ONLY a JSON array: [{"outlet":"Food Court A-F","item":"specific item","predictedUnsold":number,"confidence":0-1,"recommendation":"transfer/discount action naming a destination outlet"}] Base volumes on attendance and crowd distribution.`,
      { system: stadiumContext(), temperature: 0.7 });
    const items=extractJSON(raw).map(w=>({...w,status:'pending'}));
    document.getElementById('wasteOut').innerHTML=wasteTable(items);
    for(const w of items) window.Firestore?.save('foodwaste',w);
    toast('Waste forecast ready',`${items.length} outlets flagged — transfers recommended before waste exists`);
    pushActivity('🍔','chip-amber','Food waste predicted',items.map(w=>`${w.outlet}: ${w.predictedUnsold} ${w.item}`).join(' · '));
  }catch(e){ toast('Fallback active','Predictor unavailable — try again','warn'); }
  busy(btn,false);
}
async function actionWaste(id,btn){
  btn.textContent='✓ Actioned'; btn.className='pill pill-ok'; btn.style.cssText='padding:4px 10px;font-size:9.5px;border:0';
  if(id) try{ await window.Firestore?.service.updateDocument('food_waste',id,{status:'actioned'}); }catch(_){ }
  toast('Transfer dispatched','Inventory move logged — waste prevented');
}

const KG_DOMAIN_IC={weather:'🌦',crowd:'◍',transport:'🚇',food:'🍔',waste:'♻',operations:'⚡',energy:'⚡',security:'🛡',medical:'✚'};
async function askGraph(btn){
  const q=document.getElementById('kgIn').value.trim();
  if(!q) return toast('Ask a question first','e.g. "Rain at minute 70 — impact on waste?"','warn');
  busy(btn,true);
  const out=document.getElementById('kgOut');
  out.innerHTML='<div style="margin-top:14px"><span class="typing"><i></i><i></i><i></i></span></div>';
  try{
    const raw=await AI.call('brain',
      `You are the Tournament Knowledge Graph — you reason ACROSS domains (weather, crowd, transport, food, waste, energy, security, medical), never inside one silo. Question: "${q}"
Output ONLY JSON: {"chain":[{"domain":"weather|crowd|transport|food|waste|operations|energy|security|medical","node":"3-5 word state","effect":"one short clause: what it causes next"}] (4-6 causal steps in order),
"answer":"2-3 sentences: the cross-domain answer with numbers",
"action":"the ONE operational move that breaks the bad chain or exploits the good one"}`,
      { system: stadiumContext(), temperature: 0.5 });
    const d=extractJSON(raw);
    out.innerHTML=`<div style="margin-top:18px">
      <div class="cascade">${d.chain.map(s=>`<span class="cas-step" title="${s.effect}">${KG_DOMAIN_IC[s.domain]||'✦'} ${s.node}</span>`).join('<span class="cas-arrow">→</span>')}</div>
      <div class="act-sub" style="margin-top:14px;line-height:1.7">${md(d.answer)}</div>
      <div class="card" style="margin-top:12px;padding:14px;background:rgba(198,241,53,.05);border-color:rgba(198,241,53,.25)">
        <b style="color:var(--accent-lime);font-size:12px">✦ Break the chain:</b> <span class="act-sub">${d.action}</span></div></div>`;
    window.Firestore?.save('report',{ title:`Knowledge Graph: ${q.slice(0,60)}`,
      summary:`${d.chain.map(s=>s.node).join(' → ')} — ${d.answer} Action: ${d.action}`, generatedBy:AI.activeModel });
    pushActivity('🕸','chip-lime','Cross-domain reasoning',`"${q.slice(0,50)}" · ${d.chain.length}-step causal chain`);
  }catch(e){
    out.innerHTML='<div class="act-sub" style="margin-top:14px;padding:12px 14px;background:rgba(240,166,59,.06);border:1px solid rgba(240,166,59,.3);border-radius:12px">Graph reasoning busy — try again in a moment.</div>';
  }
  busy(btn,false);
}

/* Live repaint: when Firestore streams changes, refresh these surfaces in place. */
document.addEventListener('firestore:update',(e)=>{
  const {collection,data}=e.detail||{};
  if(collection==='fan_experience'&&data?.length){ const el=document.getElementById('fxCard'); if(el) el.innerHTML=fxCardBody(data[0]); }
  if(collection==='food_waste'){ const el=document.getElementById('wasteOut'); if(el&&data?.length) el.innerHTML=wasteTable(data); }
});

/* KPI drill-down: the ↗ arrow on every KPI card jumps to the view that owns the metric. */
const KPI_TARGETS=[
  [/attendance|gates|density|sentiment/i,'security'],
  [/power|energy|water|waste|carbon/i,'sustainability'],
  [/medical/i,'emergency'],
  [/transit|parking|shuttle|road|congestion/i,'transport'],
  [/feature|latency|fallback|token/i,'aicenter'],
];
document.addEventListener('click',(e)=>{
  const arrow=e.target.closest('.kpi-arrow'); if(!arrow) return;
  const label=arrow.closest('.kpi')?.querySelector('.kpi-label')?.textContent||'';
  const view=(KPI_TARGETS.find(([re])=>re.test(label))||[])[1];
  const current=document.querySelector('.nav-item.active')?.dataset.view;
  if(view&&view!==current){ go(view); toast('Drill-down',`${label.trim()} → ${view} view`); }
});

/* Liquid-glass nav: track the pointer per item so the specular sheen follows it. */
document.getElementById('nav').addEventListener('pointermove',(e)=>{
  const item=e.target.closest('.nav-item'); if(!item) return;
  const r=item.getBoundingClientRect();
  item.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
  item.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
});

/* boot */
go('dashboard');
$('#assistantLog').appendChild(buildHero());
$('#clock').textContent=now();
