"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useCallback, useEffect, useRef } from "react";

import {
  DEFAULT_SCENE_QUALITY,
  qualityFromFactor,
  type SceneQuality,
} from "./scene-quality";

export type QualityManagerProps = {
  onQualityChange: (quality: SceneQuality) => void;
};

declare global {
  interface Window {
    __AURA_FPS?: number;
    __AURA_QUALITY?: SceneQuality;
  }
}

/**
 * drei PerformanceMonitor with ordered three-layer degradation (PRD 8.2).
 */
export function QualityManager({ onQualityChange }: QualityManagerProps) {
  const factorRef = useRef(1);
  const lastKeyRef = useRef("");

  const publish = useCallback(
    (factor: number, fps: number) => {
      factorRef.current = factor;
      const next = qualityFromFactor(factor, fps);
      const key = `${next.dpr}|${next.particleCount}|${next.bloomEnabled}|${next.fps}`;
      if (typeof window !== "undefined") {
        window.__AURA_FPS = fps;
        window.__AURA_QUALITY = next;
      }
      if (key === lastKeyRef.current) {
        return;
      }
      lastKeyRef.current = key;
      onQualityChange(next);
    },
    [onQualityChange],
  );

  useEffect(() => {
    publish(1, 0);
  }, [publish]);

  return (
    <PerformanceMonitor
      step={0.1}
      factor={1}
      onChange={({ factor, fps }) => {
        publish(factor, fps);
      }}
      onIncline={({ factor, fps }) => {
        publish(factor, fps);
      }}
      onDecline={({ factor, fps }) => {
        publish(factor, fps);
      }}
    />
  );
}

export { DEFAULT_SCENE_QUALITY };
