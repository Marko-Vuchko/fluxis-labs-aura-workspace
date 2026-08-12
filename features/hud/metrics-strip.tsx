"use client";

import {
  formatCompact,
  formatFull,
  formatPercent,
  formatRangeTooltip,
} from "@/lib/i18n/format";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { MonthSnapshot, RiskSnapshot } from "@/features/simulation/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { AnimatedNumber } from "./animated-number";
import { HudPanel } from "./hud-chrome";
import { orbitGuardPointerDown } from "./orbit-gate";

export type MetricsStripProps = {
  month: MonthSnapshot | null;
  risk: RiskSnapshot | null;
  currency?: string;
  stale?: boolean;
  className?: string;
};

type StripMetric = {
  id: string;
  labelKey: DictionaryKey;
  value: number;
  format: (value: number) => string;
  tooltip: string;
  toneClass?: string;
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

function riskToneClass(score: number): string {
  if (score < 40) {
    return "text-status-stable";
  }
  if (score < 70) {
    return "text-status-warning";
  }
  return "text-status-critical";
}

function buildStripMetrics(
  month: MonthSnapshot,
  risk: RiskSnapshot | null,
  currency: string,
): readonly StripMetric[] {
  const metrics: StripMetric[] = [
    {
      id: "revenue",
      labelKey: "ui.revenue",
      value: month.revenue[1],
      format: (value) => formatCompact(value),
      tooltip: formatRangeTooltip(month.revenue[1], currency, {
        p10: month.revenue[0],
        p90: month.revenue[2],
      }),
    },
    {
      id: "profit",
      labelKey: "ui.profit",
      value: month.profit[1],
      format: (value) => formatCompact(value),
      tooltip: formatRangeTooltip(month.profit[1], currency, {
        p10: month.profit[0],
        p90: month.profit[2],
      }),
    },
    {
      id: "margin",
      labelKey: "ui.margin",
      value: month.margin,
      format: (value) => formatPercent(value, 1),
      tooltip: formatPercent(month.margin, 1),
    },
    {
      id: "cash",
      labelKey: "ui.endingCash",
      value: month.cash,
      format: (value) => formatCompact(value),
      tooltip: formatFull(month.cash, currency),
    },
    {
      id: "runway",
      labelKey: "ui.runway",
      value: month.runway_months ?? Number.POSITIVE_INFINITY,
      format: (value) =>
        Number.isFinite(value) ? value.toFixed(1) : "PROFITABLE",
      tooltip:
        month.runway_months === null
          ? "PROFITABLE"
          : formatNumberFallback(month.runway_months),
    },
  ];

  if (risk) {
    metrics.push({
      id: "risk-score",
      labelKey: "ui.risk",
      value: risk.score,
      format: (value) => value.toFixed(1),
      tooltip: risk.score.toFixed(1),
      toneClass: riskToneClass(risk.score),
    });

    for (const component of RISK_COMPONENTS) {
      metrics.push({
        id: `risk-${component.index}`,
        labelKey: component.labelKey,
        value: risk.components[component.index],
        format: (value) => formatPercent(value, 0),
        tooltip: formatPercent(risk.components[component.index], 0),
      });
    }
  }

  return metrics;
}

function formatNumberFallback(value: number): string {
  return value.toFixed(1);
}

function StripCell({ metric }: { metric: StripMetric }) {
  const { t } = useLanguage();
  const isRunwayProfitable =
    metric.id === "runway" && !Number.isFinite(metric.value);

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex min-h-11 min-w-[7.25rem] shrink-0 flex-col justify-center gap-0.5",
          "rounded-md px-2 py-1 text-left",
          "outline-none transition-colors hover:bg-primary/5",
          "focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <span className="text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
          {t(metric.labelKey)}
        </span>
        {isRunwayProfitable ? (
          <span className="font-mono text-sm font-medium tracking-tight text-status-stable tabular-nums">
            {t("ui.profitable")}
          </span>
        ) : (
          <AnimatedNumber
            value={metric.value}
            format={metric.format}
            className={cn(
              "font-mono text-sm font-medium tracking-tight text-foreground tabular-nums",
              metric.toneClass,
            )}
          />
        )}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="whitespace-pre-line font-mono text-[11px] leading-relaxed"
      >
        {isRunwayProfitable ? t("ui.profitable") : metric.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Narrow-viewport KPI + Risk: one horizontally scrollable strip.
 * Every figure remains present; only the layout is compressed.
 */
export function MetricsStrip({
  month,
  risk,
  currency = "USD",
  stale = false,
  className,
}: MetricsStripProps) {
  const { t } = useLanguage();

  if (!month) {
    return (
      <HudPanel
        label={t("ui.revenue")}
        className={cn("w-full px-3 py-2", className)}
      >
        <p className="font-mono text-xs text-muted-foreground">-</p>
      </HudPanel>
    );
  }

  const metrics = buildStripMetrics(month, risk, currency);

  return (
    <TooltipProvider delay={120}>
      <HudPanel
        label={t("ui.revenue")}
        className={cn(
          "w-full px-2 py-2",
          stale && "ring-1 ring-status-warning/40",
          className,
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          <p className="text-[9px] tracking-[0.16em] text-primary/80 uppercase">
            {t("ui.month")} {month.index}
          </p>
          {stale ? (
            <span className="font-mono text-[9px] tracking-[0.14em] text-status-warning uppercase">
              {t("ui.stale")}
            </span>
          ) : null}
        </div>

        <div
          role="list"
          aria-label={`${t("ui.revenue")} / ${t("ui.risk")}`}
          onPointerDown={orbitGuardPointerDown}
          className={cn(
            "flex gap-1 overflow-x-auto overscroll-x-contain pb-1",
            "[scrollbar-width:thin]",
            "touch-pan-x",
          )}
        >
          {metrics.map((metric) => (
            <div key={metric.id} role="listitem">
              <StripCell metric={metric} />
            </div>
          ))}
        </div>
      </HudPanel>
    </TooltipProvider>
  );
}
