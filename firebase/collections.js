// @ts-check
/* ═══════════════════════════════════════════════════════════════════════════
   Firestore collection registry — the one place collection names, their public
   (dashboard-readable) vs sensitive classification, and default seed docs live.
   Keep this in lockstep with firebase/types.ts and firestore.rules.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Canonical collection names — import these, never hard-code strings. */
export const COLLECTIONS = /** @type {const} */ ({
  STADIUM_STATUS: 'stadium_status',
  CROWD_PREDICTIONS: 'crowd_predictions',
  EMERGENCY_ALERTS: 'emergency_alerts',
  TRANSPORT: 'transport',
  SUSTAINABILITY: 'sustainability',
  AI_REPORTS: 'ai_reports',
  NOTIFICATIONS: 'notifications',
  FAN_EXPERIENCE: 'fan_experience',
  FOOD_WASTE: 'food_waste',
});

/** Collections the public dashboard is allowed to READ in real time. */
export const PUBLIC_COLLECTIONS = [
  COLLECTIONS.STADIUM_STATUS,
  COLLECTIONS.CROWD_PREDICTIONS,
  COLLECTIONS.TRANSPORT,
  COLLECTIONS.SUSTAINABILITY,
  COLLECTIONS.AI_REPORTS,
  COLLECTIONS.NOTIFICATIONS,
  COLLECTIONS.FAN_EXPERIENCE,
  COLLECTIONS.FOOD_WASTE,
];

/** Sensitive collections — never publicly readable (mirrors firestore.rules).
    emergency_alerts can carry medical/PII detail, so it is gated. */
export const SENSITIVE_COLLECTIONS = [COLLECTIONS.EMERGENCY_ALERTS];

/** Every collection name, for iteration. */
export const ALL_COLLECTIONS = Object.values(COLLECTIONS);

export const isPublicCollection = (name) => PUBLIC_COLLECTIONS.includes(name);

/* Stable ids for the singleton "rolling" documents so writes upsert one row
   instead of appending forever (minimizes reads + keeps the dashboard clean). */
export const SINGLETON_IDS = {
  [COLLECTIONS.STADIUM_STATUS]: 'metlife',
  [COLLECTIONS.TRANSPORT]: 'metlife',
  [COLLECTIONS.SUSTAINABILITY]: 'metlife',
  [COLLECTIONS.FAN_EXPERIENCE]: 'metlife',
};

/* Seed documents used by SETUP (npm run seed) so a fresh project renders
   immediately. These mirror the demo state in app.js. */
export const SEED_DOCS = {
  [COLLECTIONS.STADIUM_STATUS]: {
    metlife: {
      stadiumName: 'MetLife Stadium',
      crowdDensity: 'busy',
      occupancyPercentage: 61,
      weather: 'Clear',
      temperature: 24,
      humidity: 58,
      airQuality: 42,
      stadiumHealthScore: 92,
    },
  },
  [COLLECTIONS.TRANSPORT]: {
    metlife: {
      parkingOccupancy: 84,
      shuttleStatus: '18 units · 4.2 min headway',
      metroStatus: 'Meadowlands line 72% load',
      trafficLevel: 'moderate',
      estimatedExitTime: '22:30–23:10',
    },
  },
  [COLLECTIONS.SUSTAINABILITY]: {
    metlife: {
      energyUsage: 38.2,
      waterUsage: 512,
      wasteCollected: 78,
      carbonEmission: 41,
      aiSuggestion: 'Pre-cool bowl 30 min earlier — saves 1.8 MWh vs reactive HVAC.',
    },
  },
  [COLLECTIONS.CROWD_PREDICTIONS]: {
    'seed-105': {
      zone: 'Section 105',
      currentCrowd: 4200,
      predictedCrowd: 4850,
      riskLevel: 'high',
      confidence: 0.86,
      recommendation: 'Reallocate 4 stewards from Gate C; hold escalator 2.',
    },
  },
  [COLLECTIONS.EMERGENCY_ALERTS]: {
    'seed-114': {
      title: 'Fan collapse — Section 114',
      description: 'On-scene, patient stable. Unit M-3 responding.',
      type: 'medical',
      severity: 'high',
      location: 'Section 114',
      status: 'in_progress',
      aiRecommendation: 'Keep M-1 at Gate B on standby; clear corridor 114→exit D.',
    },
  },
  [COLLECTIONS.AI_REPORTS]: {
    'seed-report': {
      title: 'Pre-match readiness brief',
      summary: 'All systems nominal except Section 105 (88% density, trending up).',
      generatedBy: 'gemini-flash-latest',
    },
  },
  [COLLECTIONS.NOTIFICATIONS]: {
    'seed-notif': {
      title: 'Crowd threshold — Section 105',
      message: 'Density 88% and rising. Steward reallocation awaiting approval.',
      priority: 'high',
      read: false,
    },
  },
};
