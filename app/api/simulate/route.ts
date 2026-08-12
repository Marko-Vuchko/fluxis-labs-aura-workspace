import { checkBotId } from "botid/server";
import { NextRequest, NextResponse } from "next/server";

import {
  checkEdgeRateLimit,
  getClientIp,
  isSameOriginRequest,
} from "@/lib/api/guards";
import {
  getCachedSimulate,
  setCachedSimulate,
  simulateCacheKey,
} from "@/lib/api/simulate-cache";
import { getServerEnv } from "@/lib/env";
import {
  parseSimulationOutput,
  simulationInputSchema,
} from "@/lib/simulation/contract";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;

export type {
  SimulationInput,
  SimulationOutput,
} from "@/lib/simulation/contract";

function genericError(status: number): NextResponse {
  return NextResponse.json({ error: "Request failed" }, { status });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = checkEdgeRateLimit(`simulate:${getClientIp(request)}`);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  const verification = await checkBotId({
    advancedOptions: {
      checkLevel: "basic",
    },
  });

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (
      !Number.isFinite(contentLength) ||
      contentLength < 0 ||
      contentLength > MAX_BODY_BYTES
    ) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("simulate body read error", error);
    return genericError(400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = simulationInputSchema.safeParse(jsonBody);
  if (!input.success) {
    console.error("simulate input validation failed", input.error.flatten());
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const cacheKey = simulateCacheKey(input.data as Record<string, unknown>);
  const cachedBody = getCachedSimulate(cacheKey);
  if (cachedBody !== null) {
    return new NextResponse(cachedBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Aura-Cache": "HIT",
      },
    });
  }

  const { AURA_API_URL, AURA_API_SECRET } = getServerEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${AURA_API_URL}/api/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aura-Key": AURA_API_SECRET,
        Accept: "application/json",
      },
      body: JSON.stringify(input.data),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });

    if (!upstream.ok) {
      const upstreamText = await upstream.text();
      console.error(
        "simulate upstream status",
        upstream.status,
        upstreamText.slice(0, 500),
      );
      return genericError(502);
    }

    let upstreamJson: unknown;
    try {
      upstreamJson = (await upstream.json()) as unknown;
    } catch (error) {
      console.error("simulate upstream json parse error", error);
      return genericError(502);
    }

    const output = parseSimulationOutput(upstreamJson);
    if (!output.success) {
      console.error(
        "simulate upstream schema mismatch",
        output.error.flatten(),
      );
      return genericError(502);
    }

    const body = JSON.stringify(output.data);
    setCachedSimulate(cacheKey, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Aura-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("simulate upstream error", error);
    return genericError(502);
  } finally {
    clearTimeout(timeout);
  }
}
