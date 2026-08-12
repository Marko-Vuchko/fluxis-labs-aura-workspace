import {
  translate,
  type DictionaryKey,
  type Locale,
} from "./dictionary";

/** Stable client error codes - localize at the UI boundary. */
export type ApiErrorCode =
  | "aborted"
  | "simulate_failed"
  | "invalid_simulate"
  | "simulate_request"
  | "health_check"
  | "invalid_health"
  | "health_failed"
  | "health_request";

const ERROR_KEY_BY_CODE: Record<ApiErrorCode, DictionaryKey> = {
  aborted: "errors.aborted",
  simulate_failed: "errors.simulateFailed",
  invalid_simulate: "errors.invalidSimulate",
  simulate_request: "errors.simulateRequest",
  health_check: "errors.healthCheck",
  invalid_health: "errors.invalidHealth",
  health_failed: "errors.healthFailed",
  health_request: "errors.healthRequest",
};

export type ApiErrorLike = {
  error: ApiErrorCode;
  status?: number;
};

/**
 * Maps stable API error codes to localized copy.
 * Status-bearing codes interpolate {status}.
 */
export function localizeApiError(
  locale: Locale,
  failure: ApiErrorLike,
): string {
  const key = ERROR_KEY_BY_CODE[failure.error];
  if (
    failure.error === "simulate_failed" ||
    failure.error === "health_failed"
  ) {
    return translate(locale, key, {
      status: failure.status ?? "?",
    });
  }
  return translate(locale, key);
}
