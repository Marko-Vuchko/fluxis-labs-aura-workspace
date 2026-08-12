"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

import type { NodeId, NodeState } from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";

export const NODE_LERP_MS = 400;

/** Python lays out nodes in roughly unit space; scale for a readable canvas. */
export const SCENE_POSITION_SCALE = 4.5;

export type NodePositionsRef = MutableRefObject<THREE.Vector3[]>;

/** Ring order from PRD 5.5 (clockwise from angle 0). Profit is center/elevated. */
const RING_ORDER = [
  "marketing",
  "sales",
  "support",
  "churn",
  "operations",
  "cash_runway",
] as const satisfies readonly NodeId[];

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - (1 - clamped) ** 3;
}

function fallbackPosition(id: NodeId): THREE.Vector3 {
  if (id === "profit") {
    return new THREE.Vector3(0, 2.4, 0);
  }
  const ringIndex = RING_ORDER.indexOf(
    id as (typeof RING_ORDER)[number],
  );
  const angle = ((ringIndex < 0 ? 0 : ringIndex) * 60 * Math.PI) / 180;
  const radius = 3.2;
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius,
  );
}

/**
 * Smoothly interpolates all seven node positions toward Python targets.
 * Shared so links and particles stay locked to the same frame positions.
 */
export function useNodePositions(
  nodes: readonly NodeState[] | null,
): NodePositionsRef {
  const positions = useMemo(
    () => NODE_ORDER.map((id) => fallbackPosition(id)),
    [],
  );
  const positionsRef = useRef(positions);

  const fromRef = useRef(positions.map((p) => p.clone()));
  const toRef = useRef(positions.map((p) => p.clone()));
  const startMsRef = useRef(0);
  const animatingRef = useRef(false);
  const targetKeyRef = useRef("");

  useFrame(({ clock }) => {
    if (!nodes || nodes.length !== NODE_ORDER.length) {
      return;
    }

    const key = nodes
      .map((n) => `${n[1].toFixed(3)},${n[2].toFixed(3)},${n[3].toFixed(3)}`)
      .join("|");

    if (key !== targetKeyRef.current) {
      targetKeyRef.current = key;
      for (let i = 0; i < NODE_ORDER.length; i += 1) {
        fromRef.current[i]!.copy(positionsRef.current[i]!);
        const state = nodes[i]!;
        toRef.current[i]!.set(
          state[1] * SCENE_POSITION_SCALE,
          state[2] * SCENE_POSITION_SCALE,
          state[3] * SCENE_POSITION_SCALE,
        );
      }
      startMsRef.current = clock.elapsedTime * 1000;
      animatingRef.current = true;
    }

    if (!animatingRef.current) {
      return;
    }

    const elapsed = clock.elapsedTime * 1000 - startMsRef.current;
    const t = easeOutCubic(elapsed / NODE_LERP_MS);

    for (let i = 0; i < NODE_ORDER.length; i += 1) {
      positionsRef.current[i]!.lerpVectors(
        fromRef.current[i]!,
        toRef.current[i]!,
        t,
      );
    }

    if (t >= 1) {
      animatingRef.current = false;
    }
  });

  return positionsRef;
}
