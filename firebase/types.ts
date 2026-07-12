/* ═══════════════════════════════════════════════════════════════════════════
   StadiumOS AI — Firestore collection interfaces (single source of truth)

   This file is the type contract for every Firestore collection. The runtime
   is a no-build vanilla-JS static site, so these interfaces are consumed as
   reference + editor IntelliSense (via `// @ts-check` + JSDoc `@type` imports
   in the .js files, and by any future TS build). Every document written by the
   backend API and every snapshot read on the client conforms to these shapes.

   Timestamps: fields ending in `At`/`Updated`/`timestamp` are Firestore
   `Timestamp` on read and may be sent as `serverTimestamp()` on write. On the
   client, call `.toDate()` to get a JS Date. See firestore-service.js.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { Timestamp, FieldValue } from 'firebase/firestore';

/** A Firestore time field: server Timestamp on read, sentinel on write. */
export type FsTime = Timestamp | FieldValue | Date | number;

/** Every document carries its own id once read back from Firestore. */
export interface WithId {
  id: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type CrowdDensity = 'sparse' | 'moderate' | 'busy' | 'packed' | 'critical';

/* ── stadium_status ─────────────────────────────────────────────────────────
   Live headline telemetry for the venue. Typically ONE document per stadium,
   keyed by a stable id (e.g. "metlife"). Drives the top KPI row. */
export interface StadiumStatus extends WithId {
  stadiumName: string;
  crowdDensity: CrowdDensity;
  occupancyPercentage: number;   // 0–100
  weather: string;               // "Clear", "Rain", …
  temperature: number;           // °C
  humidity: number;              // 0–100 (%)
  airQuality: number;            // AQI
  stadiumHealthScore: number;    // 0–100 composite ops-health index
  lastUpdated: FsTime;
}

/* ── crowd_predictions ──────────────────────────────────────────────────────
   AI-generated forecast per zone/gate. Written by Gemini crowd-prediction. */
export interface CrowdPrediction extends WithId {
  zone: string;                  // "Gate 4", "Section 105", …
  currentCrowd: number;
  predictedCrowd: number;
  riskLevel: RiskLevel;
  confidence: number;            // 0–1
  recommendation: string;
  timestamp: FsTime;
}

/* ── emergency_alerts ───────────────────────────────────────────────────────
   Incidents + emergencies. `aiRecommendation` is populated by Gemini. */
export interface EmergencyAlert extends WithId {
  title: string;
  description: string;
  type: string;                  // "medical" | "security" | "fire" | "crowd" | …
  severity: Severity;
  location: string;
  status: AlertStatus;
  aiRecommendation: string;
  createdAt: FsTime;
}

/* ── transport ──────────────────────────────────────────────────────────────
   Egress + mobility telemetry. Typically one rolling document. */
export interface Transport extends WithId {
  parkingOccupancy: number;      // 0–100 (%)
  shuttleStatus: string;
  metroStatus: string;
  trafficLevel: string;          // "light" | "moderate" | "heavy"
  estimatedExitTime: string;     // "22:30–23:10" or minutes
  updatedAt: FsTime;
}

/* ── sustainability ─────────────────────────────────────────────────────────
   ESG telemetry. `aiSuggestion` is populated by Gemini. */
export interface Sustainability extends WithId {
  energyUsage: number;           // MW
  waterUsage: number;            // m³
  wasteCollected: number;        // kg or % diverted
  carbonEmission: number;        // t CO₂e
  aiSuggestion: string;
  updatedAt: FsTime;
}

/* ── ai_reports ─────────────────────────────────────────────────────────────
   Persisted AI outputs (incident summaries, exec briefs, lessons, …). */
export interface AiReport extends WithId {
  title: string;
  summary: string;
  generatedBy: string;           // model id, e.g. "gemini-flash-latest"
  timestamp: FsTime;
}

/* ── notifications ──────────────────────────────────────────────────────────
   Live command-center notifications. `read` toggled by the client via API. */
export interface AppNotification extends WithId {
  title: string;
  message: string;
  priority: Priority;
  read: boolean;
  createdAt: FsTime;
}

/* ── fan_experience ─────────────────────────────────────────────────────────
   Live composite fan-satisfaction score (singleton doc). AI explains drops. */
export interface FanExperience extends WithId {
  overallScore: number;          // 0–100
  navigation: number;
  foodWait: number;
  accessibility: number;
  transport: number;
  safety: number;
  aiExplanation: string;         // why the score is where it is + top fix
  updatedAt: FsTime;
}

/* ── food_waste ─────────────────────────────────────────────────────────────
   AI pre-halftime unsold-inventory predictions with transfer recommendations. */
export interface FoodWastePrediction extends WithId {
  outlet: string;                // "Food Court B"
  item: string;                  // "Burgers"
  predictedUnsold: number;
  confidence: number;            // 0–1
  recommendation: string;        // "Transfer 40 units to Food Court D"
  status: 'pending' | 'actioned' | 'dismissed';
  createdAt: FsTime;
}

/** Discriminated map from collection name → document type. */
export interface CollectionMap {
  stadium_status: StadiumStatus;
  crowd_predictions: CrowdPrediction;
  emergency_alerts: EmergencyAlert;
  transport: Transport;
  sustainability: Sustainability;
  ai_reports: AiReport;
  notifications: AppNotification;
  fan_experience: FanExperience;
  food_waste: FoodWastePrediction;
}

export type CollectionName = keyof CollectionMap;

/* ── Service-layer contracts ────────────────────────────────────────────────
   The shapes the reusable Firestore service + hooks expose to the app. */

/** State delivered to every subscribe callback — mirrors a React hook. */
export interface SubscriptionState<T> {
  data: T;                       // [] for collections, null for a missing doc
  loading: boolean;
  error: Error | null;
  fromCache: boolean;            // true while served from the offline cache
  hasPendingWrites: boolean;
}

export interface QueryOptions {
  /** Field to order by (must be present on the docs). */
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  /** Max docs to read — the primary knob for minimizing reads. */
  limitTo?: number;
  /** Simple equality filters: [field, value][]. */
  where?: [string, unknown][];
}

/** Signature of every reusable service function. */
export interface FirestoreService {
  addDocument<K extends CollectionName>(
    collection: K, data: Partial<CollectionMap[K]>, id?: string
  ): Promise<string>;
  updateDocument<K extends CollectionName>(
    collection: K, id: string, data: Partial<CollectionMap[K]>
  ): Promise<void>;
  deleteDocument(collection: CollectionName, id: string): Promise<void>;
  subscribeCollection<K extends CollectionName>(
    collection: K,
    onState: (state: SubscriptionState<CollectionMap[K][]>) => void,
    options?: QueryOptions
  ): () => void;
  subscribeDocument<K extends CollectionName>(
    collection: K, id: string,
    onState: (state: SubscriptionState<CollectionMap[K] | null>) => void
  ): () => void;
  getCollection<K extends CollectionName>(
    collection: K, options?: QueryOptions
  ): Promise<CollectionMap[K][]>;
  getDocument<K extends CollectionName>(
    collection: K, id: string
  ): Promise<CollectionMap[K] | null>;
}
