// Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { avoidedClimateCost, climateCostByYear, totalClimateCost, type MonetizationFactor, type MonetizationRule, type Simulation } from "@/lib/scoring";

const factors: MonetizationFactor[] = [
  { indicatorId: "ghg_100y_kgco2e", year: 2025, eurPerUnit: 0.1, method: "m", sourceId: "s" },
  { indicatorId: "ghg_100y_kgco2e", year: 2027, eurPerUnit: 0.5, method: "m", sourceId: "s" },
];
const rules: MonetizationRule[] = [{ indicatorId: "ghg_100y_kgco2e", method: "m", growthRate: 0.1, startYear: 2025, capYear: 2030, sourceId: "s" }];

describe("climateCostByYear", () => {
  it("uses the carbon value of each year, published first, then the growth rule", () => {
    const rows = climateCostByYear(10, 2025, 3, factors, { rules });
    expect(rows.map((r) => r.year)).toEqual([2025, 2026, 2027]);
    expect(rows[0].eur).toBeCloseTo(1); // 10 × 0.1
    expect(rows[1].eur).toBeCloseTo(1.1); // 10 × 0.1 × 1.1 (rule)
    expect(rows[1].derived).toBe(true);
    expect(rows[2].eur).toBeCloseTo(5); // published 2027 value wins
    expect(totalClimateCost(rows)).toBeCloseTo(7.1);
  });

  it("never totals a partial series", () => {
    const rows = climateCostByYear(10, 2024, 2, factors, { rules }); // 2024: before the rule, no value
    expect(rows[0].eur).toBeNull();
    expect(totalClimateCost(rows)).toBeNull();
  });

  it("keeps missing emissions missing", () => {
    expect(climateCostByYear(null, 2025, 1, factors)[0].eur).toBeNull();
  });
});

describe("avoidedClimateCost", () => {
  const sim = (avoided: number | null): Simulation => ({
    servings: 52,
    impacts: { ghg_100y_kgco2e: { avoided, avoidedLow: avoided, avoidedHigh: avoided, minCoverage: 1 } },
    animalImpacts: {},
  });
  it("values all avoided kg with the reference year only", () => {
    const c = avoidedClimateCost(sim(100), 2025, factors, { rules });
    expect(c?.eur).toBeCloseTo(10); // 100 kg × 0.1 (2025)
    expect(c?.year).toBe(2025);
  });
  it("is missing when emissions are missing", () => {
    expect(avoidedClimateCost(sim(null), 2025, factors)).toBeNull();
  });
});
