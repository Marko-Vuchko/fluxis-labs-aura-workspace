"use client";

import {
  formatCompact,
  formatFull,
  formatPercent,
  formatRangeTooltip,
} from "@/lib/i18n/format";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { MonthSnapshot } from "@/features/simulation/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { AnimatedNumber } from "./animated-number";
import { HudPanel } from "./hud-chrome";

export type KpiPanelProps = {
  month: MonthSnapshot | null;
  currency?: string;
  stale?: boolean;
  className?: string;
};

type KpiMetric = {
  id: string;
  labelKey: DictionaryKey;
  value: number;
  formatCompact: (value: number) => string;
  tooltip: string;
};

function buildMetrics(
  month: MonthSnapshot,
  currency: string,
  percentileLabels: { p10: string; p90: string },
): readonly KpiMetric[] {
  const revenueP50 = month.revenue[1];
  const profitP50 = month.profit[1];

  return [
    {
      id: "revenue",
      labelKey: "ui.revenue",
      value: revenueP50,
      formatCompact: (value) => formatCompact(value),
      tooltip: formatRangeTooltip(revenueP50, currency, {
        p10: month.revenue[0],
        p90: month.revenue[2],
      }, percentileLabels),
    },
    {
      id: "profit",
      labelKey: "ui.profit",
      value: profitP50,
      formatCompact: (value) => formatCompact(value),
      tooltip: formatRangeTooltip(profitP50, currency, {
        p10: month.profit[0],
        p90: month.profit[2],
      }, percentileLabels),
    },
    {
      id: "margin",
      labelKey: "ui.margin",
      value: month.margin,
      formatCompact: (value) => formatPercent(value, 1),
      tooltip: formatPercent(month.margin, 1),
    },
    {
      id: "cash",
      labelKey: "ui.endingCash",
      value: month.cash,
      formatCompact: (value) => formatCompact(value),
      tooltip: formatFull(month.cash, currency),
    },
  ];
}

function RunwayLine({
  runwayMonths,
}: {
  runwayMonths: number | null;
}) {
  const { t } = useLanguage();

  if (runwayMonths === null) {
    return (
      <p className="font-mono text-[10px] tracking-[0.14em] text-status-stable uppercase">
        {t("ui.runway")}: {t("ui.profitable")}
      </p>
    );
  }

  return (
    <p className="font-mono text-[10px] text-muted-foreground">
      {t("ui.runway")}:{" "}
      <AnimatedNumber
        value={runwayMonths}
        format={(value) => value.toFixed(1)}
        className="text-foreground/90"
      />
    </p>
  );
}

function KpiCell({ metric }: { metric: KpiMetric }) {
  const { t } = useLanguage();

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex min-w-0 flex-col gap-1 rounded-md px-1 py-0.5 text-left",
          "outline-none transition-colors hover:bg-primary/5",
          "focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {t(metric.labelKey)}
        </span>
        <AnimatedNumber
          value={metric.value}
          format={metric.formatCompact}
          className="font-mono text-lg font-medium tracking-tight text-foreground tabular-nums"
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="whitespace-pre-line font-mono text-[11px] leading-relaxed"
      >
        {metric.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Selected-month KPIs: revenue, profit, margin, ending cash (p50 where applicable).
 * Compact figures on the surface; full value and p10/p90 only in the hover tooltip.
 */
export function KpiPanel({
  month,
  currency = "USD",
  stale = false,
  className,
}: KpiPanelProps) {
  const { t } = useLanguage();

  if (!month) {
    return (
      <HudPanel
        label={t("ui.revenue")}
        className={cn("w-full max-w-md", className)}
      >
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">
          {t("ui.awaitingSimulation")}
        </p>
      </HudPanel>
    );
  }

  const metrics = buildMetrics(month, currency, {
    p10: t("ui.p10"),
    p90: t("ui.p90"),
  });

  return (
    <TooltipProvider delay={120}>
      <HudPanel
        label={t("ui.revenue")}
        className={cn(
          "w-full max-w-md",
          stale && "ring-1 ring-status-warning/40",
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] tracking-[0.18em] text-primary/80 uppercase">
            {t("ui.month")} {month.index}
          </p>
          {stale ? (
            <span className="font-mono text-[10px] tracking-[0.14em] text-status-warning uppercase">
              {t("ui.stale")}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <KpiCell key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-3 border-t border-primary/10 pt-2">
          <RunwayLine runwayMonths={month.runway_months} />
        </div>
      </HudPanel>
    </TooltipProvider>
  );
}
