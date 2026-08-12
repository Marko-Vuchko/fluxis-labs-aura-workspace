import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  checkEdgeRateLimit,
  getClientIp,
  isSameOriginRequest,
} from "@/lib/api/guards";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 10_000;
/** Successful health payloads are short-lived; failures are never cached. */
const HEALTH_CACHE_TTL_MS = 5_000;

const healthResponseSchema = z
  .object({
    status: z.string(),
    engine_version: z.string(),
    uptime_s: z.number().finite(),
    numpy_warmup_ms: z.number().finite(),
  })
  .strict();

type CachedHealth = {
  expiresAt: number;
  body: string;
};

let healthCache: CachedHealth | null = null;

function genericError(status: number): NextResponse {
  return NextResponse.json({ error: "Health check failed" }, { status });
}

/**
 * Same-origin BFF for upstream GET /health.
 * Upstream health is public - no secret header. Soft rate limit + short success cache.
 */
export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = checkEdgeRateLimit(`health:${getClientIp(request)}`, {
    limit: 120,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  const now = Date.now();
  if (healthCache && healthCache.expiresAt > now) {
    return new NextResponse(healthCache.body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=5",
        "X-Aura-Cache": "HIT",
      },
    });
  }

  const { AURA_API_URL } = getServerEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${AURA_API_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });

    if (!upstream.ok) {
      console.error("health upstream status", upstream.status);
      return genericError(502);
    }

    let upstreamJson: unknown;
    try {
      upstreamJson = (await upstream.json()) as unknown;
    } catch (error) {
      console.error("health upstream json parse error", error);
      return genericError(502);
    }

    const parsed = healthResponseSchema.safeParse(upstreamJson);
    if (!parsed.success) {
      console.error("health upstream schema mismatch", parsed.error.flatten());
      return genericError(502);
    }

    const body = JSON.stringify(parsed.data);
    healthCache = {
      body,
      expiresAt: Date.now() + HEALTH_CACHE_TTL_MS,
    };

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=5",
        "X-Aura-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("health upstream error", error);
    return genericError(502);
  } finally {
    clearTimeout(timeout);
  }
}
