"use client";

import { healthToColor } from "@/features/scene/health-color";
import type {
  AnnualSummary,
  Histogram,
  MonthSnapshot,
  NodeState,
} from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";
import {
  formatCompact,
  formatFull,
  formatNumber,
  formatPercent,
} from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type SceneFallbackProps = {
  month: MonthSnapshot | null;
  months?: readonly MonthSnapshot[] | null;
  histogram?: Histogram | null;
  annual?: AnnualSummary | null;
  currency?: string;
  reason: "unsupported" | "context-lost";
  onRetry?: () => void;
  className?: string;
};

function NodeRow({
  id,
  state,
}: {
  id: (typeof NODE_ORDER)[number];
  state: NodeState | null;
}) {
  const { t } = useLanguage();
  const health = state?.[0] ?? null;
  const color = health === null ? undefined : healthToColor(health);

  return (
    <li className="flex items-center justify-between gap-3 border-b border-primary/10 py-1.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">
        {t(`ui.nodes.${id}`)}
      </span>
      <span
        className="font-mono text-xs tabular-nums text-foreground"
        style={color ? { color } : undefined}
      >
        {health === null ? "-" : formatNumber(health, 1)}
      </span>
    </li>
  );
}

/**
 * Elegant 2D panel that preserves every Python figure when WebGL is unavailable
 * or the GPU context is lost. Never invents client-side replacements.
 */
export function SceneFallback({
  month,
  months = null,
  histogram = null,
  annual = null,
  currency = "USD",
  reason,
  onRetry,
  className,
}: SceneFallbackProps) {
  const { t } = useLanguage();

  const title =
    reason === "context-lost"
      ? t("ui.webglContextLost")
      : t("ui.webglUnavailable");

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "relative flex h-full w-full flex-col overflow-auto",
        "bg-[radial-gradient(ellipse_at_center,rgb(34_211_238_/0.08),transparent_55%),linear-gradient(180deg,#05070d_0%,#070b14_55%,#05070d_100%)]",
        "px-4 py-6 sm:px-8",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgb(34_211_238_/0.18)_1px,transparent_1px),linear-gradient(90deg,rgb(34_211_238_/0.18)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">
            {t("ui.sceneFallbackBadge")}
          </p>
          <h2 className="font-sans text-lg font-semibold tracking-tight text-balance sm:text-xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t("ui.sceneFallbackBody")}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                "mt-2 inline-flex items-center rounded-md border border-primary/40",
                "bg-primary/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em]",
                "text-primary uppercase transition-colors",
                "hover:bg-primary/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              )}
            >
              {t("ui.webglRetry")}
            </button>
          ) : null}
        </header>

        {month ? (
          <section
            aria-label={t("ui.month")}
            className="rounded-xl border border-primary/20 bg-[#070b14]/75 p-4 backdrop-blur-md"
          >
            <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-primary/80 uppercase">
              {t("ui.month")} {month.index} / 12
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label={t("ui.revenue")}
                value={formatCompact(month.revenue[1])}
                title={formatFull(month.revenue[1], currency)}
              />
              <Metric
                label={t("ui.profit")}
                value={formatCompact(month.profit[1])}
                title={formatFull(month.profit[1], currency)}
              />
              <Metric
                label={t("ui.margin")}
                value={formatPercent(month.margin, 1)}
              />
              <Metric
                label={t("ui.cash")}
                value={formatCompact(month.cash)}
                title={formatFull(month.cash, currency)}
              />
              <Metric
                label={t("ui.customers")}
                value={formatNumber(month.customers, 1)}
              />
              <Metric
                label={t("ui.churnRate")}
                value={formatPercent(month.churn_rate, 1)}
              />
              <Metric
                label={t("ui.capacityUsed")}
                value={formatPercent(month.capacity_used, 0)}
              />
              <Metric
                label={t("ui.risk")}
                value={formatNumber(month.risk.score, 1)}
              />
            </dl>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              {t("ui.runway")}:{" "}
              {month.runway_months === null
                ? t("ui.profitable")
                : t("ui.monthsUnit", {
                    n: formatNumber(month.runway_months, 1),
                  })}
            </p>
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">{t("ui.copilotEmpty")}</p>
        )}

        {month ? (
          <section
            aria-label={t("ui.health")}
            className="rounded-xl border border-primary/20 bg-[#070b14]/75 p-4 backdrop-blur-md"
          >
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-primary/80 uppercase">
              {t("ui.health")}
            </p>
            <ul>
              {NODE_ORDER.map((id, index) => (
                <NodeRow
                  key={id}
                  id={id}
                  state={month.nodes[index] ?? null}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {annual ? (
          <section
            aria-label={t("ui.annualBadge")}
            className="rounded-xl border border-primary/20 bg-[#070b14]/75 p-4 backdrop-blur-md"
          >
            <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-primary/80 uppercase">
              {t("ui.annualBadge")}
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label={t("ui.revenue")}
                value={formatCompact(annual.revenue[1])}
                title={formatFull(annual.revenue[1], currency)}
              />
              <Metric
                label={t("ui.profit")}
                value={formatCompact(annual.profit[1])}
                title={formatFull(annual.profit[1], currency)}
              />
              <Metric
                label={t("ui.margin")}
                value={formatPercent(annual.margin[1], 1)}
              />
              <Metric
                label={t("ui.endingCash")}
                value={formatCompact(annual.ending_cash[1])}
                title={formatFull(annual.ending_cash[1], currency)}
              />
            </dl>
          </section>
        ) : null}

        {histogram ? (
          <section
            aria-label={t("ui.annualHistogram")}
            className="rounded-xl border border-primary/20 bg-[#070b14]/75 p-4 backdrop-blur-md"
          >
            <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-primary/80 uppercase">
              {t("ui.annualHistogram")}
            </p>
            <div
              className="flex h-24 items-end gap-px"
              role="img"
              aria-label={t("ui.annualHistogram")}
            >
              {histogram.counts.map((count, index) => {
                const max = Math.max(...histogram.counts, 1);
                const height = `${Math.max(4, (count / max) * 100)}%`;
                return (
                  <div
                    key={`bin-${index}`}
                    className="min-w-0 flex-1 rounded-t-sm bg-primary/55"
                    style={{ height }}
                    title={`${count}`}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {months && months.length > 0 ? (
          <section
            aria-label={t("ui.projectionCurve")}
            className="rounded-xl border border-primary/20 bg-[#070b14]/75 p-4 backdrop-blur-md"
          >
            <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-primary/80 uppercase">
              {t("ui.projectionCurve")}
            </p>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {months.map((entry) => (
                <li
                  key={entry.index}
                  className="rounded-md border border-primary/10 bg-background/40 px-2 py-1.5"
                >
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {t("ui.monthAbbrev", { n: entry.index })}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-primary">
                    {formatCompact(entry.profit[1])}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className="mt-0.5 font-mono text-sm tabular-nums text-foreground"
        title={title}
      >
        {value}
      </dd>
    </div>
  );
}
