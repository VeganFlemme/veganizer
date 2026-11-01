// View switcher texts (suite V1, step 1). Fixture values are invented.
import { describe, expect, it } from "vitest";
import { additionLine, co2Summary, completedSentence, isViewId, scaleSentence } from "@/lib/compare/views";

const nb = (s: string | null) => (s ?? "").replace(/[  ]/g, " ");

describe("views", () => {
  it("accepts only the known views (?vue=)", () => {
    expect(isViewId("proteines")).toBe(true);
    expect(isViewId("portion")).toBe(true);
    expect(isViewId("x")).toBe(false);
    expect(isViewId(null)).toBe(false);
  });
  it("gives both CO2e results", () => {
    expect(nb(co2Summary(87.2, 81.6))).toBe("CO₂e : −87 % par portion, −82 % à protéines égales");
    expect(nb(co2Summary(87.2, null))).toBe("CO₂e : −87 % par portion");
    expect(co2Summary(null, null)).toBeNull();
  });
  it("shows the factor and the weight obtained", () => {
    expect(nb(scaleSentence({ factor: 1.2537, gramsPerServing: 541.6, baseGramsPerServing: 432 }, 48.64))).toBe(
      "Version végétale × 1,25 : 542 g par portion au lieu de 432 g, pour autant de protéines que le plat animal (48,6 g).",
    );
  });
});

describe("view with complements (S24)", () => {
  it("is a third view", () => {
    expect(isViewId("complements")).toBe(true);
  });
  it("says what changes once the plant version is completed", () => {
    expect(nb(completedSentence(82.4))).toBe("Même complétée, la version végétale émet 82 % de CO₂e en moins.");
    expect(nb(completedSentence(-5))).toBe("Complétée, la version végétale émet 5 % de CO₂e en plus.");
    expect(completedSentence(null)).toBeNull();
  });
  it("describes an addition: food, grams, nutrients closed", () => {
    expect(nb(additionLine({ label: "graines de sésame", gramsPerServing: 2.3, nutrients: ["ca_mg"] }, { ca_mg: "Calcium" }))).toBe("2,3 g de graines de sésame par portion (calcium)");
  });
});
