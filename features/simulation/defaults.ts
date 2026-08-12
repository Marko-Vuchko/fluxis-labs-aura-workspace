import type { SimulationInput, SimulationMeta } from "./types";

/** Engine fixed seed from PRD 5.1 - default when the client omits seed. */
export const FIXED_SEED = 20260810;

/**
 * Boot-only fallbacks while meta is unavailable (pre-first simulate).
 * After the first engine response, Control Deck reads these from meta only.
 */
export const CLIENTS_PER_HEAD = 12;
export const COST_PER_HEAD = 2_500;

/**
 * Capacity economics for transparent Control Deck labels (PRD FR-2).
 * Prefer engine meta; local constants exist only for the boot gap.
 */
export function resolveCapacityEconomics(meta?: SimulationMeta | null): {
  clientsPerHead: number;
  costPerHead: number;
} {
  if (meta) {
    return {
      clientsPerHead: meta.clients_per_head,
      costPerHead: meta.cost_per_head,
    };
  }
  return {
    clientsPerHead: CLIENTS_PER_HEAD,
    costPerHead: COST_PER_HEAD,
  };
}

/** Default slider values from PRD 6.1. */
export const DEFAULT_PARAMS = {
  ad_spend: 8_000,
  price: 149,
  team_size: 6,
  opex: 12_000,
  cash_reserve: 120_000,
} as const satisfies Omit<SimulationInput, "seed">;

export const DEFAULT_MONTH = 12;

export const PARAM_RANGES = {
  ad_spend: { min: 0, max: 50_000, step: 100 },
  price: { min: 10, max: 2_000, step: 1 },
  team_size: { min: 1, max: 50, step: 1 },
  opex: { min: 0, max: 100_000, step: 100 },
  cash_reserve: { min: 0, max: 500_000, step: 1_000 },
} as const;

export function createDefaultInput(seed?: number): SimulationInput {
  return {
    ...DEFAULT_PARAMS,
    ...(seed === undefined ? {} : { seed }),
  };
}
