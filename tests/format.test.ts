import { describe, expect, it } from "vitest";
import { animalsSpared, formatEur, formatForUnit, formatPerServing, formatValue, gapSentence, MISSING, publicLicense, signedGap, withUnit } from "@/lib/format";

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
    expect(gapSentence(87.4)).toBe("87\u00a0% de moins");
    expect(gapSentence(-20)).toBe("20\u00a0% de plus");
    expect(gapSentence(0.2)).toBe("à peu près pareil");
    expect(gapSentence(null)).toBe("écart non calculable");
  });
});

describe("signedGap and withUnit", () => {
  it("writes the gap with a sign and a no-break space", () => {
    expect(signedGap(87.4)).toBe("−87\u00a0%");
    expect(signedGap(-12)).toBe("+12\u00a0%");
    expect(signedGap(null)).toBe("donnée manquante");
  });
  it("joins value and unit with a no-break space, never for missing data", () => {
    expect(withUnit(5.034, "kg")).toBe("5,03\u00a0kg");
    expect(withUnit(null, "kg")).toBe("donnée manquante");
  });
});

describe("one rounding rule per unit (review of PR #15)", () => {
  it("kg CO2e: always 2 decimals", () => {
    expect(formatForUnit(0.647, "kg CO2e")).toBe("0,65");
    expect(formatForUnit(1.2, "kg CO2e")).toBe("1,20");
    expect(formatForUnit(1, "kg CO2e")).toBe("1,00");
    expect(formatForUnit(5.034, "kg CO2e")).toBe("5,03");
  });
  it("kg CO2e: a non-zero value below the precision is written as a bound, never 0,00", () => {
    expect(formatForUnit(0.0021, "kg CO2e")).toBe("< 0,01");
    expect(formatForUnit(-0.0021, "kg CO2e")).toBe("> −0,01");
    expect(formatForUnit(0, "kg CO2e")).toBe("0,00");
  });
  it("nutrients and other units: 3 significant digits", () => {
    expect(formatForUnit(48.64, "g")).toBe("48,6");
    expect(formatForUnit(483.2, "kcal")).toBe("483");
    expect(formatForUnit(0.0123, "mg")).toBe("0,0123");
  });
  it("missing stays missing", () => {
    expect(formatForUnit(null, "kg CO2e")).toBe(MISSING);
  });
});

describe("animalsSpared", () => {
  it("writes a low estimate, rounded down to 2 significant digits, never more than computed", () => {
    expect(animalsSpared(0.0308)).toBe("au moins 0,03 animal épargné");
    expect(animalsSpared(1.64)).toBe("au moins 1,6 animal épargné");
    expect(animalsSpared(16.4)).toBe("au moins 16 animaux épargnés");
    expect(animalsSpared(0.399)).toBe("au moins 0,39 animal épargné");
  });
  it("is missing data without a figure", () => {
    expect(animalsSpared(null)).toBe(MISSING);
  });
});

describe("publicLicense", () => {
  it("shows a known licence and hides the internal follow-up notes", () => {
    expect(publicLicense("Licence Ouverte 2.0")).toBe("Licence Ouverte 2.0");
    expect(publicLicense("À vérifier (document public, conditions de réutilisation non lues)")).toBeNull();
    expect(publicLicense("à vérifier")).toBeNull();
    expect(publicLicense("")).toBeNull();
  });
});

describe("per 1 000 servings (suite V1, S23)", () => {
  it("writes a small number of animals per serving for 1 000 servings", () => {
    expect(n(formatPerServing(0.00771, "animaux"))).toBe("7,71 pour 1 000 portions");
    expect(n(formatPerServing(0.0000938, "poissons"))).toBe("0,0938 pour 1 000 portions");
  });
  it("keeps other values and units as they are", () => {
    expect(formatPerServing(2, "animaux")).toBe("2");
    expect(formatPerServing(0, "animaux")).toBe("0");
    expect(formatPerServing(0.65, "kg CO2e")).toBe("0,65");
    expect(formatPerServing(null, "animaux")).toBe(MISSING);
  });
});
