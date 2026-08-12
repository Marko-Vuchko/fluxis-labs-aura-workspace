"use client";

import { useCallback, useState } from "react";

import type {
  AnnualSummary,
  Histogram,
  MonthSnapshot,
  NodeState,
} from "@/features/simulation/types";

import { SceneFallback } from "./scene-fallback";
import { SpatialCanvas } from "./spatial-canvas";
import { detectWebGLSupport } from "./webgl-support";

export type SpatialViewportProps = {
  nodes: readonly NodeState[] | null;
  month: MonthSnapshot | null;
  months?: readonly MonthSnapshot[] | null;
  histogram?: Histogram | null;
  annual?: AnnualSummary | null;
  selectedMonth?: number;
  currency?: string;
  reduceMotion?: boolean;
  className?: string;
  /** Dev/test override: force the 2D fallback path. */
  forceFallback?: boolean;
};

/**
 * WebGL gate + context-loss recovery around the R3F canvas.
 * Detects support before mounting the scene so unsupported GPUs never crash.
 */
export function SpatialViewport({
  nodes,
  month,
  months = null,
  histogram = null,
  annual = null,
  selectedMonth = 12,
  currency = "USD",
  reduceMotion = false,
  className,
  forceFallback = false,
}: SpatialViewportProps) {
  const [support, setSupport] = useState(() =>
    typeof window === "undefined" ? true : detectWebGLSupport(),
  );
  const [contextLost, setContextLost] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  const handleRetry = useCallback(() => {
    setSupport(detectWebGLSupport());
    setContextLost(false);
    setRemountKey((value) => value + 1);
  }, []);

  const showFallback = forceFallback || !support || contextLost;

  if (showFallback) {
    return (
      <div className={className} data-tour="scene">
        <SceneFallback
          month={month}
          months={months}
          histogram={histogram}
          annual={annual}
          currency={currency}
          reason={contextLost ? "context-lost" : "unsupported"}
          onRetry={handleRetry}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={className} data-tour="scene">
      <SpatialCanvas
        key={remountKey}
        nodes={nodes}
        month={month}
        months={months}
        histogram={histogram}
        selectedMonth={selectedMonth}
        currency={currency}
        reduceMotion={reduceMotion}
        className="h-full w-full"
        onContextLost={() => {
          setContextLost(true);
        }}
        onContextRestored={() => {
          setContextLost(false);
        }}
      />
    </div>
  );
}
