"use client";

import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { formatPercent } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { RiskSnapshot } from "@/features/simulation/types";
import { cn } from "@/lib/utils";

import { AnimatedNumber } from "./animated-number";
import { HudPanel } from "./hud-chrome";

export type RiskGaugeProps = {
  risk: RiskSnapshot | null;
  stale?: boolean;
  className?: string;
};

const RISK_COMPONENTS: readonly {
  labelKey: DictionaryKey;
  index: 0 | 1 | 2 | 3;
}[] = [
  { labelKey: "ui.riskLoss", index: 0 },
  { labelKey: "ui.riskOverload", index: 1 },
  { labelKey: "ui.riskVolatility", index: 2 },
  { labelKey: "ui.riskAdDependency", index: 3 },
];

/** Risk score thresholds mirror PRD status bands (higher score = worse). */
function riskToneClass(score: number): string {
  if (score < 40) {
    return "text-status-stable";
  }
  if (score < 70) {
    return "text-status-warning";
  }
  return "text-status-critical";
}

function riskBarClass(score: number): string {
  if (score < 40) {
    return "bg-status-stable";
  }
  if (score < 70) {
    return "bg-status-warning";
  }
  return "bg-status-critical";
}

function ComponentBar({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: number;
  toneClass: string;
}) {
  const widthPct = Math.min(100, Math.max(0, value * 100));
  const valueText = formatPercent(value, 0);
  const valueNow = Math.round(widthPct);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="font-mono text-[10px] text-foreground/80 tabular-nums">
          {valueText}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        className="h-1 overflow-hidden rounded-full bg-primary/10"
      >
        <div
          aria-hidden
          className={cn("h-full rounded-full transition-[width] duration-500", toneClass)}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Decomposed monthly Risk Score: large colored number + four weighted mini bars.
 */
export function RiskGauge({ risk, stale = false, className }: RiskGaugeProps) {
  const { t } = useLanguage();

  if (!risk) {
    return (
      <HudPanel label={t("ui.risk")} className={cn("w-full max-w-md", className)}>
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">
          {t("ui.awaitingSimulation")}
        </p>
      </HudPanel>
    );
  }

  const tone = riskToneClass(risk.score);
  const barTone = riskBarClass(risk.score);

  return (
    <HudPanel
      label={t("ui.risk")}
      className={cn(
        "w-full max-w-md",
        stale && "ring-1 ring-status-warning/40",
        className,
      )}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-primary/80 uppercase">
            {t("ui.risk")}
          </p>
          <div
            role="progressbar"
            aria-label={t("ui.risk")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(100, Math.max(0, risk.score)))}
            aria-valuetext={risk.score.toFixed(1)}
          >
            <AnimatedNumber
              value={risk.score}
              format={(value) => value.toFixed(1)}
              className={cn(
                "mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums xl:text-4xl",
                tone,
              )}
            />
          </div>
        </div>
        {stale ? (
          <span className="font-mono text-[10px] tracking-[0.14em] text-status-warning uppercase">
            {t("ui.stale")}
          </span>
        ) : null}
      </div>

      {/* Full decomposition from lg up - 1024px still has room for the four bars */}
      <div className="hidden space-y-2.5 lg:block">
        {RISK_COMPONENTS.map((component) => (
          <ComponentBar
            key={component.labelKey}
            label={t(component.labelKey)}
            value={risk.components[component.index]}
            toneClass={barTone}
          />
        ))}
      </div>
    </HudPanel>
  );
}
