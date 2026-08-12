"use client";

import { Html } from "@react-three/drei";

import { healthToColor } from "@/features/scene/health-color";
import type { MonthSnapshot, NodeId, NodeState } from "@/features/simulation/types";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import {
  formatCompact,
  formatFull,
  formatNumber,
  formatPercent,
} from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";

import { AnimatedNumber } from "./animated-number";

export type NodeDetailCardProps = {
  id: NodeId;
  state: NodeState | null;
  month: MonthSnapshot | null;
  currency?: string;
  onClose: () => void;
};

function nodeLabelKey(id: NodeId): DictionaryKey {
  return `ui.nodes.${id}`;
}

/**
 * HTML detail card anchored to a locked spatial node via drei Html.
 * Stays open while the scrubber moves; figures follow the selected month.
 * zIndexRange stays below the HUD stack (Control Deck at z-10) so the deck
 * remains readable, while the solid panel keeps the card clear of bloom.
 */
export function NodeDetailCard({
  id,
  state,
  month,
  currency = "USD",
  onClose,
}: NodeDetailCardProps) {
  const { t } = useLanguage();
  const health = state?.[0] ?? null;
  const healthColor = health !== null ? healthToColor(health) : "#94a3b8";

  return (
    <Html
      position={[0, 1.15, 0]}
      center
      distanceFactor={9}
      zIndexRange={[45, 25]}
      style={{ pointerEvents: "auto" }}
      occlude={false}
    >
      <article
        role="dialog"
        aria-label={t(nodeLabelKey(id))}
        className="w-[13.5rem] rounded-lg border border-primary/30 bg-[#070b14]/94 px-3 py-2.5 shadow-[0_0_28px_-14px_rgb(34_211_238_/_0.65)] backdrop-blur-md"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] tracking-[0.16em] text-primary/85 uppercase">
              {t(nodeLabelKey(id))}
            </p>
            {month ? (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                {t("ui.month")} {month.index}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={t("ui.close")}
            className="rounded border border-primary/25 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            Esc
          </button>
        </header>

        <dl className="space-y-1.5 font-mono text-[11px] tabular-nums text-foreground">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.health")}</dt>
            <dd style={{ color: healthColor }}>
              {health !== null ? (
                <AnimatedNumber
                  value={health}
                  format={(value) => formatNumber(value, 1)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.risk")}</dt>
            <dd>
              {month ? (
                <AnimatedNumber
                  value={month.risk.score}
                  format={(value) => formatNumber(value, 1)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.revenue")}</dt>
            <dd title={month ? formatFull(month.revenue[1], currency) : undefined}>
              {month ? (
                <AnimatedNumber
                  value={month.revenue[1]}
                  format={(value) => formatCompact(value)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.profit")}</dt>
            <dd title={month ? formatFull(month.profit[1], currency) : undefined}>
              {month ? (
                <AnimatedNumber
                  value={month.profit[1]}
                  format={(value) => formatCompact(value)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.customers")}</dt>
            <dd>
              {month ? (
                <AnimatedNumber
                  value={month.customers}
                  format={(value) => formatNumber(value, 1)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.capacityUsed")}</dt>
            <dd>
              {month ? (
                <AnimatedNumber
                  value={month.capacity_used}
                  format={(value) => formatPercent(value, 0)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.churnRate")}</dt>
            <dd>
              {month ? (
                <AnimatedNumber
                  value={month.churn_rate}
                  format={(value) => formatPercent(value, 1)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.cash")}</dt>
            <dd title={month ? formatFull(month.cash, currency) : undefined}>
              {month ? (
                <AnimatedNumber
                  value={month.cash}
                  format={(value) => formatCompact(value)}
                />
              ) : (
                "-"
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.runway")}</dt>
            <dd>
              {month
                ? month.runway_months === null
                  ? t("ui.profitable")
                  : formatNumber(month.runway_months, 1)
                : "-"}
            </dd>
          </div>
        </dl>
      </article>
    </Html>
  );
}
