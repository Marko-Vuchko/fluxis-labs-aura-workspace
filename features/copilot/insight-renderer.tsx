"use client";

import { useEffect } from "react";

import type { Insight, InsightSeverity } from "@/features/simulation/types";
import {
  isInsightKey,
  type DictionaryKey,
  type InsightDictionaryKey,
} from "@/lib/i18n/dictionary";
import { formatNumber } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

/** Ratio params from the engine (0..1, or >1 for capacity). Shown as percent points. */
const RATIO_PARAM_KEYS = new Set([
  "capacity_used",
  "churn_rate",
  "ad_dependency",
  "reach",
  "loss_probability",
  "margin",
  "conv",
  "expected_conv",
]);

const INTEGER_PARAM_KEYS = new Set(["month", "rank", "hires"]);

export type InsightRendererProps = {
  insight: Insight;
  /** Localized lever name injected for REC_* codes (from sensitivity, not invented). */
  leverLabel?: string;
  className?: string;
};

/**
 * Formats engine params for text-only dictionary interpolation.
 * EN and SR receive identical numeric strings (en-US conventions).
 */
export function formatInsightParams(
  params: Readonly<Record<string, number>>,
  extras?: Readonly<Record<string, string>>,
): Readonly<Record<string, string | number>> {
  const formatted: Record<string, string | number> = { ...(extras ?? {}) };

  for (const [key, value] of Object.entries(params)) {
    if (!Number.isFinite(value)) {
      formatted[key] = String(value);
      continue;
    }

    if (INTEGER_PARAM_KEYS.has(key)) {
      formatted[key] = formatNumber(value, 0);
      continue;
    }

    if (RATIO_PARAM_KEYS.has(key)) {
      formatted[key] = formatNumber(value * 100, 1);
      continue;
    }

    formatted[key] = formatNumber(value, 2);
  }

  return formatted;
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
 * Renders one engine-issued insight code as localized text.
 * Unknown codes never crash the UI; they log a console warning and show a fallback.
 */
export function InsightRenderer({
  insight,
  leverLabel,
  className,
}: InsightRendererProps) {
  const { t } = useLanguage();
  const dictionaryKey = `insights.${insight.code}`;
  const known = isInsightKey(dictionaryKey);

  useEffect(() => {
    if (!known) {
      console.warn(
        `[Aura Copilot] Unknown insight code "${insight.code}". Showing fallback.`,
      );
    }
  }, [known, insight.code]);

  const extras =
    leverLabel !== undefined ? { param: leverLabel } : undefined;

  let text: string;
  if (known) {
    const key: InsightDictionaryKey = dictionaryKey;
    text = t(key, formatInsightParams(insight.params, extras));
  } else {
    text = t("insights.unknown", { code: insight.code });
  }

  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-foreground/90",
        !known && "text-muted-foreground",
        className,
      )}
      data-insight-code={insight.code}
      data-insight-severity={insight.severity}
      aria-label={`${t(severityLabelKey(insight.severity))}: ${text}`}
    >
      {text}
    </p>
  );
}
