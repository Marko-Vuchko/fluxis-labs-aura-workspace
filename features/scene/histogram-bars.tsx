"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import type { Histogram } from "@/features/simulation/types";
import { useLanguage } from "@/lib/i18n/language-provider";

import type { SceneQuality } from "./scene-quality";

export type HistogramBarsProps = {
  histogram: Histogram | null;
  quality: SceneQuality;
};

const BAR_COUNT = 30;
const BAR_WIDTH = 0.18;
const BAR_GAP = 0.05;
const MAX_BAR_HEIGHT = 1.25;
const FLOOR_Y = 0.02;
const ROW_Z = 0.35;

function maxCount(counts: readonly number[]): number {
  let peak = 1;
  for (const count of counts) {
    if (count > peak) {
      peak = count;
    }
  }
  return peak;
}

/**
 * Annual profit histogram as 30 glowing floor bars with optional reflection.
 * Always annual - never driven by the month scrubber (PRD FR-4 / FR-5).
 */
export function HistogramBars({ histogram, quality }: HistogramBarsProps) {
  const { t } = useLanguage();

  const bars = useMemo(() => {
    if (!histogram || histogram.counts.length === 0) {
      return null;
    }

    const counts = histogram.counts.slice(0, BAR_COUNT);
    const peak = maxCount(counts);
    const span = counts.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
    const originX = -span / 2;

    return counts.map((count, index) => {
      const height = Math.max(0.04, (count / peak) * MAX_BAR_HEIGHT);
      const x = originX + index * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
      const intensity = 0.35 + (count / peak) * 0.65;
      return { x, height, intensity, count };
    });
  }, [histogram]);

  if (!quality.histogramEnabled || !bars) {
    return null;
  }

  return (
    <group position={[0, FLOOR_Y, ROW_Z]} raycast={() => null}>
      {bars.map((bar, index) => (
        <group key={`hist-bar-${index}`} position={[bar.x, 0, 0]} raycast={() => null}>
          <mesh position={[0, bar.height / 2, 0]} raycast={() => null}>
            <boxGeometry args={[BAR_WIDTH, bar.height, BAR_WIDTH * 0.85]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={1.1 + bar.intensity}
              transparent
              opacity={0.82}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>

          {quality.histogramReflection ? (
            <mesh
              position={[0, -bar.height / 2 - 0.01, 0]}
              scale={[1, -1, 1]}
              raycast={() => null}
            >
              <boxGeometry args={[BAR_WIDTH, bar.height, BAR_WIDTH * 0.85]} />
              <meshBasicMaterial
                color="#22D3EE"
                transparent
                opacity={0.18 + bar.intensity * 0.12}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* Soft table plane under the bars for holographic read. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        raycast={() => null}
      >
        <planeGeometry args={[7.2, 1.2]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      <Html
        position={[0, MAX_BAR_HEIGHT + 0.55, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
        zIndexRange={[30, 10]}
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="rounded border border-primary/40 bg-[#070b14]/88 px-2 py-0.5 font-mono text-[9px] tracking-[0.22em] text-primary uppercase">
            {t("ui.annualBadge")}
          </span>
          <span className="max-w-[14rem] text-[10px] tracking-[0.08em] text-muted-foreground/90">
            {t("ui.annualHistogram")}
          </span>
        </div>
      </Html>
    </group>
  );
}
