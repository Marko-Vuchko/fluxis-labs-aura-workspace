import { describe, expect, it } from "vitest";

import { translate } from "@/lib/i18n/dictionary";
import {
  formatCompact,
  formatFull,
  formatRangeTooltip,
} from "@/lib/i18n/format";

describe("formatCompact", () => {
  it("renders thousands with a one-decimal k suffix", () => {
    expect(formatCompact(284_312)).toBe("284.3k");
  });

  it("trims a trailing .0", () => {
    expect(formatCompact(12_000)).toBe("12k");
  });

  it("renders millions and billions", () => {
    expect(formatCompact(2_500_000)).toBe("2.5m");
    expect(formatCompact(1_200_000_000)).toBe("1.2b");
  });

  it("keeps a leading minus for negative values", () => {
    expect(formatCompact(-1_500)).toBe("-1.5k");
  });

  it("returns 0 for non-finite input", () => {
    expect(formatCompact(Number.NaN)).toBe("0");
    expect(formatCompact(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("formatFull and range tooltips", () => {
  it("appends the currency code", () => {
    expect(formatFull(284_312, "USD", { integers: true })).toBe("284,312 USD");
  });

  it("uses caller-supplied p10/p90 labels", () => {
    const tooltip = formatRangeTooltip(
      100,
      "USD",
      { p10: 80, p90: 140 },
      { p10: "p10", p90: "p90" },
    );
    expect(tooltip).toBe("100 USD\np10 80 USD\np90 140 USD");
  });
});

describe("PROFITABLE copy", () => {
  it("lives in the dictionary for both locales", () => {
    expect(translate("en", "ui.profitable")).toBe("PROFITABLE");
    expect(translate("sr", "ui.profitable")).toBe("PROFITABILNO");
  });
});
