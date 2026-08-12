/**
 * Three-layer adaptive quality (PRD 8.2):
 * dpr drops first, then particle count, bloom last.
 */

export type SceneQuality = {
  readonly dpr: number;
  /** Total particle instances across all nine links. */
  readonly particleCount: number;
  readonly bloomEnabled: boolean;
  readonly fps: number;
};

export const PARTICLE_COUNT_FULL = 108;
export const PARTICLE_COUNT_REDUCED = 45;
export const PARTICLE_COUNT_MIN = 18;

export const DEFAULT_SCENE_QUALITY: SceneQuality = {
  dpr: 1.75,
  particleCount: PARTICLE_COUNT_FULL,
  bloomEnabled: true,
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
      fps,
    };
  }

  // Tier B: drop dpr first (visual identity of nodes/links kept).
  if (f >= 0.5) {
    return {
      dpr: 1.25,
      particleCount: PARTICLE_COUNT_FULL,
      bloomEnabled: true,
      fps,
    };
  }

  // Tier C: then cut particles.
  if (f >= 0.25) {
    return {
      dpr: 1,
      particleCount: PARTICLE_COUNT_REDUCED,
      bloomEnabled: true,
      fps,
    };
  }

  // Tier D: bloom last, only when still struggling.
  return {
    dpr: 1,
    particleCount: PARTICLE_COUNT_MIN,
    bloomEnabled: false,
    fps,
  };
}
