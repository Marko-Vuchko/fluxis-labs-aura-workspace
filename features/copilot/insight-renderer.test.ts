import { describe, expect, it } from "vitest";

import { formatInsightParams } from "@/features/copilot/insight-renderer";
import { interpolate, translate } from "@/lib/i18n/dictionary";

describe("insight interpolation", () => {
  it("formats ratio params as percent points without HTML", () => {
    const formatted = formatInsightParams({
      capacity_used: 1.2,
      hires: 2,
      month: 12,
    });
    expect(formatted.capacity_used).toBe("120");
    expect(formatted.hires).toBe("2");
    expect(formatted.month).toBe("12");
  });

  it("injects tokens as plain text even when params look like markup", () => {
    const text = interpolate("Insight kod {code} nije u recniku.", {
      code: "<script>alert(1)</script>",
    });
    expect(text).toBe("Insight kod <script>alert(1)</script> nije u recniku.");
    expect(text.startsWith("<p")).toBe(false);
    expect(text.includes("<html")).toBe(false);
  });

  it("localizes a known insight code with numeric params only", () => {
    const params = formatInsightParams({ capacity_used: 0.93, month: 12 });
    const en = translate("en", "insights.CAP_NEAR_LIMIT", params);
    const sr = translate("sr", "insights.CAP_NEAR_LIMIT", params);
    expect(en).toContain("93");
    expect(en).toContain("12");
    expect(sr).toContain("93");
    expect(en).not.toMatch(/<[^>]+>/);
    expect(sr).not.toMatch(/<[^>]+>/);
  });
});
