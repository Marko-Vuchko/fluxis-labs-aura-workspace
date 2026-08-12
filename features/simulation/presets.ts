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
 * Values are intentional staging choices and will be calibrated later.
 */
export const PRESETS: readonly SimulationPreset[] = [
  {
    id: "bootstrap",
    labelKey: "presets.bootstrap",
    params: {
      ad_spend: 2_000,
      price: 79,
      team_size: 2,
      opex: 3_000,
      cash_reserve: 40_000,
    },
  },
  {
    id: "growth_push",
    labelKey: "presets.growth_push",
    params: {
      ad_spend: 25_000,
      price: 129,
      team_size: 8,
      opex: 15_000,
      cash_reserve: 100_000,
    },
  },
  {
    id: "overload_crisis",
    labelKey: "presets.overload_crisis",
    params: {
      ad_spend: 35_000,
      price: 99,
      team_size: 3,
      opex: 8_000,
      cash_reserve: 50_000,
    },
  },
  {
    id: "optimized",
    labelKey: "presets.optimized",
    params: {
      ad_spend: 10_000,
      price: 179,
      team_size: 10,
      opex: 14_000,
      cash_reserve: 180_000,
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
