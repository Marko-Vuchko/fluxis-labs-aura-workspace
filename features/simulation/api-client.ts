import { z } from "zod";

import type {
  ApiErrorCode,
  ApiResult,
  HealthResponse,
  SimulationInput,
  SimulationOutput,
} from "./types";
import { parseSimulationOutput } from "@/lib/simulation/contract";

const REQUEST_TIMEOUT_MS = 15_000;
const HEALTH_MAX_WAIT_MS = 90_000;
const HEALTH_BASE_DELAY_MS = 1_000;
const HEALTH_MAX_DELAY_MS = 8_000;

const healthResponseSchema = z
  .object({
    status: z.string(),
    engine_version: z.string(),
    uptime_s: z.number().finite(),
    numpy_warmup_ms: z.number().finite(),
  })
  .strict();

function toFailure(
  error: unknown,
  fallback: ApiErrorCode,
): ApiResult<never> {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { ok: false, error: "aborted" };
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
      return {
        ok: false,
        error: "simulate_failed",
        status: response.status,
      };
    }

    const json = await parseJson(response);
    const parsed = parseSimulationOutput(json);
    if (!parsed.success) {
      return { ok: false, error: "invalid_simulate" };
    }

    return { ok: true, data: parsed.data };
  } catch (error) {
    return toFailure(error, "simulate_request");
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
  let lastFailure: ApiResult<never> = { ok: false, error: "health_check" };

  while (Date.now() - startedAt < maxWaitMs) {
    if (options?.signal?.aborted) {
      return { ok: false, error: "aborted" };
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
        lastFailure = { ok: false, error: "invalid_health" };
      } else {
        reportAttempt(false);
        lastFailure = {
          ok: false,
          error: "health_failed",
          status: response.status,
        };
      }
    } catch (error) {
      const failed = toFailure(error, "health_request");
      if (!failed.ok && failed.error === "aborted") {
        return failed;
      }
      reportAttempt(false);
      lastFailure = failed;
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
      const failed = toFailure(error, "health_request");
      if (!failed.ok && failed.error === "aborted") {
        return failed;
      }
      break;
    }
    delayMs = Math.min(delayMs * 2, HEALTH_MAX_DELAY_MS);
  }

  return lastFailure;
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
