"use client";

import { useEffect, useRef } from "react";

import type { NodeState } from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";
import {
  healthToBand,
  playNodeAlert,
  type HealthBand,
} from "@/lib/audio/soundscape";

/**
 * Plays alert tones when any node newly enters warning or critical health.
 * Stable -> warning / critical and warning -> critical all fire.
 */
export function useNodeHealthAlerts(
  nodes: readonly NodeState[] | null,
  enabled: boolean,
): void {
  const previousRef = useRef<HealthBand[] | null>(null);

  useEffect(() => {
    if (!enabled || !nodes || nodes.length !== NODE_ORDER.length) {
      return;
    }

    const nextBands = nodes.map((node) => healthToBand(node[0]));
    const previous = previousRef.current;

    if (previous && previous.length === nextBands.length) {
      for (let i = 0; i < nextBands.length; i += 1) {
        const prev = previous[i];
        const next = nextBands[i];
        if (!prev || !next || prev === next) {
          continue;
        }
        if (next === "critical" && prev !== "critical") {
          playNodeAlert("critical");
          break;
        }
        if (next === "warning" && prev === "stable") {
          playNodeAlert("warning");
          break;
        }
      }
    }

    previousRef.current = nextBands;
  }, [nodes, enabled]);
}
