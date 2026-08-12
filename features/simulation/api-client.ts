import { z } from "zod";

import type {
  ApiResult,
  HealthResponse,
  SimulationInput,
  SimulationOutput,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const HEALTH_MAX_WAIT_MS = 90_000;
const HEALTH_BASE_DELAY_MS = 1_000;
const HEALTH_MAX_DELAY_MS = 8_000;

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
        clients_per_head: z.number().finite().optional(),
        cost_per_head: z.number().finite().optional(),
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

const healthResponseSchema = z
  .object({
    status: z.string(),
    engine_version: z.string(),
    uptime_s: z.number().finite(),
    numpy_warmup_ms: z.number().finite(),
  })
  .strict();

function toFailure(error: unknown, fallback: string): ApiResult<never> {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { ok: false, error: "Request aborted" };
  }
  if (error instanceof Error && error.message) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

function mergeSignals(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (external) {
        external.removeEventListener("abort", onExternalAbort);
      }
    },
  };
}

async function parseJson(response: Response): Promise<unknown> {
  return (await response.json()) as unknown;
}

/**
 * Same-origin POST /api/simulate.
 * Never throws - always returns a discriminated ApiResult.
 */
export async function postSimulate(
  input: SimulationInput,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<ApiResult<SimulationOutput>> {
  const { signal, cleanup } = mergeSignals(
    options?.signal,
    options?.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: `Simulate failed (${response.status})` };
    }

    const json = await parseJson(response);
    const parsed = simulationOutputSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: "Invalid simulate response" };
    }

    return { ok: true, data: parsed.data };
  } catch (error) {
    return toFailure(error, "Simulate request failed");
  } finally {
    cleanup();
  }
}

export type HealthAttemptResult = {
  attempt: number;
  responseMs: number;
  ok: boolean;
};

/**
 * Same-origin GET /api/health with exponential backoff for Render cold start.
 * Never throws - always returns a discriminated ApiResult.
 */
export async function getHealth(
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
    maxWaitMs?: number;
    onAttempt?: (attempt: number) => void;
    onAttemptResult?: (result: HealthAttemptResult) => void;
  },
): Promise<ApiResult<HealthResponse>> {
  const maxWaitMs = options?.maxWaitMs ?? HEALTH_MAX_WAIT_MS;
  const startedAt = Date.now();
  let attempt = 0;
  let delayMs = HEALTH_BASE_DELAY_MS;
  let lastError = "Health check failed";

  while (Date.now() - startedAt < maxWaitMs) {
    if (options?.signal?.aborted) {
      return { ok: false, error: "Request aborted" };
    }

    attempt += 1;
    options?.onAttempt?.(attempt);

    const { signal, cleanup } = mergeSignals(
      options?.signal,
      options?.timeoutMs ?? REQUEST_TIMEOUT_MS,
    );

    const attemptStartedAt = Date.now();
    let reportedResult = false;

    const reportAttempt = (ok: boolean) => {
      if (reportedResult) {
        return;
      }
      reportedResult = true;
      options?.onAttemptResult?.({
        attempt,
        responseMs: Date.now() - attemptStartedAt,
        ok,
      });
    };

    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
        cache: "no-store",
      });

      if (response.ok) {
        const json = await parseJson(response);
        const parsed = healthResponseSchema.safeParse(json);
        if (parsed.success) {
          reportAttempt(true);
          return { ok: true, data: parsed.data };
        }
        reportAttempt(false);
        lastError = "Invalid health response";
      } else {
        reportAttempt(false);
        lastError = `Health failed (${response.status})`;
      }
    } catch (error) {
      const failed = toFailure(error, "Health request failed");
      if (!failed.ok && failed.error === "Request aborted") {
        return failed;
      }
      reportAttempt(false);
      if (!failed.ok) {
        lastError = failed.error;
      }
    } finally {
      cleanup();
      if (!reportedResult && !options?.signal?.aborted) {
        reportAttempt(false);
      }
    }

    const remaining = maxWaitMs - (Date.now() - startedAt);
    if (remaining <= 0) {
      break;
    }

    const waitMs = Math.min(delayMs, remaining, HEALTH_MAX_DELAY_MS);
    try {
      await sleep(waitMs, options?.signal);
    } catch (error) {
      const failed = toFailure(error, "Health request failed");
      if (!failed.ok && failed.error === "Request aborted") {
        return failed;
      }
      break;
    }
    delayMs = Math.min(delayMs * 2, HEALTH_MAX_DELAY_MS);
  }

  return { ok: false, error: lastError };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
