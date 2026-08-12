/**
 * Three-layer adaptive quality (PRD 8.2):
 * dpr drops first, then particle count, bloom last.
 * Histogram reflection and projection glow ride the same tiers.
 */

export type SceneQuality = {
  readonly dpr: number;
  /** Total particle instances across all nine links. */
  readonly particleCount: number;
  readonly bloomEnabled: boolean;
  /** Annual histogram bars stay on while fidelity degrades. */
  readonly histogramEnabled: boolean;
  /** Mirrored floor reflection under histogram bars. */
  readonly histogramReflection: boolean;
  /** Twelve-month projection curve in scene space. */
  readonly projectionEnabled: boolean;
  /** Brighter emissive treatment on the projection curve. */
  readonly projectionGlow: boolean;
  readonly fps: number;
};

export const PARTICLE_COUNT_FULL = 108;
export const PARTICLE_COUNT_REDUCED = 45;
export const PARTICLE_COUNT_MIN = 18;

export const DEFAULT_SCENE_QUALITY: SceneQuality = {
  dpr: 1.75,
  particleCount: PARTICLE_COUNT_FULL,
  bloomEnabled: true,
  histogramEnabled: true,
  histogramReflection: true,
  projectionEnabled: true,
  projectionGlow: true,
  fps: 0,
};

/**
 * Maps PerformanceMonitor factor (0..1) onto ordered degradation tiers.
 * Higher factor = better performance = higher visual fidelity.
 */
export function qualityFromFactor(factor: number, fps: number): SceneQuality {
  const f = Math.max(0, Math.min(1, factor));

  // Tier A: full fidelity while factor stays healthy.
  if (f >= 0.75) {
    return {
      dpr: 1.75,
      particleCount: PARTICLE_COUNT_FULL,
      bloomEnabled: true,
      histogramEnabled: true,
      histogramReflection: true,
      projectionEnabled: true,
      projectionGlow: true,
      fps,
    };
  }

  // Tier B: drop dpr first (visual identity of nodes/links kept).
  if (f >= 0.5) {
    return {
      dpr: 1.25,
      particleCount: PARTICLE_COUNT_FULL,
      bloomEnabled: true,
      histogramEnabled: true,
      histogramReflection: true,
      projectionEnabled: true,
      projectionGlow: true,
      fps,
    };
  }

  // Tier C: then cut particles and histogram reflection.
  if (f >= 0.25) {
    return {
      dpr: 1,
      particleCount: PARTICLE_COUNT_REDUCED,
      bloomEnabled: true,
      histogramEnabled: true,
      histogramReflection: false,
      projectionEnabled: true,
      projectionGlow: true,
      fps,
    };
  }

  // Tier D: bloom last; strip projection glow with it.
  return {
    dpr: 1,
    particleCount: PARTICLE_COUNT_MIN,
    bloomEnabled: false,
    histogramEnabled: true,
    histogramReflection: false,
    projectionEnabled: true,
    projectionGlow: false,
    fps,
  };
}
