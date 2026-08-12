import type { SimulationInput } from "./types";

export type PresetId =
  | "bootstrap"
  | "growth_push"
  | "overload_crisis"
  | "optimized";

export type SimulationPreset = {
  id: PresetId;
  /** i18n key under ui.presets.* */
  labelKey: `presets.${PresetId}`;
  params: Omit<SimulationInput, "seed">;
};

/**
 * Four staged scenarios for the Control Deck.
 * Values calibrated against live engine outcomes (month 12, FIXED_SEED):
 * - Bootstrap: cash-flow positive with yellow marketing, modest customer base
 * - Growth Push: high revenue with orange Support (capacity near sweet spot edge)
 * - Overload Crisis: capacity breached, majority of nodes critical
 * - Optimized: five of seven nodes stable green
 */
export const PRESETS: readonly SimulationPreset[] = [
  {
    id: "bootstrap",
    labelKey: "presets.bootstrap",
    params: {
      ad_spend: 15_000,
      price: 2_000,
      team_size: 2,
      opex: 0,
      cash_reserve: 60_000,
    },
  },
  {
    id: "growth_push",
    labelKey: "presets.growth_push",
    params: {
      ad_spend: 30_000,
      price: 2_000,
      team_size: 4,
      opex: 0,
      cash_reserve: 100_000,
    },
  },
  {
    id: "overload_crisis",
    labelKey: "presets.overload_crisis",
    params: {
      ad_spend: 40_000,
      price: 149,
      team_size: 2,
      opex: 5_000,
      cash_reserve: 40_000,
    },
  },
  {
    id: "optimized",
    labelKey: "presets.optimized",
    params: {
      ad_spend: 8_000,
      price: 149,
      team_size: 6,
      opex: 0,
      cash_reserve: 250_000,
    },
  },
] as const;

export function getPreset(id: PresetId): SimulationPreset {
  const preset = PRESETS.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown preset: ${id}`);
  }
  return preset;
}
