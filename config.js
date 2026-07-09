/* ═══ StadiumOS AI — §14 Activation Config ═══
   The product owner has named, in writing: model = gemini-2.5-flash (Google
   Generative Language API, free tier). One config value per feature — flipping
   a flag to false reverts that feature to its deterministic stub instantly. */
window.STADIUM_CONFIG = {
  /* No API key here — it lives server-side in .env (git-ignored).
     The browser only ever talks to our own /api/gemini proxy. */
  model: 'gemini-2.5-flash',
  /* failover chain — each model has its own free-tier daily quota; the
     orchestrator walks down the chain on 429 (quota) / 503 (overload) */
  modelChain: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  features: {
    assistant:        { live: true,  label: 'Stadium assistant (NL + voice)' },
    crowd_prediction: { live: true,  label: 'Crowd prediction' },
    incident_summary: { live: true,  label: 'Incident summarization' },
    evac_planning:    { live: true,  label: 'Evacuation planning (human-gated)' },
    exec_summary:     { live: true,  label: 'Executive summary generator' },
    translation:      { live: true,  label: 'Live translation' },
    energy_opt:       { live: true,  label: 'Energy optimization' },
    triage:           { live: true,  label: 'Medical triage assist' },
    lost_found:       { live: true,  label: 'Lost & found matching' },
    gate_rec:         { live: true,  label: 'Gate flow recommendations' },
    fan_assist:       { live: true,  label: 'Fan app assistant' },
    volunteer_ops:    { live: true,  label: 'Volunteer copilot & role optimizer' },
    accessibility:    { live: true,  label: 'Accessibility routing (wheelchair)' },
    exit_planner:     { live: true,  label: 'Personal exit planner' },
  }
};
