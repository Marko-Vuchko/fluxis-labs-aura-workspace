"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { getHealth, postSimulate } from "./api-client";
import {
  DEFAULT_MONTH,
  DEFAULT_PARAMS,
  FIXED_SEED,
  createDefaultInput,
} from "./defaults";
import type { PresetId } from "./presets";
import { getPreset } from "./presets";
import type { ApiErrorCode } from "@/lib/i18n/api-errors";
import { parseShareQuery, replaceShareQuery } from "@/lib/share/query";
import { SEED_MAX } from "@/lib/simulation/contract";
import type {
  ApiFailure,
  HealthResponse,
  SimulationInput,
  SimulationOutput,
  SimulationParamKey,
  SimulationStatus,
} from "./types";

export type SimulationError = {
  error: ApiErrorCode;
  status?: number;
};

const DEBOUNCE_MS = 120;
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 15_000;

function isNonRetryableFailure(failure: ApiFailure): boolean {
  if (failure.error === "invalid_simulate") {
    return true;
  }
  const status = failure.status;
  if (status === undefined) {
    return false;
  }
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return true;
  }
  return false;
}

export type BootAttemptTelemetry = {
  attempt: number;
  responseMs: number;
  ok: boolean;
};

export type UseSimulationReturn = {
  params: SimulationInput;
  selectedMonth: number;
  result: SimulationOutput | null;
  health: HealthResponse | null;
  status: SimulationStatus;
  error: SimulationError | null;
  bootAttempt: number;
  bootAttempts: readonly BootAttemptTelemetry[];
  setParam: (key: SimulationParamKey, value: number) => void;
  setParams: (next: Partial<Omit<SimulationInput, "seed">>) => void;
  /** Debounced path used while dragging a slider. */
  queueSimulate: () => void;
  /** Mandatory final request on pointer/keyboard release or after preset animation. */
  commitSimulate: () => void;
  setSelectedMonth: (month: number) => void;
  /** Writes preset params only; caller commits after the 600 ms slider animation. */
  applyPreset: (id: PresetId) => void;
  reseed: () => void;
  resetSeed: () => void;
  retryBoot: () => void;
  /** Write sliders + month + seed to the URL. Call on commit, never while dragging. */
  syncShareUrl: () => void;
};

function clampMonth(month: number): number {
  if (month < 1) return 1;
  if (month > 12) return 12;
  return Math.round(month);
}

export function useSimulation(): UseSimulationReturn {
  const [params, setParamsState] = useState<SimulationInput>(() =>
    createDefaultInput(FIXED_SEED),
  );
  const [selectedMonth, setSelectedMonthState] = useState(DEFAULT_MONTH);
  const [result, setResult] = useState<SimulationOutput | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [status, setStatus] = useState<SimulationStatus>("booting");
  const [error, setError] = useState<SimulationError | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [bootAttempts, setBootAttempts] = useState<BootAttemptTelemetry[]>(
    [],
  );
  const [, startTransition] = useTransition();

  const paramsRef = useRef(params);
  const selectedMonthRef = useRef(selectedMonth);
  const resultRef = useRef(result);
  const statusRef = useRef(status);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const bootControllerRef = useRef<AbortController | null>(null);
  const requestSerialRef = useRef(0);
  const mountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(RETRY_BASE_MS);
  const runSimulateRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    selectedMonthRef.current = selectedMonth;
  }, [selectedMonth]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleStaleRetry = useCallback(() => {
    clearRetryTimer();
    const delay = retryDelayRef.current;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (!mountedRef.current) {
        return;
      }
      if (statusRef.current === "stale") {
        void runSimulateRef.current();
      }
    }, delay);
    retryDelayRef.current = Math.min(delay * 2, RETRY_MAX_MS);
  }, [clearRetryTimer]);

  const runSimulate = useCallback(async () => {
    clearDebounce();
    clearRetryTimer();

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const serial = ++requestSerialRef.current;

    if (statusRef.current !== "booting") {
      setStatus("simulating");
    }
    setError(null);

    const response = await postSimulate(paramsRef.current, {
      signal: controller.signal,
    });

    if (!mountedRef.current || serial !== requestSerialRef.current) {
      return;
    }

    if (response.ok) {
      retryDelayRef.current = RETRY_BASE_MS;
      startTransition(() => {
        setResult(response.data);
        setStatus("ready");
        setError(null);
      });
      return;
    }

    if (response.error === "aborted") {
      return;
    }

    setError({
      error: response.error,
      status: response.status,
    });
    const nextStatus = resultRef.current ? "stale" : "error";
    setStatus(nextStatus);
    if (nextStatus === "stale" && !isNonRetryableFailure(response)) {
      scheduleStaleRetry();
    }
  }, [clearDebounce, clearRetryTimer, scheduleStaleRetry]);

  useEffect(() => {
    runSimulateRef.current = runSimulate;
  }, [runSimulate]);

  const queueSimulate = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void runSimulate();
    }, DEBOUNCE_MS);
  }, [clearDebounce, runSimulate]);

  const syncShareUrl = useCallback(() => {
    replaceShareQuery({
      params: paramsRef.current,
      month: selectedMonthRef.current,
    });
  }, []);

  const commitSimulate = useCallback(() => {
    clearDebounce();
    retryDelayRef.current = RETRY_BASE_MS;
    syncShareUrl();
    void runSimulate();
  }, [clearDebounce, runSimulate, syncShareUrl]);

  const boot = useCallback(async () => {
    // Yield so the mount effect does not call setState synchronously.
    await Promise.resolve();
    if (!mountedRef.current) {
      return;
    }

    const shared = parseShareQuery(window.location.search);
    paramsRef.current = shared.params;
    selectedMonthRef.current = shared.month;
    setParamsState(shared.params);
    setSelectedMonthState(shared.month);

    bootControllerRef.current?.abort();
    requestControllerRef.current?.abort();
    clearDebounce();
    clearRetryTimer();
    retryDelayRef.current = RETRY_BASE_MS;

    const controller = new AbortController();
    bootControllerRef.current = controller;

    setStatus("booting");
    setError(null);
    setBootAttempt(0);
    setBootAttempts([]);
    setHealth(null);

    const healthResult = await getHealth({
      signal: controller.signal,
      onAttempt: (attempt) => {
        if (mountedRef.current) {
          setBootAttempt(attempt);
        }
      },
      onAttemptResult: (result) => {
        if (mountedRef.current) {
          setBootAttempts((prev) => [...prev, result]);
        }
      },
    });

    if (!mountedRef.current || controller.signal.aborted) {
      return;
    }

    if (!healthResult.ok) {
      setError({
        error: healthResult.error,
        status: healthResult.status,
      });
      setStatus(resultRef.current ? "stale" : "error");
      return;
    }

    setHealth(healthResult.data);
    await runSimulate();
  }, [clearDebounce, clearRetryTimer, runSimulate]);

  useEffect(() => {
    mountedRef.current = true;
    void boot();

    return () => {
      mountedRef.current = false;
      clearDebounce();
      clearRetryTimer();
      bootControllerRef.current?.abort();
      requestControllerRef.current?.abort();
    };
    // Boot once on mount; retryBoot invokes boot explicitly later.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only boot
  }, []);

  const setParam = useCallback(
    (key: SimulationParamKey, value: number) => {
      const next = { ...paramsRef.current, [key]: value };
      paramsRef.current = next;
      setParamsState(next);
      queueSimulate();
    },
    [queueSimulate],
  );

  const setParams = useCallback(
    (next: Partial<Omit<SimulationInput, "seed">>) => {
      const merged = { ...paramsRef.current, ...next };
      paramsRef.current = merged;
      setParamsState(merged);
      queueSimulate();
    },
    [queueSimulate],
  );

  const setSelectedMonth = useCallback((month: number) => {
    const next = clampMonth(month);
    selectedMonthRef.current = next;
    setSelectedMonthState(next);
  }, []);

  /**
   * Writes preset params into state without requesting.
   * Control Deck animates sliders for 600 ms, then calls commitSimulate once.
   */
  const applyPreset = useCallback((id: PresetId) => {
    const preset = getPreset(id);
    const merged = { ...paramsRef.current, ...preset.params };
    paramsRef.current = merged;
    setParamsState(merged);
  }, []);

  const reseed = useCallback(() => {
    const seed = Math.floor(Math.random() * SEED_MAX);
    const merged = { ...paramsRef.current, seed };
    paramsRef.current = merged;
    setParamsState(merged);
    commitSimulate();
  }, [commitSimulate]);

  const resetSeed = useCallback(() => {
    const merged = { ...paramsRef.current, seed: FIXED_SEED };
    paramsRef.current = merged;
    setParamsState(merged);
    commitSimulate();
  }, [commitSimulate]);

  const retryBoot = useCallback(() => {
    void boot();
  }, [boot]);

  return {
    params,
    selectedMonth,
    result,
    health,
    status,
    error,
    bootAttempt,
    bootAttempts,
    setParam,
    setParams,
    queueSimulate,
    commitSimulate,
    setSelectedMonth,
    applyPreset,
    reseed,
    resetSeed,
    retryBoot,
    syncShareUrl,
  };
}

export { DEFAULT_PARAMS, FIXED_SEED };
