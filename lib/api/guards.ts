import "server-only";

import { NextRequest } from "next/server";

import { SEED_MAX, SEED_MIN } from "@/lib/simulation/contract";

export { SEED_MAX, SEED_MIN };

/** Matches Vercel WAF start values and FastAPI historical 60/min cap. */
export const EDGE_RATE_LIMIT_REQUESTS = 60;
export const EDGE_RATE_LIMIT_WINDOW_MS = 60_000;

type RateBucket = number[];

const rateBuckets = new Map<string, RateBucket>();
const MAX_RATE_BUCKETS = 10_000;
const EVICTION_INTERVAL_MS = 30_000;

let lastEvictionAt = 0;

function evictIdleRateBuckets(now: number, windowMs: number): void {
  const overCap = rateBuckets.size > MAX_RATE_BUCKETS;
  if (!overCap && now - lastEvictionAt < EVICTION_INTERVAL_MS) {
    return;
  }
  lastEvictionAt = now;
  const cutoff = now - windowMs;
  for (const [key, stamps] of rateBuckets) {
    const last = stamps[stamps.length - 1];
    if (stamps.length === 0 || last === undefined || last < cutoff) {
      rateBuckets.delete(key);
    }
  }
  while (rateBuckets.size > MAX_RATE_BUCKETS) {
    const oldest = rateBuckets.keys().next();
    if (oldest.done) {
      break;
    }
    rateBuckets.delete(oldest.value);
  }
}

/**
 * Browser same-origin gate for BFF routes.
 *
 * Requires Sec-Fetch-Site: same-origin (forbidden header - browsers set it,
 * casual curl does not). Origin is checked when present (typical for POST).
 * Same-origin GET/HEAD often omit Origin; fall back to Referer, then trust
 * Sec-Fetch-Site alone so boot health polling is not blocked.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite !== "same-origin") {
    return false;
  }

  const host = request.headers.get("host");
  if (!host) {
    return false;
  }

  const expectedHost = host.toLowerCase();

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  // GET same-origin fetch: Sec-Fetch-Site present, Origin/Referer may both be absent.
  return true;
}


/**
 * Best-effort client IP behind Vercel. First X-Forwarded-For hop is the visitor.
 * In-memory buckets are per serverless isolate - soft limit until WAF is live.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkEdgeRateLimit(
  key: string,
  options?: {
    limit?: number;
    windowMs?: number;
    nowMs?: number;
  },
): RateLimitResult {
  const limit = options?.limit ?? EDGE_RATE_LIMIT_REQUESTS;
  const windowMs = options?.windowMs ?? EDGE_RATE_LIMIT_WINDOW_MS;
  const now = options?.nowMs ?? Date.now();

  evictIdleRateBuckets(now, windowMs);

  let bucket = rateBuckets.get(key);
  if (!bucket) {
    bucket = [];
    rateBuckets.set(key, bucket);
  }

  const cutoff = now - windowMs;
  while (bucket.length > 0 && bucket[0]! < cutoff) {
    bucket.shift();
  }

  if (bucket.length >= limit) {
    const oldest = bucket[0] ?? now;
    const retryAfterMs = Math.max(1, windowMs - (now - oldest));
    return {
      ok: false,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  bucket.push(now);
  return { ok: true, remaining: limit - bucket.length };
}
