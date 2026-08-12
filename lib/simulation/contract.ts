import { z } from "zod";

/** Inclusive seed bounds aligned with FastAPI and client RESEED (`0 .. 2^31-1`). */
export const SEED_MIN = 0;
export const SEED_MAX = 2_147_483_647;

const percentileTripleSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const nodeSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const insightItemSchema = z
  .object({
    code: z.string(),
    severity: z.enum(["info", "warning", "critical"]),
    params: z.record(z.string(), z.number()),
  })
  .strict();

/** Shared Zod input contract for BFF route and browser client (PRD 6.1). */
export const simulationInputSchema = z
  .object({
    ad_spend: z.number().finite().min(0).max(50_000),
    price: z.number().finite().min(10).max(2_000),
    team_size: z.number().int().min(1).max(50),
    opex: z.number().finite().min(0).max(100_000),
    cash_reserve: z.number().finite().min(0).max(500_000),
    seed: z.number().int().min(SEED_MIN).max(SEED_MAX).optional(),
  })
  .strict();

/** Shared Zod output contract for BFF route and browser client (PRD 6.2). */
export const simulationOutputSchema = z
  .object({
    meta: z
      .object({
        engine_version: z.string(),
        iterations: z.number().int(),
        months: z.number().int(),
        seed: z.number().int().min(SEED_MIN).max(SEED_MAX),
        compute_ms: z.number().finite(),
        currency: z.string(),
        clients_per_head: z.number().finite(),
        cost_per_head: z.number().finite(),
      })
      .strict(),
    annual: z
      .object({
        revenue: percentileTripleSchema,
        profit: percentileTripleSchema,
        margin: percentileTripleSchema,
        ending_cash: percentileTripleSchema,
      })
      .strict(),
    months: z
      .array(
        z
          .object({
            index: z.number().int().min(1).max(12),
            revenue: percentileTripleSchema,
            profit: percentileTripleSchema,
            margin: z.number().finite(),
            customers: z.number().finite(),
            churn_rate: z.number().finite(),
            capacity_used: z.number().finite(),
            cash: z.number().finite(),
            runway_months: z.number().finite().nullable(),
            risk: z
              .object({
                score: z.number().finite(),
                components: z.tuple([
                  z.number().finite(),
                  z.number().finite(),
                  z.number().finite(),
                  z.number().finite(),
                ]),
              })
              .strict(),
            nodes: z.array(nodeSchema).length(7),
            insights: z.array(insightItemSchema).length(3),
          })
          .strict(),
      )
      .length(12),
    histogram: z
      .object({
        metric: z.literal("annual_profit"),
        bin_edges: z.array(z.number().finite()).length(31),
        counts: z.array(z.number().int()).length(30),
      })
      .strict(),
    sensitivity: z.array(
      z
        .object({
          param: z.string(),
          coefficient: z.number().finite(),
          rank: z.number().int(),
        })
        .strict(),
    ),
    insights: z.array(insightItemSchema).length(3),
  })
  .strict();

/**
 * Engine 1.0.0 payloads omit months[i].insights. Copy the year-end alias
 * so Zod .length(3) does not 502 the BFF before 1.1.0 is serving.
 */
export function hydrateSimulationOutput(payload: unknown): unknown {
  if (payload === null || typeof payload !== "object") {
    return payload;
  }
  const root = payload as Record<string, unknown>;
  const months = root.months;
  const topInsights = root.insights;
  if (!Array.isArray(months) || !Array.isArray(topInsights)) {
    return payload;
  }

  let changed = false;
  const nextMonths = months.map((month) => {
    if (month === null || typeof month !== "object") {
      return month;
    }
    const entry = month as Record<string, unknown>;
    if (Array.isArray(entry.insights)) {
      return entry;
    }
    changed = true;
    return { ...entry, insights: topInsights };
  });

  if (!changed) {
    return payload;
  }
  return { ...root, months: nextMonths };
}

export function parseSimulationOutput(payload: unknown) {
  return simulationOutputSchema.safeParse(hydrateSimulationOutput(payload));
}

export type SimulationInput = z.infer<typeof simulationInputSchema>;
export type SimulationOutput = z.infer<typeof simulationOutputSchema>;
