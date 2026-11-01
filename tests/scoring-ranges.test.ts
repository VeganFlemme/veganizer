// Ranges, "< x" values, shared ingredients and the display rounding of the verdicts
// (corrections after the review of PR #15, decisions of Matt of 2026-11-01).
// All numbers are FICTITIOUS test fixtures.
import { describe, expect, it } from "vitest";
import {
  amountBounds,
  compareDishes,
  dishTotals,
  judgeRanges,
  roundForUnit,
  scoreIndicator,
  verdictTotals,
  withoutSharedIngredients,
  type Conseil,
  type Directions,
  type FoodData,
  type ScoringData,
} from "@/lib/scoring";

const food = (f: Partial<FoodData>): FoodData => ({ nutrients: {}, impacts: {}, isAnimal: false, animalCategory: null, ...f });

const data: ScoringData = {
  foods: {
    // "< 0,5" g of fat per 100 g: known to lie between 0 and 0.5.
    WINE: food({ nutrients: { energy_eu_kcal: 80, protein_g: 0, fiber_g: null, salt_g: null }, nutrientMax: { fat_g: 0.5, salt_g: 2 } }),
    MEAT: food({
      nutrients: { energy_eu_kcal: 200, protein_g: 20, fat_g: 10, fiber_g: 0, salt_g: 0.2, fa_c20_5_n3_epa_g: 0.1, fa_c22_6_n3_dha_g: 0.2 },
      isAnimal: true,
      animalCategory: "bovin",
    }),
    BEAN: food({ nutrients: { energy_eu_kcal: 100, protein_g: 10, fat_g: 1, fiber_g: 6, salt_g: 0.01, fa_c20_5_n3_epa_g: 0 }, nutrientMax: { fa_c22_6_n3_dha_g: 0.01 } }),
    // EPA known, DHA missing: no EPA + DHA for this ingredient.
    HALF: food({ nutrients: { energy_eu_kcal: 50, protein_g: 1, fa_c20_5_n3_epa_g: 0.3 } }),
    // Energy only known as "< x": no exact energy total.
    FUZZY: food({ nutrients: { protein_g: 1 }, nutrientMax: { energy_eu_kcal: 10 } }),
  },
  categoryFactors: {},
};

const SUMS = { fa_epa_dha_g: ["fa_c20_5_n3_epa_g", "fa_c22_6_n3_dha_g"] };

describe("dishTotals with values published as « < x » (Ciqual)", () => {
  it("counts them as a known interval [0 ; x]: covered, low bound with 0, high bound with x, no central value", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "WINE", grams: 200 }] }, data);
    expect(t.nutrients.fat_g.massCoverage).toBe(1);
    expect(t.nutrients.fat_g.lowPerServing).toBe(0);
    expect(t.nutrients.fat_g.highPerServing).toBeCloseTo(1); // 200 g × 0.5 / 100
    expect(t.nutrients.fat_g.perServing).toBeNull(); // never x/2, never 0
    expect(t.nutrients.fat_g.censored).toBe(true);
  });

  it("adds exact values to both bounds", () => {
    const t = dishTotals({ servings: 2, ingredients: [{ foodCode: "WINE", grams: 200 }, { foodCode: "MEAT", grams: 100 }] }, data);
    expect(t.nutrients.fat_g.lowPerServing).toBeCloseTo(5); // (0 + 10) / 2
    expect(t.nutrients.fat_g.highPerServing).toBeCloseTo(5.5); // (1 + 10) / 2
    expect(t.nutrients.fat_g.perServing).toBeNull();
    expect(t.nutrients.protein_g.perServing).toBeCloseTo(10);
    expect(t.nutrients.protein_g.censored).toBeFalsy();
  });

  it("keeps a plain missing value missing (lower coverage), even when another ingredient has « < x »", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "WINE", grams: 100 }, { foodCode: "MEAT", grams: 100 }] }, data);
    expect(t.nutrients.fiber_g.massCoverage).toBe(0.5);
    expect(t.nutrients.salt_g.massCoverage).toBe(1); // "< 2" for the wine: covered
  });

  it("has no central value per 100 g when only a range is known", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "FUZZY", grams: 100 }] }, data);
    expect(t.kcalPerServing).toBeNull();
  });

  it("sums EPA and DHA ingredient by ingredient, only where both are known", () => {
    const t = dishTotals(
      { servings: 1, ingredients: [{ foodCode: "MEAT", grams: 100 }, { foodCode: "BEAN", grams: 100 }, { foodCode: "HALF", grams: 100 }] },
      data,
      { nutrientSums: SUMS },
    );
    const s = t.nutrients.fa_epa_dha_g;
    expect(s.massCoverage).toBeCloseTo(2 / 3);
    expect(s.lowPerServing).toBeCloseTo(0.3); // 0.1 + 0.2 + 0 + 0
    expect(s.highPerServing).toBeCloseTo(0.31); // + 0.01 for the "< 0,01" DHA of BEAN
    expect(s.perServing).toBeNull();
  });
});

describe("amountBounds", () => {
  it("scales the per serving range to the basis", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "WINE", grams: 100 }, { foodCode: "MEAT", grams: 100 }] }, data);
    // energy 280 kcal, protein 20 g; fat 10 to 10.5 g
    expect(amountBounds(t.nutrients.fat_g, "perServing", t)).toEqual({ low: 10, high: 10.5 });
    // 200 g per serving: per 100 g = half
    const k = amountBounds(t.nutrients.fat_g, "per100g", t)!;
    expect(k.low).toBeCloseTo(5);
    expect(k.high).toBeCloseTo(5.25);
  });
});

describe("roundForUnit: one rounding rule per unit", () => {
  it("kg CO2e and euros: 2 decimals", () => {
    expect(roundForUnit(0.647, "kg CO2e")).toBe(0.65);
    expect(roundForUnit(1.2, "kg CO2e")).toBe(1.2);
    expect(roundForUnit(1.2876, "€")).toBe(1.29);
  });
  it("other units: 3 significant digits", () => {
    expect(roundForUnit(48.64, "g")).toBe(48.6);
    expect(roundForUnit(0.0012345, "mg")).toBe(0.00123);
    expect(roundForUnit(0, "g")).toBe(0);
  });
});

describe("judgeRanges: a point only when the ranges do not overlap", () => {
  const lower = false;
  it("gives the point when the ranges are apart", () => {
    expect(judgeRanges({ low: 4, high: 5 }, { low: 1, high: 2 }, lower, "g")).toBe("vegetal");
    expect(judgeRanges({ low: 4, high: 5 }, { low: 1, high: 2 }, true, "g")).toBe("animal");
  });
  it("is a tie when they overlap", () => {
    expect(judgeRanges({ low: 1, high: 3 }, { low: 2, high: 4 }, lower, "g")).toBe("egal");
  });
  it("is a tie for equal values after display rounding", () => {
    expect(judgeRanges({ low: 0.651, high: 0.651 }, { low: 0.649, high: 0.649 }, lower, "kg CO2e")).toBe("egal");
    expect(judgeRanges({ low: 0.66, high: 0.66 }, { low: 0.649, high: 0.649 }, lower, "kg CO2e")).toBe("vegetal");
  });
});

describe("scoreIndicator with ranges", () => {
  const opts = { significantDigits: 3 };
  const rule = { id: "fat_g", direction: "lower_is_better" as const };
  it("counts a range-only value (« < x ») and gives no point when the ranges overlap", () => {
    expect(scoreIndicator(rule, { animal: null, vegetal: 2, animalRange: { low: 1, high: 3 } }, opts).outcome).toBe("egal");
    expect(scoreIndicator(rule, { animal: null, vegetal: 0.5, animalRange: { low: 1, high: 3 } }, opts).outcome).toBe("vegetal");
  });
  it("still treats no value and no range as missing", () => {
    expect(scoreIndicator(rule, { animal: null, vegetal: 2 }, opts).outcome).toBe("manquant");
  });
  it("uses the rounding of the unit for ties", () => {
    const co2 = { id: "ghg_100y_kgco2e", direction: "lower_is_better" as const };
    expect(scoreIndicator(co2, { animal: 0.651, vegetal: 0.649, unit: "kg CO2e" }, opts).outcome).toBe("egal");
  });
});

describe("ingredients identical on both sides", () => {
  const animal = { servings: 2, ingredients: [{ foodCode: "MEAT", grams: 400 }, { foodCode: "WINE", grams: 200 }] };
  const plant = { servings: 2, ingredients: [{ foodCode: "BEAN", grams: 400 }, { foodCode: "WINE", grams: 200 }] };

  it("finds them (same code, same grams per serving) and removes them from both dishes", () => {
    const r = withoutSharedIngredients(animal, plant);
    expect(r.shared).toEqual(["WINE"]);
    expect(r.animal?.ingredients).toEqual([{ foodCode: "MEAT", grams: 400 }]);
    expect(r.vegetal?.ingredients).toEqual([{ foodCode: "BEAN", grams: 400 }]);
  });

  it("does not treat a different quantity as identical", () => {
    const r = withoutSharedIngredients(animal, { ...plant, ingredients: [{ foodCode: "BEAN", grams: 400 }, { foodCode: "WINE", grams: 100 }] });
    expect(r.shared).toEqual([]);
  });

  it("verdict totals ignore their mass: a value they lack no longer lowers the coverage of the verdict", () => {
    const full = dishTotals(animal, data);
    expect(full.nutrients.fiber_g.massCoverage).toBeCloseTo(2 / 3);
    const v = verdictTotals(animal, plant, data);
    expect(v.animal.nutrients.fiber_g.massCoverage).toBe(1);
    expect(v.vegetal.nutrients.fiber_g.massCoverage).toBe(1);
    // and the shared « < 2 » salt of the wine no longer widens the ranges
    expect(v.animal.nutrients.salt_g.highPerServing).toBeCloseTo(0.4);
  });

  it("an empty remainder counts as a real 0 with full coverage", () => {
    const v = verdictTotals(plant, { ...plant, ingredients: [...plant.ingredients, { foodCode: "MEAT", grams: 100 }] }, data);
    expect(v.animal.nutrients.protein_g.perServing).toBe(0);
    expect(v.animal.nutrients.protein_g.massCoverage).toBe(1);
  });
});

describe("compareDishes with ranges and verdict totals", () => {
  const directions: Directions = { fat_g: { higherIsBetter: false }, fiber_g: { higherIsBetter: true }, protein_g: { higherIsBetter: true } };
  const conseils: Conseil[] = [];
  it("gives no winner when the ranges overlap, a winner when they do not", () => {
    const a = dishTotals({ servings: 1, ingredients: [{ foodCode: "WINE", grams: 1000 }] }, data); // fat 0 to 5
    const v = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEAN", grams: 100 }] }, data); // fat 1
    expect(compareDishes(a, v, { directions, conseils }).criteria.fat_g.winner).toBe("egal");
    const m = dishTotals({ servings: 1, ingredients: [{ foodCode: "MEAT", grams: 100 }] }, data); // fat 10
    expect(compareDishes(m, v, { directions, conseils }).criteria.fat_g.winner).toBe("vegetal");
  });

  it("judges on the verdict totals when given, shows the full values", () => {
    const animal = { servings: 1, ingredients: [{ foodCode: "MEAT", grams: 100 }, { foodCode: "WINE", grams: 100 }] };
    const plant = { servings: 1, ingredients: [{ foodCode: "BEAN", grams: 100 }, { foodCode: "WINE", grams: 100 }] };
    const fa = dishTotals(animal, data);
    const fv = dishTotals(plant, data);
    const c = compareDishes(fa, fv, { directions, conseils, verdict: verdictTotals(animal, plant, data) });
    expect(c.criteria.fiber_g.vegetal).toBeCloseTo(6);
    expect(c.criteria.fiber_g.minCoverage).toBe(0.5); // displayed coverage
    expect(c.criteria.fiber_g.verdictCoverage).toBe(1); // coverage of the verdict
    expect(c.criteria.fiber_g.winner).toBe("vegetal");
  });
});
