"use client";

import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { HudPanel } from "@/features/hud/hud-chrome";
import type {
  Insight,
  InsightSeverity,
  SensitivityItem,
  SimulationParamKey,
  SimulationStatus,
} from "@/features/simulation/types";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

import { InsightRenderer } from "./insight-renderer";

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const PARAM_LABEL_KEYS: Record<SimulationParamKey, DictionaryKey> = {
  ad_spend: "ui.adSpend",
  price: "ui.price",
  team_size: "ui.teamSize",
  opex: "ui.opex",
  cash_reserve: "ui.cashReserve",
};

function isSimulationParamKey(value: string): value is SimulationParamKey {
  return value in PARAM_LABEL_KEYS;
}

export type AiCopilotProps = {
  insights: readonly Insight[] | null;
  sensitivity?: readonly SensitivityItem[];
  /** Selected scrubber month (1..12). Shown for temporal context; insights come from Python. */
  selectedMonth: number;
  status: SimulationStatus;
  className?: string;
};

function sortBySeverity(insights: readonly Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
}

function SeverityIcon({
  severity,
  label,
}: {
  severity: InsightSeverity;
  label: string;
}): ReactNode {
  const common = "mt-0.5 size-4 shrink-0";
  switch (severity) {
    case "info":
      return (
        <Info
          aria-label={label}
          className={cn(common, "text-primary")}
        />
      );
    case "warning":
      return (
        <AlertTriangle
          aria-label={label}
          className={cn(common, "text-status-warning")}
        />
      );
    case "critical":
      return (
        <AlertOctagon
          aria-label={label}
          className={cn(common, "text-status-critical")}
        />
      );
  }
}

function severityLabelKey(severity: InsightSeverity): DictionaryKey {
  switch (severity) {
    case "info":
      return "ui.insightSeverityInfo";
    case "warning":
      return "ui.insightSeverityWarning";
    case "critical":
      return "ui.insightSeverityCritical";
  }
}

/**
 * Resolve the lever display name for REC_* codes from the engine sensitivity table.
 * Does not invent rankings - only joins Python's rank with Python's param id.
 */
function leverLabelForInsight(
  insight: Insight,
  sensitivity: readonly SensitivityItem[],
  translate: (key: DictionaryKey) => string,
): string | undefined {
  if (
    insight.code !== "REC_TOP_LEVER" &&
    insight.code !== "REC_SECOND_LEVER"
  ) {
    return undefined;
  }

  const rank = insight.params.rank;
  if (!Number.isFinite(rank)) {
    return undefined;
  }

  const match =
    sensitivity.find((item) => item.rank === rank) ??
    sensitivity[Math.max(0, Math.round(rank) - 1)];

  if (!match) {
    return undefined;
  }

  if (isSimulationParamKey(match.param)) {
    return translate(PARAM_LABEL_KEYS[match.param]);
  }

  return match.param;
}

function insightsAnimationKey(insights: readonly Insight[]): string {
  return insights
    .map(
      (insight) =>
        `${insight.code}:${insight.severity}:${JSON.stringify(insight.params)}`,
    )
    .join("|");
}

/**
 * Bottom-of-screen AI Strategic Copilot.
 * Translates the three engine-issued insight codes; never invents figures or conclusions.
 */
export function AiCopilot({
  insights,
  sensitivity = [],
  selectedMonth,
  status,
  className,
}: AiCopilotProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const stale = status === "stale";

  const ranked =
    insights === null || insights.length === 0
      ? []
      : sortBySeverity(insights).slice(0, 3);

  const runKey = insightsAnimationKey(ranked);

  return (
    <HudPanel
      label={t("ui.copilot")}
      className={cn(
        "w-full",
        stale && "ring-1 ring-status-warning/40",
        className,
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[10px] tracking-[0.18em] text-primary/80 uppercase">
          {t("ui.copilot")}
        </p>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {t("ui.month")} {selectedMonth}
        </p>
      </div>

      {stale ? (
        <p
          role="status"
          className="mb-3 rounded-md border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs leading-relaxed text-status-warning"
        >
          {t("ui.copilotStale")}
        </p>
      ) : null}

      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("ui.copilotEmpty")}</p>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {ranked.map((insight, index) => {
              const severityLabel = t(severityLabelKey(insight.severity));
              const leverLabel = leverLabelForInsight(
                insight,
                sensitivity,
                t,
              );

              return (
                <motion.li
                  key={`${runKey}-${insight.code}-${index}`}
                  layout={!reduceMotion}
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, y: -6 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.28,
                          delay: index * 0.07,
                          ease: "easeOut",
                        }
                  }
                  className="flex items-start gap-3"
                >
                  <SeverityIcon
                    severity={insight.severity}
                    label={severityLabel}
                  />
                  <InsightRenderer
                    insight={insight}
                    leverLabel={leverLabel}
                    className="min-w-0 flex-1"
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </HudPanel>
  );
}
