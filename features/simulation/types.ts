/** Manual TypeScript mirror of the Pydantic / Zod simulation contract (PRD 6.2, 6.3). */

export type PercentileTriple = readonly [p10: number, p50: number, p90: number];

/** Node tuple: [health, x, y, z]. Exactly seven per month, order from PRD 5.5. */
export type NodeState = readonly [
  health: number,
  x: number,
  y: number,
  z: number,
];

export type NodeId =
  | "marketing"
  | "sales"
  | "support"
  | "operations"
  | "profit"
  | "churn"
  | "cash_runway";

export const NODE_ORDER = [
  "marketing",
  "sales",
  "support",
  "operations",
  "profit",
  "churn",
  "cash_runway",
] as const satisfies readonly NodeId[];

export type InsightSeverity = "info" | "warning" | "critical";

export type InsightCode =
  | "CAP_BREACH"
  | "CAP_NEAR_LIMIT"
  | "CAP_UNDERUSED"
  | "CAP_HIRE_SUGGESTED"
  | "CAP_CHURN_FROM_OVERLOAD"
  | "PRICE_ABOVE_REFERENCE"
  | "PRICE_BELOW_REFERENCE"
  | "PRICE_CONVERSION_DROP"
  | "PRICE_MARGIN_THIN"
  | "PRICE_STRONGEST_LEVER"
  | "MKT_SATURATION"
  | "MKT_EFFICIENT"
  | "MKT_DEPENDENCY_HIGH"
  | "MKT_UNDERSPEND"
  | "MKT_CAC_ABOVE_LTV"
  | "CASH_RUNWAY_CRITICAL"
  | "CASH_RUNWAY_WARNING"
  | "CASH_PROFITABLE"
  | "CASH_BURN_RISING"
  | "CASH_LOSS_PROBABILITY"
  | "REC_TOP_LEVER"
  | "REC_SECOND_LEVER";

export type SimulationParamKey =
  | "ad_spend"
  | "price"
  | "team_size"
  | "opex"
  | "cash_reserve";

export type SimulationInput = {
  ad_spend: number;
  price: number;
  team_size: number;
  opex: number;
  cash_reserve: number;
  seed?: number;
};

export type RiskSnapshot = {
  score: number;
  /** [loss probability, overload, profit volatility, ad dependency] */
  components: readonly [number, number, number, number];
};

export type MonthSnapshot = {
  index: number;
  revenue: PercentileTriple;
  profit: PercentileTriple;
  margin: number;
  customers: number;
  churn_rate: number;
  capacity_used: number;
  cash: number;
  /** null means PROFITABLE */
  runway_months: number | null;
  risk: RiskSnapshot;
  /** Exactly 7 nodes in NODE_ORDER; length enforced at the API boundary. */
  nodes: readonly NodeState[];
  /** Exactly 3 insights for this month; length enforced at the API boundary. */
  insights: readonly Insight[];
};

export type SimulationMeta = {
  engine_version: string;
  iterations: number;
  months: number;
  seed: number;
  compute_ms: number;
  currency: string;
  /** Engine capacity economics (PRD 5.1 / FR-2) - always from meta, never invented. */
  clients_per_head: number;
  cost_per_head: number;
};

export type AnnualSummary = {
  revenue: PercentileTriple;
  profit: PercentileTriple;
  margin: PercentileTriple;
  ending_cash: PercentileTriple;
};

export type Histogram = {
  metric: "annual_profit";
  bin_edges: readonly number[];
  counts: readonly number[];
};

export type SensitivityItem = {
  param: string;
  coefficient: number;
  rank: number;
};

export type Insight = {
  code: string;
  severity: InsightSeverity;
  params: Readonly<Record<string, number>>;
};

export type SimulationOutput = {
  meta: SimulationMeta;
  annual: AnnualSummary;
  months: readonly MonthSnapshot[];
  histogram: Histogram;
  sensitivity: readonly SensitivityItem[];
  /** Alias of months[11].insights (PRD 6.2). Copilot reads the selected month. */
  insights: readonly Insight[];
};

export type HealthResponse = {
  status: string;
  engine_version: string;
  uptime_s: number;
  numpy_warmup_ms: number;
};

export type SimulationStatus =
  | "booting"
  | "ready"
  | "simulating"
  | "stale"
  | "error";

/** Stable client error codes - localize at the UI boundary, never hardcode EN copy here. */
import type { ApiErrorCode } from "@/lib/i18n/api-errors";
export type { ApiErrorCode };

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: ApiErrorCode;
  /** Optional HTTP status for messages that interpolate {status}. */
  status?: number;
};
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
