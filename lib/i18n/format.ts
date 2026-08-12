/**
 * Compact and full number formatting.
 * Always uses English (en-US) conventions in both UI languages (PRD FR-7).
 */

const fullNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const fullIntegerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}

/**
 * Compact display for HUD figures, e.g. 284312 -> "284.3k".
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${sign}${trimTrailingZero((abs / 1_000_000_000).toFixed(1))}b`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${trimTrailingZero((abs / 1_000_000).toFixed(1))}m`;
  }
  if (abs >= 1_000) {
    return `${sign}${trimTrailingZero((abs / 1_000).toFixed(1))}k`;
  }

  return `${sign}${fullNumberFormatter.format(abs)}`;
}

/**
 * Full value for tooltips, e.g. 284312 -> "284,312 USD".
 */
export function formatFull(
  value: number,
  currency = "USD",
  options?: { integers?: boolean },
): string {
  if (!Number.isFinite(value)) {
    return `0 ${currency}`;
  }

  const formatted = options?.integers
    ? fullIntegerFormatter.format(value)
    : fullNumberFormatter.format(value);

  return `${formatted} ${currency}`;
}

/**
 * Tooltip body: full value, then optional p10 / p90 lines underneath.
 * Percentile labels come from the caller so both locales stay in the dictionary.
 */
export function formatRangeTooltip(
  value: number,
  currency = "USD",
  range?: { p10: number; p90: number },
  labels: { p10: string; p90: string } = { p10: "p10", p90: "p90" },
): string {
  const lines = [formatFull(value, currency)];

  if (range) {
    lines.push(`${labels.p10} ${formatFull(range.p10, currency)}`);
    lines.push(`${labels.p90} ${formatFull(range.p90, currency)}`);
  }

  return lines.join("\n");
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}
