import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  checkEdgeRateLimit,
  isSameOriginRequest,
} from "@/lib/api/guards";

function requestWith(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://aura.example/api/simulate", {
    method: "POST",
    headers,
  });
}

describe("isSameOriginRequest", () => {
  it("rejects requests without Sec-Fetch-Site: same-origin", () => {
    const request = requestWith({
      host: "aura.example",
      origin: "https://aura.example",
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("accepts same-origin POST with a matching Origin", () => {
    const request = requestWith({
      "sec-fetch-site": "same-origin",
      host: "aura.example",
      origin: "https://aura.example",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a mismatched Origin even when Sec-Fetch-Site is same-origin", () => {
    const request = requestWith({
      "sec-fetch-site": "same-origin",
      host: "aura.example",
      origin: "https://evil.example",
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("accepts same-origin GET with only Sec-Fetch-Site (no Origin/Referer)", () => {
    const request = new NextRequest("https://aura.example/api/health", {
      method: "GET",
      headers: {
        "sec-fetch-site": "same-origin",
        host: "aura.example",
      },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });
});

describe("checkEdgeRateLimit", () => {
  it("allows traffic under the limit and then denies", () => {
    const key = `rate-deny-${Math.random()}`;
    const first = checkEdgeRateLimit(key, {
      limit: 2,
      windowMs: 1_000,
      nowMs: 1_000,
    });
    const second = checkEdgeRateLimit(key, {
      limit: 2,
      windowMs: 1_000,
      nowMs: 1_001,
    });
    const third = checkEdgeRateLimit(key, {
      limit: 2,
      windowMs: 1_000,
      nowMs: 1_002,
    });

    expect(first).toEqual({ ok: true, remaining: 1 });
    expect(second).toEqual({ ok: true, remaining: 0 });
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("admits a new request after the window slides", () => {
    const key = `rate-window-${Math.random()}`;
    checkEdgeRateLimit(key, { limit: 1, windowMs: 1_000, nowMs: 1_000 });
    const denied = checkEdgeRateLimit(key, {
      limit: 1,
      windowMs: 1_000,
      nowMs: 1_100,
    });
    const allowed = checkEdgeRateLimit(key, {
      limit: 1,
      windowMs: 1_000,
      nowMs: 2_100,
    });

    expect(denied.ok).toBe(false);
    expect(allowed).toEqual({ ok: true, remaining: 0 });
  });
});
