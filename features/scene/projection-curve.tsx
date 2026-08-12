"use client";

import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import type { MonthSnapshot } from "@/features/simulation/types";
import { formatCompact } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";

import type { SceneQuality } from "./scene-quality";

export type ProjectionCurveProps = {
  months: readonly MonthSnapshot[] | null;
  selectedMonth: number;
  quality: SceneQuality;
};

const CURVE_WIDTH = 6.8;
const CURVE_BASE_Y = 3.85;
const CURVE_Z = -2.85;
const CURVE_AMPLITUDE = 1.1;

function profitExtents(months: readonly MonthSnapshot[]): {
  min: number;
  max: number;
} {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const month of months) {
    const p50 = month.profit[1];
    if (p50 < min) min = p50;
    if (p50 > max) max = p50;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (max === min) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

function pointForMonth(
  monthIndex: number,
  profitP50: number,
  extents: { min: number; max: number },
): THREE.Vector3 {
  const t = (monthIndex - 1) / 11;
  const x = -CURVE_WIDTH / 2 + t * CURVE_WIDTH;
  const norm = (profitP50 - extents.min) / (extents.max - extents.min);
  const y = CURVE_BASE_Y + (norm - 0.5) * 2 * CURVE_AMPLITUDE;
  return new THREE.Vector3(x, y, CURVE_Z);
}

/**
 * Floating 12-month profit projection curve. Marker tracks HUD scrubber month.
 * Y positions come from Python month profit p50 values (display scaling only).
 */
export function ProjectionCurve({
  months,
  selectedMonth,
  quality,
}: ProjectionCurveProps) {
  const { t } = useLanguage();

  const layout = useMemo(() => {
    if (!months || months.length === 0) {
      return null;
    }

    const ordered = [...months].sort((a, b) => a.index - b.index);
    const extents = profitExtents(ordered);
    const points = ordered.map((month) =>
      pointForMonth(month.index, month.profit[1], extents),
    );

    const selected =
      ordered.find((month) => month.index === selectedMonth) ??
      ordered[ordered.length - 1]!;
    const marker = pointForMonth(
      selected.index,
      selected.profit[1],
      extents,
    );

    return {
      points,
      marker,
      selectedProfit: selected.profit[1],
      selectedIndex: selected.index,
    };
  }, [months, selectedMonth]);

  if (!quality.projectionEnabled || !layout) {
    return null;
  }

  const lineColor = quality.projectionGlow ? "#A855F7" : "#7c3aed";
  const lineWidth = quality.projectionGlow ? 2.4 : 1.6;

  return (
    <group raycast={() => null}>
      <Line
        points={layout.points}
        color={lineColor}
        lineWidth={lineWidth}
        transparent
        opacity={quality.projectionGlow ? 0.95 : 0.7}
        raycast={() => null}
      />

      {/* Scrubber-linked month marker */}
      <mesh position={layout.marker} raycast={() => null}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#FBBF24"
          emissive="#FBBF24"
          emissiveIntensity={quality.projectionGlow ? 2.4 : 1.2}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      <Html
        position={[
          layout.marker.x,
          layout.marker.y + 0.42,
          layout.marker.z,
        ]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
        zIndexRange={[35, 15]}
      >
        <div className="rounded border border-amber-300/35 bg-[#070b14]/88 px-2 py-1 text-center shadow-[0_0_18px_-10px_rgb(251_191_36_/_0.7)] backdrop-blur-sm">
          <p className="font-mono text-[9px] tracking-[0.16em] text-amber-200/90 uppercase">
            {t("ui.month")} {layout.selectedIndex}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-foreground">
            {formatCompact(layout.selectedProfit)}
          </p>
        </div>
      </Html>

      <Html
        position={[-CURVE_WIDTH / 2, CURVE_BASE_Y + CURVE_AMPLITUDE + 0.55, CURVE_Z]}
        center={false}
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
        zIndexRange={[28, 8]}
      >
        <p className="whitespace-nowrap text-[10px] tracking-[0.12em] text-violet-200/80 uppercase">
          {t("ui.projectionCurve")}
        </p>
      </Html>
    </group>
  );
}
