"use client";

import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

import { HudPanel } from "./hud-chrome";
import { orbitGuardPointerDown } from "./orbit-gate";

export type MonthScrubberProps = {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  /** Fired on pointer/keyboard commit so the shareable URL can update. */
  onMonthCommit?: () => void;
  className?: string;
  /** Enlarge thumb / hit area for narrow touch layouts (44 px). */
  enlargeTouch?: boolean;
};

/**
 * 12-month scrubber. Default selected month is 12 (set in the simulation hook).
 * Moving it drives every month-scoped surface on the screen.
 */
export function MonthScrubber({
  selectedMonth,
  onMonthChange,
  onMonthCommit,
  className,
  enlargeTouch = false,
}: MonthScrubberProps) {
  const { t } = useLanguage();

  return (
    <HudPanel
      label={t("ui.month")}
      className={cn("w-full max-w-xl px-5 py-3", className)}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[10px] tracking-[0.18em] text-primary/80 uppercase">
          {t("ui.month")}
        </p>
        <p className="font-mono text-sm tabular-nums text-foreground">
          {selectedMonth}
          <span className="text-muted-foreground"> / 12</span>
        </p>
      </div>

      <div
        className={cn(enlargeTouch && "min-h-11 flex items-center")}
        onPointerDown={orbitGuardPointerDown}
      >
        <Slider
          value={[selectedMonth]}
          min={1}
          max={12}
          step={1}
          aria-label={t("ui.month")}
          onValueChange={(next) => {
            const raw = Array.isArray(next) ? next[0] : next;
            if (typeof raw !== "number" || !Number.isFinite(raw)) {
              return;
            }
            onMonthChange(Math.round(raw));
          }}
          onValueCommitted={() => {
            onMonthCommit?.();
          }}
          className={cn(
            "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-primary/15",
            "[&_[data-slot=slider-range]]:bg-primary",
            "[&_[data-slot=slider-range]]:shadow-[0_0_12px_rgb(34_211_238_/_0.55)]",
            "[&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:rounded-full",
            "[&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-primary/80",
            "[&_[data-slot=slider-thumb]]:bg-primary",
            "[&_[data-slot=slider-thumb]]:shadow-[0_0_14px_rgb(34_211_238_/_0.75)]",
            "[&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:hover:ring-2",
            "[&_[data-slot=slider-thumb]]:hover:ring-primary/35",
            "[&_[data-slot=slider-thumb]]:focus-visible:ring-2",
            "[&_[data-slot=slider-thumb]]:focus-visible:ring-primary/45",
            enlargeTouch &&
              "[&_[data-slot=slider-thumb]]:size-11 [&_[data-slot=slider-track]]:h-2",
          )}
        />
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground/70 tabular-nums">
        <span>1</span>
        <span>6</span>
        <span>12</span>
      </div>
    </HudPanel>
  );
}
