import { afterEach, describe, expect, it, vi } from "vitest";

import { FIXED_SEED } from "@/features/simulation/defaults";
import { getPreset } from "@/features/simulation/presets";
import {
  parseShareQuery,
  replaceShareQuery,
  serializeShareQuery,
} from "@/lib/share/query";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share query parse/serialize", () => {
  it("round-trips the five sliders, month, and seed", () => {
    const state = {
      params: {
        ad_spend: 8_000,
        price: 149,
        team_size: 6,
        opex: 12_000,
        cash_reserve: 120_000,
        seed: FIXED_SEED,
      },
      month: 12,
    };
    const query = serializeShareQuery(state);
    expect(query).toBe(
      "ad=8000&price=149&team=6&opex=12000&cash=120000&m=12&seed=20260810",
    );
    expect(parseShareQuery(`?${query}`)).toEqual(state);
  });

  it("hydrates Overload Crisis from a LinkedIn-style URL", () => {
    const crisis = getPreset("overload_crisis").params;
    const query = serializeShareQuery({
      params: { ...crisis, seed: FIXED_SEED },
      month: 12,
    });
    const parsed = parseShareQuery(`?${query}`);
    expect(parsed.params.ad_spend).toBe(crisis.ad_spend);
    expect(parsed.params.team_size).toBe(crisis.team_size);
    expect(parsed.params.opex).toBe(crisis.opex);
    expect(parsed.month).toBe(12);
  });

  it("clamps out-of-range values and fills missing keys from defaults", () => {
    const parsed = parseShareQuery("?ad=999999&team=0&m=99&seed=not-a-number");
    expect(parsed.params.ad_spend).toBe(50_000);
    expect(parsed.params.team_size).toBe(1);
    expect(parsed.params.price).toBe(149);
    expect(parsed.month).toBe(12);
    expect(parsed.params.seed).toBe(FIXED_SEED);
  });

  it("replaceShareQuery uses history.replaceState and skips no-ops", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "?ad=8000&price=149&team=6&opex=12000&cash=120000&m=12&seed=20260810",
        hash: "",
      },
      history: { state: null, replaceState },
    });

    replaceShareQuery({
      params: {
        ad_spend: 8_000,
        price: 149,
        team_size: 6,
        opex: 12_000,
        cash_reserve: 120_000,
        seed: FIXED_SEED,
      },
      month: 12,
    });
    expect(replaceState).not.toHaveBeenCalled();

    replaceShareQuery({
      params: {
        ad_spend: 40_000,
        price: 149,
        team_size: 2,
        opex: 5_000,
        cash_reserve: 40_000,
        seed: FIXED_SEED,
      },
      month: 12,
    });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState.mock.calls[0]?.[2]).toContain("ad=40000");
    expect(replaceState.mock.calls[0]?.[2]).toContain("team=2");
  });
});
