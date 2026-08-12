import { interpolate } from "@/lib/i18n/dictionary";

import type { BootAttemptTelemetry } from "@/features/simulation/use-simulation";
import type { HealthResponse } from "@/features/simulation/types";

export type BootLogMessages = {
  attempt: string;
  responseMs: string;
  engineVersion: string;
  numpyWarmup: string;
  firstSimReady: string;
};

export type BootLogInput = {
  attempts: readonly BootAttemptTelemetry[];
  health: HealthResponse | null;
  firstSimReady: boolean;
};

/**
 * Builds boot telemetry lines from measured events only.
 * Missing values produce no line - never invents placeholders.
 */
export function buildBootLogLines(
  input: BootLogInput,
  messages: BootLogMessages,
): string[] {
  const lines: string[] = [];

  for (const entry of input.attempts) {
    lines.push(
      interpolate(messages.attempt, { attempt: entry.attempt }),
    );
    lines.push(
      interpolate(messages.responseMs, { ms: entry.responseMs }),
    );
  }

  if (input.health) {
    lines.push(
      interpolate(messages.engineVersion, {
        version: input.health.engine_version,
      }),
    );
    lines.push(
      interpolate(messages.numpyWarmup, {
        ms: input.health.numpy_warmup_ms,
      }),
    );
  }

  if (input.firstSimReady) {
    lines.push(messages.firstSimReady);
  }

  return lines;
}

/**
 * Progress is milestone-based on real boot phases, not wall-clock time.
 * Attempt count may nudge the bar while waiting for health.
 */
export function computeBootProgress(input: {
  bootAttempt: number;
  health: HealthResponse | null;
  firstSimReady: boolean;
}): number {
  if (input.firstSimReady) {
    return 100;
  }

  if (input.health) {
    return 72;
  }

  if (input.bootAttempt <= 0) {
    return 4;
  }

  // Real attempt events only. Cap below the health milestone.
  const fromAttempts = 10 + Math.min(input.bootAttempt, 12) * 3;
  return Math.min(48, fromAttempts);
}
