/* ═══ StadiumOS AI — §14 Activation Config ═══
   The product owner has named, in writing: model = gemini-2.5-flash (Google
   Generative Language API, free tier). One config value per feature — flipping
   a flag to false reverts that feature to its deterministic stub instantly. */
window.STADIUM_CONFIG = {
  /* No API key here — it lives server-side in .env (git-ignored).
     The browser only ever talks to our own /api/gemini proxy. */
  model: 'gemini-flash-latest',
  /* failover chain — each model has its own free-tier daily quota; the
     orchestrator walks down the chain on 429 (quota) / 503 (overload) */
  modelChain: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
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
    audio_sentinel:   { live: true,  label: 'Acoustic anomaly classification' },
    negotiator:       { live: true,  label: 'Resource conflict negotiator' },
    flow_sim:         { live: true,  label: 'Pre-gate fan-flow simulation' },
    cross_stadium:    { live: true,  label: 'Cross-stadium learning loop' },
    trust_loop:       { live: true,  label: 'Self-correcting alert thresholds' },
    sensory_routing:  { live: true,  label: 'Sensory-load routing' },
    what_if:          { live: true,  label: 'What-If disaster simulator' },
    horizon:          { live: true,  label: 'Predictive horizon (5/15/30 min)' },
    trust_score:      { live: true,  label: 'Report trust scoring' },
    emotion_map:      { live: true,  label: 'Crowd emotion read' },
    root_cause:       { live: true,  label: 'Root cause explorer' },
    twin_score:       { live: true,  label: 'Operational twin score' },
    mutual_aid:       { live: true,  label: 'Multi-stadium mutual aid' },
    swarm_ops:        { live: true,  label: 'Swarm coordination' },
    emergency_copilot:{ live: true,  label: 'Emergency copilot (command NL)' },
    emergency_mode:   { live: true,  label: 'Emergency Mode digital commander' },
    med_triage:       { live: true,  label: 'Medical priority engine' },
    stampede:         { live: true,  label: 'Stampede prevention' },
    responder_opt:    { live: true,  label: 'Responder optimizer' },
    zone_broadcast:   { live: true,  label: 'Zone-targeted smart broadcast' },
    safe_zones:       { live: true,  label: 'Dynamic safe zones & evac routes' },
    reunify:          { live: true,  label: 'Family reunification' },
    comms_health:     { live: true,  label: 'Emergency comms health' },
    auto_recorder:    { live: true,  label: 'Incident auto-recorder & report' },
    brain:            { live: true,  label: 'Explainable Stadium Brain' },
    reasoning:        { live: true,  label: 'AI reasoning engine (why?)' },
    exec_voice:       { live: true,  label: 'Voice executive brief' },
    scorecard:        { live: true,  label: 'Operational scorecard' },
    venue_learning:   { live: true,  label: 'Venue learning (lessons)' },
    heat_stress:      { live: true,  label: 'Heat stress prediction' },
    hospital_coord:   { live: true,  label: 'Hospital coordination' },
  }
};
