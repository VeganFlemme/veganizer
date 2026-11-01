import { describe, expect, it } from "vitest";
import { formatEur, formatValue, gapSentence, MISSING } from "@/lib/format";

// Intl uses narrow no-break spaces in fr-FR; normalise them for readable assertions.
const n = (s: string) => s.replace(/[  ]/g, " ");

describe("format", () => {
  it("never shows 0 for missing data", () => {
    expect(formatValue(null)).toBe(MISSING);
    expect(formatValue(undefined)).toBe(MISSING);
    expect(formatEur(null)).toBe(MISSING);
  });
  it("keeps a real zero and negative values", () => {
    expect(formatValue(0)).toBe("0");
    expect(formatValue(-1.234)).toBe("-1,23");
    expect(formatValue(0.000593)).toBe("0,000593");
  });
  it("uses French decimals", () => {
    expect(formatValue(5.034)).toBe("5,03");
    expect(n(formatEur(1.2876))).toBe("1,29 €");
  });
  it("words the gap from the plant dish point of view", () => {
    expect(gapSentence(87.4)).toBe("87 % de moins");
    expect(gapSentence(-20)).toBe("20 % de plus");
    expect(gapSentence(0.2)).toBe("à peu près pareil");
    expect(gapSentence(null)).toBe("écart non calculable");
  });
});
