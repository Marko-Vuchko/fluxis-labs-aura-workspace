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
import type {
  HealthResponse,
  SimulationInput,
  SimulationOutput,
  SimulationParamKey,
  SimulationStatus,
} from "./types";

const DEBOUNCE_MS = 120;

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
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [bootAttempts, setBootAttempts] = useState<BootAttemptTelemetry[]>(
    [],
  );
  const [, startTransition] = useTransition();

  const paramsRef = useRef(params);
  const resultRef = useRef(result);
  const statusRef = useRef(status);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const bootControllerRef = useRef<AbortController | null>(null);
  const requestSerialRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

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

  const runSimulate = useCallback(async () => {
    clearDebounce();

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
      startTransition(() => {
        setResult(response.data);
        setStatus("ready");
        setError(null);
      });
      return;
    }

    if (response.error === "Request aborted") {
      return;
    }

    setError(response.error);
    setStatus(resultRef.current ? "stale" : "error");
  }, [clearDebounce]);

  const queueSimulate = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void runSimulate();
    }, DEBOUNCE_MS);
  }, [clearDebounce, runSimulate]);

  const commitSimulate = useCallback(() => {
    clearDebounce();
    void runSimulate();
  }, [clearDebounce, runSimulate]);

  const boot = useCallback(async () => {
    // Yield so the mount effect does not call setState synchronously.
    await Promise.resolve();
    if (!mountedRef.current) {
      return;
    }

    bootControllerRef.current?.abort();
    requestControllerRef.current?.abort();
    clearDebounce();

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
      setError(healthResult.error);
      setStatus(resultRef.current ? "stale" : "error");
      return;
    }

    setHealth(healthResult.data);
    await runSimulate();
  }, [clearDebounce, runSimulate]);

  useEffect(() => {
    mountedRef.current = true;
    void boot();

    return () => {
      mountedRef.current = false;
      clearDebounce();
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
    setSelectedMonthState(clampMonth(month));
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
    const seed = Math.floor(Math.random() * 2_147_483_647);
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
  };
}

export { DEFAULT_PARAMS, FIXED_SEED };
