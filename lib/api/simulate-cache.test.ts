import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCachedSimulate,
  setCachedSimulate,
  simulateCacheKey,
} from "@/lib/api/simulate-cache";

afterEach(() => {
  vi.useRealTimers();
});

describe("simulateCacheKey", () => {
  it("is stable regardless of object key order", () => {
    const a = simulateCacheKey({ seed: 1, ad_spend: 8000 });
    const b = simulateCacheKey({ ad_spend: 8000, seed: 1 });
    expect(a).toBe(b);
  });

  it("changes when a value changes", () => {
    const a = simulateCacheKey({ ad_spend: 8000 });
    const b = simulateCacheKey({ ad_spend: 8100 });
    expect(a).not.toBe(b);
  });
});

describe("simulate cache TTL", () => {
  it("returns the stored body inside the TTL window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T10:00:00.000Z"));
    const key = `ttl-hit-${Math.random()}`;
    setCachedSimulate(key, '{"ok":true}');
    expect(getCachedSimulate(key)).toBe('{"ok":true}');
  });

  it("misses after the 30s TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T10:00:00.000Z"));
    const key = `ttl-miss-${Math.random()}`;
    setCachedSimulate(key, '{"ok":true}');
    vi.setSystemTime(new Date("2026-08-12T10:00:30.001Z"));
    expect(getCachedSimulate(key)).toBeNull();
  });
});
