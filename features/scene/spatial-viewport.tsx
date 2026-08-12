"use client";

import {
  Component,
  type ReactNode,
  useCallback,
  useState,
} from "react";

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
  /** Dim the 3D canvas when the last payload is retained after a link failure. */
  stale?: boolean;
};

type SceneCrashBoundaryProps = {
  children: ReactNode;
  onCrash: () => void;
};

type SceneCrashBoundaryState = {
  crashed: boolean;
};

/**
 * Catches R3F/Three.js render failures (including null context attributes)
 * and routes them to the 2D fallback instead of the panel error shell.
 */
class SceneCrashBoundary extends Component<
  SceneCrashBoundaryProps,
  SceneCrashBoundaryState
> {
  state: SceneCrashBoundaryState = { crashed: false };

  static getDerivedStateFromError(): SceneCrashBoundaryState {
    return { crashed: true };
  }

  componentDidCatch(): void {
    this.props.onCrash();
  }

  render(): ReactNode {
    if (this.state.crashed) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * WebGL gate + context-loss recovery around the R3F canvas.
 * Detects support before mounting the scene so unsupported GPUs never crash.
 *
 * Accessibility note: the 3D canvas is pointer-first (orbit, hover, click-to-lock).
 * That is intentional. Keyboard and screen-reader users rely on the HUD
 * (Control Deck, KPI/Risk, Copilot, month scrubber) and on the 2D
 * SceneFallback when WebGL is unavailable. A locked node detail card is a
 * focus-trapped dialog with Escape to close.
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
  stale = false,
}: SpatialViewportProps) {
  const [support, setSupport] = useState(() => detectWebGLSupport());
  const [contextLost, setContextLost] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  const handleRetry = useCallback(() => {
    setSupport(detectWebGLSupport());
    setContextLost(false);
    setSceneFailed(false);
    setRemountKey((value) => value + 1);
  }, []);

  const showFallback =
    forceFallback || !support || contextLost || sceneFailed;

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
      <SceneCrashBoundary
        key={remountKey}
        onCrash={() => {
          setSceneFailed(true);
        }}
      >
        <SpatialCanvas
          nodes={nodes}
          month={month}
          months={months}
          histogram={histogram}
          selectedMonth={selectedMonth}
          currency={currency}
          reduceMotion={reduceMotion}
          stale={stale}
          className="h-full w-full"
          onContextLost={() => {
            setContextLost(true);
          }}
          onContextRestored={() => {
            setContextLost(false);
          }}
        />
      </SceneCrashBoundary>
    </div>
  );
}
