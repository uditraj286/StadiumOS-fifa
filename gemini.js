/* ═══ StadiumOS AI — AI Orchestration Service (§13/§14) ═══
   Every call: rate-limited, latency-logged to ai_events, structured where
   possible, and wrapped in a deterministic fallback — a Gemini outage can
   degrade a feature, never crash a surface. */
const AI = {
  cfg: window.STADIUM_CONFIG,
  events: [],          // in-memory ai_events table (feature, latency, tokens, fallback)
  inflight: 0,
  MAX_CONCURRENT: 3,   // client-side rate limit
  activeModel: window.STADIUM_CONFIG.model,   // current healthy model (failover-aware)
  cooldown: {},        // model → timestamp until which it's considered exhausted

  isLive(feature){ return !!this.cfg.features[feature]?.live; },

  /* Walk the failover chain, skipping models in cooldown. */
  candidates(){
    const t=Date.now();
    const c=(this.cfg.modelChain||[this.cfg.model]).filter(m=>!(this.cooldown[m]>t));
    if(!c.length) return [this.cfg.modelChain[0]];
    // stick with the last model that worked — avoids re-paying failover latency every call
    return c.includes(this.activeModel)?[this.activeModel,...c.filter(m=>m!==this.activeModel)]:c;
  },
  benchModel(m){ this.cooldown[m]=Date.now()+5*60*1000; },  // rest an exhausted model 5 min

  log(feature, latency, tokens, fallback, note='', model){
    this.events.unshift({ feature, model: fallback ? '(stub)' : (model || this.activeModel),
      latency, tokens, fallback, at: new Date().toLocaleTimeString('en-US',{hour12:false}), note });
    if (this.events.length > 40) this.events.pop();
    document.dispatchEvent(new CustomEvent('ai-event'));
  },

  /* Non-streaming call. json=true → response schema enforced upstream via prompt. */
  /* grounded=true attaches Google Search — answers use live web data (weather, transit, news). */
  async call(feature, prompt, { system = '', temperature = 0.7, grounded = false } = {}) {
    if (!this.isLive(feature)) { this.log(feature, 0, 0, true, 'feature not activated'); throw new Error('stub'); }
    if (this.inflight >= this.MAX_CONCURRENT) { this.log(feature, 0, 0, true, 'rate-limited'); throw new Error('rate'); }
    this.inflight++;
    const t0 = performance.now();
    try {
      let res, used;
      for (const model of this.candidates()) {
        used = model;
        const body = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          // 2.5 models "think" by default and can burn the whole output budget
          // mid-thought on structured tasks — disable thinking, raise the cap
          generationConfig: { temperature, maxOutputTokens: 2048,
            ...(/^gemini-(2.5|flash-latest|flash-lite-latest)/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
          tools: grounded ? [{ google_search: {} }] : undefined,
        });
        for (let attempt = 0; attempt < 2; attempt++) {
          res = await fetch(`/api/gemini?model=${model}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
          });
          if (res.status !== 503) break;                       // one quick retry on overload
          await new Promise(r => setTimeout(r, 900));
        }
        if (res.ok) break;
        if (res.status === 429) { this.benchModel(model); continue; }
        if (res.status === 503) continue;  // failover
        break;                                                 // other errors: don't walk the chain
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.activeModel = used;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      if (!text) throw new Error('empty');
      this.log(feature, Math.round(performance.now() - t0), data.usageMetadata?.totalTokenCount || 0, false,
        (used !== this.cfg.model ? `failover → ${used}` : '') + (grounded ? ' grounded: google_search' : ''));
      return text;
    } catch (e) {
      const note = /Failed to fetch|NetworkError/i.test(e.message) ? 'server offline — run: node server.js' : e.message;
      if (note.startsWith('server offline')) checkServer();
      this.log(feature, Math.round(performance.now() - t0), 0, true, note);
      throw e;
    } finally { this.inflight--; }
  },

  /* SSE streaming call — onChunk(textDelta) fires as tokens arrive (§14: no full-payload waits). */
  async stream(feature, prompt, { system = '', onChunk } = {}) {
    if (!this.isLive(feature)) throw new Error('stub');
    this.inflight++;
    const t0 = performance.now(); let tokens = 0;
    try {
      let res;
      for (const model of this.candidates()) {
        const body = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048,
            ...(/^gemini-(2.5|flash-latest|flash-lite-latest)/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        });
        res = await fetch(`/api/gemini?model=${model}&stream=1`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
        });
        if (res.ok) { this.activeModel = model; break; }
        if (res.status === 429) { this.benchModel(model); continue; }
        if (res.status === 503) continue;
        break;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = '', full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const j = JSON.parse(line.slice(6));
            const delta = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
            tokens = j.usageMetadata?.totalTokenCount || tokens;
            if (delta) { full += delta; onChunk?.(delta, full); }
          } catch (_) {}
        }
      }
      this.log(feature, Math.round(performance.now() - t0), tokens, false);
      return full;
    } catch (e) {
      const note = /Failed to fetch|NetworkError/i.test(e.message) ? 'server offline — run: node server.js' : e.message;
      if (note.startsWith('server offline')) checkServer();
      this.log(feature, Math.round(performance.now() - t0), tokens, true, note);
      throw e;
    } finally { this.inflight--; }
  },
};

/* Boot-time backend health check — if the Node server isn't running, say so
   plainly instead of letting every call die with "Failed to fetch". */
AI.serverUp = null;
async function checkServer(){
  try{
    const r = await fetch('/api/health', { cache: 'no-store' });
    const j = await r.json();
    AI.serverUp = !!j.ok;
    if (!j.key) console.warn('Server running but no GEMINI_API_KEY in .env');
  }catch(_){
    AI.serverUp = false;
    if (typeof toast === 'function')
      toast('⚠ AI backend offline', 'Start it with:  node server.js  — then refresh. Stubs cover everything meanwhile.', 'warn');
  }
  return AI.serverUp;
}
setTimeout(checkServer, 600);
setInterval(checkServer, 30_000);

/* Live operational context serialized for every AI call — the "one data model" promise. */
function stadiumContext() {
  const hot = S.sections.filter(s => s.density > 70).map(s => `Section ${s.id}: ${Math.round(s.density)}%`).join(', ') || 'none';
  return `LIVE STADIUM STATE (MetLife Stadium, FIFA World Cup 2026, match MEX 1-0 RSA, 63rd minute):
- Attendance: ${S.attendance.toLocaleString()} | Gates open: ${S.gates}/104 | Avg crowd density: ${Math.round(S.sections.reduce((a,s)=>a+s.density,0)/S.sections.length)}%
- Sections above 70% density: ${hot}
- Medical: ${S.medical} active alerts, avg response 74s, units M-1 available at Gate B, M-3 on-scene Section 114
- Power: ${S.powerMW} MW (6% under baseline) | Water: ${S.waterM3} m³ (−11%)
- Transport: rail load 72%, Lot F parking 98% full (rerouting to Lot H), egress surge predicted 22:30
- Open incidents: fan collapse Sec 114 (on-scene, stable), crowd surge watch Sec 105 (stewards en route), unattended bag Gate D (unit S-2 ETA 1m)
- Weather: rain probability 64% post-match`;
}
