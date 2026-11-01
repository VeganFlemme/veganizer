// View switcher texts (suite V1, step 1). Fixture values are invented.
import { describe, expect, it } from "vitest";
import { co2Summary, isViewId, scaleSentence } from "@/lib/compare/views";

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
