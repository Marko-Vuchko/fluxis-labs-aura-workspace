import {
  DEFAULT_MONTH,
  DEFAULT_PARAMS,
  FIXED_SEED,
  PARAM_RANGES,
} from "@/features/simulation/defaults";
import type {
  SimulationInput,
  SimulationParamKey,
} from "@/features/simulation/types";
import { SEED_MAX, SEED_MIN } from "@/lib/simulation/contract";

/** Short query keys for LinkedIn-friendly share URLs. */
export const SHARE_QUERY_KEYS = {
  ad: "ad",
  price: "price",
  team: "team",
  opex: "opex",
  cash: "cash",
  month: "m",
  seed: "seed",
} as const;

export type ShareState = {
  params: SimulationInput;
  month: number;
};

function clampParam(key: SimulationParamKey, value: number): number {
  const range = PARAM_RANGES[key];
  if (!Number.isFinite(value)) {
    return DEFAULT_PARAMS[key];
  }
  const stepped =
    key === "team_size"
      ? Math.round(value)
      : Math.round(value / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, stepped));
}

function clampMonth(month: number): number {
  if (!Number.isFinite(month)) {
    return DEFAULT_MONTH;
  }
  return Math.min(12, Math.max(1, Math.round(month)));
}

function clampSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return FIXED_SEED;
  }
  return Math.min(SEED_MAX, Math.max(SEED_MIN, Math.round(seed)));
}

function readNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parse Control Deck state from a query string (`?ad=8000&price=149...`).
 * Missing or invalid keys fall back to PRD defaults. Always returns a full state.
 */
export function parseShareQuery(search: string): ShareState {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);

  const ad = readNumber(params.get(SHARE_QUERY_KEYS.ad));
  const price = readNumber(params.get(SHARE_QUERY_KEYS.price));
  const team = readNumber(params.get(SHARE_QUERY_KEYS.team));
  const opex = readNumber(params.get(SHARE_QUERY_KEYS.opex));
  const cash = readNumber(params.get(SHARE_QUERY_KEYS.cash));
  const month = readNumber(params.get(SHARE_QUERY_KEYS.month));
  const seed = readNumber(params.get(SHARE_QUERY_KEYS.seed));

  return {
    params: {
      ad_spend: clampParam("ad_spend", ad ?? DEFAULT_PARAMS.ad_spend),
      price: clampParam("price", price ?? DEFAULT_PARAMS.price),
      team_size: clampParam("team_size", team ?? DEFAULT_PARAMS.team_size),
      opex: clampParam("opex", opex ?? DEFAULT_PARAMS.opex),
      cash_reserve: clampParam(
        "cash_reserve",
        cash ?? DEFAULT_PARAMS.cash_reserve,
      ),
      seed: clampSeed(seed ?? FIXED_SEED),
    },
    month: clampMonth(month ?? DEFAULT_MONTH),
  };
}

/** Serialize a committed Control Deck snapshot into a stable query string (no `?`). */
export function serializeShareQuery(state: ShareState): string {
  const params = new URLSearchParams();
  params.set(
    SHARE_QUERY_KEYS.ad,
    String(clampParam("ad_spend", state.params.ad_spend)),
  );
  params.set(
    SHARE_QUERY_KEYS.price,
    String(clampParam("price", state.params.price)),
  );
  params.set(
    SHARE_QUERY_KEYS.team,
    String(clampParam("team_size", state.params.team_size)),
  );
  params.set(
    SHARE_QUERY_KEYS.opex,
    String(clampParam("opex", state.params.opex)),
  );
  params.set(
    SHARE_QUERY_KEYS.cash,
    String(clampParam("cash_reserve", state.params.cash_reserve)),
  );
  params.set(SHARE_QUERY_KEYS.month, String(clampMonth(state.month)));
  params.set(
    SHARE_QUERY_KEYS.seed,
    String(clampSeed(state.params.seed ?? FIXED_SEED)),
  );
  return params.toString();
}

/**
 * Replace the current URL query without adding a history entry.
 * Call on slider/month commit, never while dragging.
 */
export function replaceShareQuery(state: ShareState): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = serializeShareQuery(state);
  const current = window.location.search.replace(/^\?/, "");
  if (current === next) {
    return;
  }
  const url = `${window.location.pathname}?${next}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
}
