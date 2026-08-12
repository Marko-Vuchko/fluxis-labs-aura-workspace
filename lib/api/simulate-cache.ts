import "server-only";

/**
 * Short-lived in-memory cache for identical /api/simulate payloads.
 * Cuts duplicate Vercel→Render calls when sliders bounce (PRD §12 risk #1).
 * Per serverless isolate only - not a shared store.
 */

const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 64;

type CacheEntry = {
  expiresAt: number;
  body: string;
};

const cache = new Map<string, CacheEntry>();

function touch(key: string, entry: CacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);
}

function evictExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function evictOverflow(): void {
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    cache.delete(oldest);
  }
}

/** Stable cache key from already-validated simulation input. */
export function simulateCacheKey(input: Record<string, unknown>): string {
  const keys = Object.keys(input).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    normalized[key] = input[key];
  }
  return JSON.stringify(normalized);
}

export function getCachedSimulate(key: string): string | null {
  const now = Date.now();
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  touch(key, entry);
  return entry.body;
}

export function setCachedSimulate(key: string, body: string): void {
  const now = Date.now();
  evictExpired(now);
  touch(key, { body, expiresAt: now + CACHE_TTL_MS });
  evictOverflow();
}
