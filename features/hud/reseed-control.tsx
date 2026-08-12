"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FIXED_SEED } from "@/features/simulation/defaults";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type ReseedControlProps = {
  seed: number;
  onReseed: () => void;
  onResetSeed: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Discrete FR-2b control. Intentionally secondary to presets.
 */
export function ReseedControl({
  seed,
  onReseed,
  onResetSeed,
  disabled = false,
  className,
}: ReseedControlProps) {
  const { t } = useLanguage();
  const isFixed = seed === FIXED_SEED;

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-none text-muted-foreground/70",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger
            type="button"
            disabled={disabled}
            onClick={onReseed}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono uppercase tracking-[0.14em]",
              "text-muted-foreground/60 transition-colors",
              "hover:text-muted-foreground focus-visible:outline-none",
              "focus-visible:ring-1 focus-visible:ring-primary/40",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
            aria-label={t("ui.reseedTooltip")}
          >
            {t("ui.reseed")}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[16rem] text-left">
            {t("ui.reseedTooltip")}
          </TooltipContent>
        </Tooltip>

        <span className="font-mono tabular-nums text-muted-foreground/50" title={t("ui.seed")}>
          {seed}
        </span>

        {!isFixed ? (
          <Tooltip>
            <TooltipTrigger
              type="button"
              disabled={disabled}
              onClick={onResetSeed}
              className={cn(
                "rounded px-1 py-0.5 font-mono text-[10px]",
                "text-muted-foreground/45 underline-offset-2",
                "hover:text-muted-foreground/80 hover:underline",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
              aria-label={t("ui.resetSeedTooltip")}
            >
              {t("ui.resetSeed")}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[16rem] text-left">
              {t("ui.resetSeedTooltip")}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
