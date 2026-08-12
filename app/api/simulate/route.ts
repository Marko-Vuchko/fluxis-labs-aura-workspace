import { checkBotId } from "botid/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;

const percentileTripleSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const nodeSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const simulationInputSchema = z
  .object({
    ad_spend: z.number().finite().min(0).max(50_000),
    price: z.number().finite().min(10).max(2_000),
    team_size: z.number().int().min(1).max(50),
    opex: z.number().finite().min(0).max(100_000),
    cash_reserve: z.number().finite().min(0).max(500_000),
    seed: z.number().int().optional(),
  })
  .strict();

const simulationOutputSchema = z
  .object({
    meta: z
      .object({
        engine_version: z.string(),
        iterations: z.number().int(),
        months: z.number().int(),
        seed: z.number().int(),
        compute_ms: z.number().finite(),
        currency: z.string(),
      })
      .strict(),
    annual: z
      .object({
        revenue: percentileTripleSchema,
        profit: percentileTripleSchema,
        margin: percentileTripleSchema,
        ending_cash: percentileTripleSchema,
      })
      .strict(),
    months: z
      .array(
        z
          .object({
            index: z.number().int().min(1).max(12),
            revenue: percentileTripleSchema,
            profit: percentileTripleSchema,
            margin: z.number().finite(),
            customers: z.number().finite(),
            churn_rate: z.number().finite(),
            capacity_used: z.number().finite(),
            cash: z.number().finite(),
            runway_months: z.number().finite().nullable(),
            risk: z
              .object({
                score: z.number().finite(),
                components: z.tuple([
                  z.number().finite(),
                  z.number().finite(),
                  z.number().finite(),
                  z.number().finite(),
                ]),
              })
              .strict(),
            nodes: z.array(nodeSchema).length(7),
          })
          .strict(),
      )
      .length(12),
    histogram: z
      .object({
        metric: z.literal("annual_profit"),
        bin_edges: z.array(z.number().finite()).length(31),
        counts: z.array(z.number().int()).length(30),
      })
      .strict(),
    sensitivity: z.array(
      z
        .object({
          param: z.string(),
          coefficient: z.number().finite(),
          rank: z.number().int(),
        })
        .strict(),
    ),
    insights: z
      .array(
        z
          .object({
            code: z.string(),
            severity: z.enum(["info", "warning", "critical"]),
            params: z.record(z.string(), z.number()),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();

export type SimulationInput = z.infer<typeof simulationInputSchema>;
export type SimulationOutput = z.infer<typeof simulationOutputSchema>;

function isSameOriginRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite !== "same-origin") {
    return false;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const expectedHost = host.toLowerCase();
    const originHost = originUrl.host.toLowerCase();
    return originHost === expectedHost;
  } catch {
    return false;
  }
}

function genericError(status: number): NextResponse {
  return NextResponse.json({ error: "Request failed" }, { status });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json(
      { error: "Invalid input", details: input.error.flatten() },
      { status: 400 },
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

    const output = simulationOutputSchema.safeParse(upstreamJson);
    if (!output.success) {
      console.error(
        "simulate upstream schema mismatch",
        output.error.flatten(),
      );
      return genericError(502);
    }

    return NextResponse.json(output.data);
  } catch (error) {
    console.error("simulate upstream error", error);
    return genericError(502);
  } finally {
    clearTimeout(timeout);
  }
}
