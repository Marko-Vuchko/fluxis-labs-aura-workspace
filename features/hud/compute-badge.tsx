"use client";

import type { SimulationMeta } from "@/features/simulation/types";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type ComputeBadgeProps = {
  meta: SimulationMeta | null | undefined;
  className?: string;
};

/**
 * Persistent compute telemetry from the last engine response (PRD FR-9b).
 * Always reads meta.compute_ms - never measures client-side duration.
 */
export function ComputeBadge({ meta, className }: ComputeBadgeProps) {
  const { t } = useLanguage();

  if (!meta) {
    return null;
  }

  return (
    <div
      title={`${t("ui.computeMs")} / ${t("ui.iterations")} / ${t("ui.month")}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-primary/20",
        "bg-[#070b14]/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground",
        "backdrop-blur-sm tabular-nums",
        className,
      )}
    >
      <span className="text-primary/90">
        {meta.compute_ms.toFixed(1)}
        <span className="text-muted-foreground"> ms</span>
      </span>
      <span className="text-muted-foreground/40" aria-hidden>
        ·
      </span>
      <span>
        {meta.iterations}
        <span className="text-muted-foreground">×</span>
        {meta.months}
      </span>
    </div>
  );
}
