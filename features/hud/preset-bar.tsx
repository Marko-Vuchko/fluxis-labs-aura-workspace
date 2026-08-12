"use client";

import { useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  PRESETS,
  getPreset,
  type PresetId,
} from "@/features/simulation/presets";
import type { SimulationInput } from "@/features/simulation/types";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

const PRESET_ANIMATION_MS = 600;

export type PresetBarProps = {
  currentParams: Omit<SimulationInput, "seed">;
  disabled?: boolean;
  onDisplayParams: (params: Omit<SimulationInput, "seed">) => void;
  onApplyPreset: (id: PresetId) => void;
  onCommit: () => void;
  className?: string;
};

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function interpolateParams(
  from: Omit<SimulationInput, "seed">,
  to: Omit<SimulationInput, "seed">,
  t: number,
): Omit<SimulationInput, "seed"> {
  return {
    ad_spend: lerp(from.ad_spend, to.ad_spend, t),
    price: lerp(from.price, to.price, t),
    team_size: Math.round(lerp(from.team_size, to.team_size, t)),
    opex: lerp(from.opex, to.opex, t),
    cash_reserve: lerp(from.cash_reserve, to.cash_reserve, t),
  };
}

/**
 * Four staged presets. Animates slider display for 600 ms, then fires exactly one simulate.
 */
export function PresetBar({
  currentParams,
  disabled = false,
  onDisplayParams,
  onApplyPreset,
  onCommit,
  className,
}: PresetBarProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<PresetId | null>(null);
  const [animating, setAnimating] = useState(false);
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const fromRef = useRef(currentParams);

  const runPreset = (id: PresetId) => {
    if (disabled || animating) {
      return;
    }

    controlsRef.current?.stop();
    const target = getPreset(id).params;
    const from = { ...currentParams };
    fromRef.current = from;
    setActiveId(id);
    setAnimating(true);

    const finish = () => {
      onDisplayParams(target);
      onApplyPreset(id);
      onCommit();
      setAnimating(false);
    };

    if (reduceMotion) {
      finish();
      return;
    }

    controlsRef.current = animate(0, 1, {
      duration: PRESET_ANIMATION_MS / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (progress) => {
        onDisplayParams(interpolateParams(from, target, progress));
      },
      onComplete: finish,
    });
  };

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label={t("tour.step4Title")}
    >
      {PRESETS.map((preset) => {
        const selected = activeId === preset.id;
        return (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || animating}
            onClick={() => {
              runPreset(preset.id);
            }}
            className={cn(
              "border-primary/25 bg-background/40 font-sans text-xs tracking-wide text-foreground",
              "hover:border-primary/50 hover:bg-primary/10",
              "focus-visible:ring-2 focus-visible:ring-primary/45",
              "max-lg:min-h-11",
              selected &&
                "border-primary/70 bg-primary/15 text-primary shadow-[0_0_18px_-6px_rgb(34_211_238_/_0.85)]",
            )}
            aria-label={t(`ui.${preset.labelKey}`)}
            aria-pressed={selected}
          >
            {t(`ui.${preset.labelKey}`)}
          </Button>
        );
      })}
    </div>
  );
}
