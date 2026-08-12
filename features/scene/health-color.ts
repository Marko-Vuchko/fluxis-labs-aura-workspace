/** Health-driven status colors from PRD 5.5 / visual identity. */

export const HEALTH_STABLE = "#34D399";
export const HEALTH_WARNING = "#FBBF24";
export const HEALTH_CRITICAL = "#FB7185";

export function healthToColor(health: number): string {
  if (health > 70) return HEALTH_STABLE;
  if (health >= 40) return HEALTH_WARNING;
  return HEALTH_CRITICAL;
}

export function healthToRiskFactor(health: number): number {
  if (!Number.isFinite(health)) return 1;
  return Math.max(0, Math.min(1, 1 - health / 100));
}
