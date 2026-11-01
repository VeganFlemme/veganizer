// Scoring engine tests. All numbers below are FICTITIOUS test fixtures,
// chosen for easy arithmetic: they are not real nutrient or impact values.
import { describe, expect, it } from "vitest";
import {
  compareDishes,
  dishTotals,
  monetize,
  simulate,
  type Conseil,
  type Directions,
  type FoodData,
  type MonetizationFactor,
  type ScoringData,
} from "@/lib/scoring";

const impact = (value: number, low: number | null = null, high: number | null = null, dqr: number | null = null) => ({
  value,
  low,
  high,
  dqr,
  sourceId: "test-src",
});

const food = (f: Partial<FoodData>): FoodData => ({
  nutrients: {},
  impacts: {},
  isAnimal: false,
  animalCategory: null,
  ...f,
});

const data: ScoringData = {
  foods: {
    BEEF: food({
      nutrients: { energy_eu_kcal: 200, protein_g: 20, vit_b12_ug: 2, fe_mg: 3 },
      impacts: { ghg_100y_kgco2e: impact(30, 20, 40, 2.5), land_use_pt: impact(100) },
      isAnimal: true,
      animalCategory: "bovin",
    }),
    LENTIL: food({
      nutrients: { energy_eu_kcal: 100, protein_g: 10, vit_b12_ug: 0, fe_mg: 4 },
      impacts: { ghg_100y_kgco2e: impact(1, 0.5, 1.5, 1.5), land_use_pt: impact(-5) },
    }),
    // Has nutrients but no impact and no B12 value at all.
    ONION: food({
      nutrients: { energy_eu_kcal: 40, protein_g: 1, vit_b12_ug: null },
    }),
    ZERO: food({
      nutrients: { energy_eu_kcal: 50, protein_g: 5 },
      impacts: { ghg_100y_kgco2e: impact(0) },
    }),
    MYSTERY_MEAT: food({ isAnimal: true, animalCategory: null, nutrients: { energy_eu_kcal: 100 } }),
  },
  categoryFactors: {
    bovin: { animals_killed_land: { value: 0.004, low: 0.003, high: 0.005, sourceId: "test-cat" } },
  },
};

describe("dishTotals", () => {
  it("a single-ingredient dish returns exactly the source value", () => {
    // 1 kg, 1 serving: per serving = value per kg; 100 g of nutrients = value per 100 g × 10.
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 1000 }] }, data);
    const ghg = t.impacts.ghg_100y_kgco2e;
    expect(ghg.perServing).toBe(30);
    expect(ghg.lowPerServing).toBe(20);
    expect(ghg.highPerServing).toBe(40);
    expect(ghg.worstDqr).toBe(2.5);
    expect(ghg.massCoverage).toBe(1);
    expect(ghg.sourceIds).toEqual(["test-src"]);

    const t100 = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 100 }] }, data);
    expect(t100.nutrients.protein_g.perServing).toBe(10);
    expect(t100.nutrients.fe_mg.perServing).toBe(4);
  });

  it("divides the recipe by the number of servings", () => {
    const t = dishTotals({ servings: 4, ingredients: [{ foodCode: "BEEF", grams: 400 }] }, data);
    // 0.4 kg × 30 / 4
    expect(t.impacts.ghg_100y_kgco2e.perServing).toBeCloseTo(3);
    expect(t.totalGrams).toBe(400);
  });

  it("a missing value is not a zero: it lowers coverage, the known part is kept", () => {
    const t = dishTotals(
      {
        servings: 1,
        ingredients: [
          { foodCode: "BEEF", grams: 300 },
          { foodCode: "ONION", grams: 100 },
        ],
      },
      data,
    );
    const ghg = t.impacts.ghg_100y_kgco2e;
    expect(ghg.perServing).toBeCloseTo(9); // 0.3 × 30, onion not counted
    expect(ghg.massCoverage).toBeCloseTo(0.75);
    // B12 explicitly null for onion: also missing, not 0
    expect(t.nutrients.vit_b12_ug.massCoverage).toBeCloseTo(0.75);
  });

  it("returns null (donnée manquante), never 0, when no ingredient has the value", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "ONION", grams: 100 }] }, data);
    // ONION has no impact at all: the indicator is absent, so readers get undefined, not 0.
    expect(t.impacts.ghg_100y_kgco2e).toBeUndefined();
    const mixed = dishTotals(
      {
        servings: 1,
        ingredients: [
          { foodCode: "ONION", grams: 100 },
          { foodCode: "BEEF", grams: 100 },
        ],
      },
      data,
    );
    // vit_b12 known for BEEF only
    expect(mixed.nutrients.vit_b12_ug.perServing).toBeCloseTo(2);
    // an unknown food code is missing data too
    const unknown = dishTotals({ servings: 1, ingredients: [{ foodCode: "NOPE", grams: 100 }] }, data);
    expect(unknown.impacts).toEqual({});
    expect(unknown.kcalPerServing).toBeNull();
  });

  it("a published zero is a real zero (full coverage)", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "ZERO", grams: 200 }] }, data);
    expect(t.impacts.ghg_100y_kgco2e.perServing).toBe(0);
    expect(t.impacts.ghg_100y_kgco2e.massCoverage).toBe(1);
  });

  it("keeps published negative values as they are", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 1000 }] }, data);
    expect(t.impacts.land_use_pt.perServing).toBe(-5);
    const mixed = dishTotals(
      {
        servings: 1,
        ingredients: [
          { foodCode: "LENTIL", grams: 1000 },
          { foodCode: "BEEF", grams: 10 },
        ],
      },
      data,
    );
    expect(mixed.impacts.land_use_pt.perServing).toBeCloseTo(-5 + 1);
  });

  it("uses the central value when a bound is not published (as dish_impacts does)", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 1000 }] }, data);
    expect(t.impacts.land_use_pt.lowPerServing).toBe(-5);
    expect(t.impacts.land_use_pt.highPerServing).toBe(-5);
  });

  it("reports the worst DQR among covered ingredients", () => {
    const t = dishTotals(
      {
        servings: 1,
        ingredients: [
          { foodCode: "BEEF", grams: 100 },
          { foodCode: "LENTIL", grams: 100 },
        ],
      },
      data,
    );
    expect(t.impacts.ghg_100y_kgco2e.worstDqr).toBe(2.5);
  });

  it("normalises per 100 kcal and per 10 g of protein", () => {
    // 100 g beef: 200 kcal, 20 g protein, 3 kg CO2e
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 100 }] }, data);
    expect(t.kcalPerServing).toBe(200);
    expect(t.proteinPerServing).toBe(20);
    expect(t.impacts.ghg_100y_kgco2e.per100kcal).toBeCloseTo(1.5);
    expect(t.impacts.ghg_100y_kgco2e.per10gProtein).toBeCloseTo(1.5);
    expect(t.nutrients.fe_mg.per100kcal).toBeCloseTo(1.5);
  });

  it("does not normalise on a partial energy or protein total", () => {
    // MYSTERY_MEAT has energy but no protein value and no impact
    const t = dishTotals(
      {
        servings: 1,
        ingredients: [
          { foodCode: "BEEF", grams: 100 },
          { foodCode: "MYSTERY_MEAT", grams: 100 },
        ],
      },
      data,
    );
    expect(t.kcalPerServing).toBe(300);
    expect(t.proteinPerServing).toBeNull();
    expect(t.impacts.ghg_100y_kgco2e.per10gProtein).toBeNull();
    expect(t.impacts.ghg_100y_kgco2e.per100kcal).toBeCloseTo(1);
  });

  it("computes animal impacts from category factors; plant foods count as 0, unknown categories as missing", () => {
    const t = dishTotals(
      {
        servings: 2,
        ingredients: [
          { foodCode: "BEEF", grams: 500 },
          { foodCode: "LENTIL", grams: 300 },
          { foodCode: "MYSTERY_MEAT", grams: 200 },
        ],
      },
      data,
    );
    const a = t.animalImpacts.animals_killed_land;
    expect(a.perServing).toBeCloseTo((0.5 * 0.004) / 2);
    expect(a.lowPerServing).toBeCloseTo((0.5 * 0.003) / 2);
    expect(a.highPerServing).toBeCloseTo((0.5 * 0.005) / 2);
    expect(a.massCoverage).toBeCloseTo(0.8);

    const veg = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 100 }] }, data);
    expect(veg.animalImpacts.animals_killed_land.perServing).toBe(0);
    expect(veg.animalImpacts.animals_killed_land.massCoverage).toBe(1);
  });

  it("rejects invalid dishes", () => {
    expect(() => dishTotals({ servings: 0, ingredients: [{ foodCode: "BEEF", grams: 1 }] }, data)).toThrow();
    expect(() => dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 0 }] }, data)).toThrow();
    expect(() => dishTotals({ servings: 1, ingredients: [] }, data)).toThrow();
  });
});

const directions: Directions = {
  ghg_100y_kgco2e: { higherIsBetter: false },
  land_use_pt: { higherIsBetter: false },
  animals_killed_land: { higherIsBetter: false },
  protein_g: { higherIsBetter: true },
  vit_b12_ug: { higherIsBetter: true },
  fe_mg: { higherIsBetter: true },
};

const conseils: Conseil[] = [
  {
    id: "test-b12",
    criteria: ["vit_b12_ug"],
    titre: "Test B12",
    texte: "Conseil fictif",
    sources: [{ publisher: "Test", title: "Test", url: "https://example.org", accessedOn: "2026-11-01" }],
  },
];

describe("compareDishes", () => {
  const beef = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 100 }] }, data);
  const lentil = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 100 }] }, data);
  const zero = dishTotals({ servings: 1, ingredients: [{ foodCode: "ZERO", grams: 100 }] }, data);

  it("gives a 100 % gap when the plant dish is 0", () => {
    const c = compareDishes(beef, zero, { directions, conseils });
    expect(c.criteria.ghg_100y_kgco2e.gapPercent).toBe(100);
    expect(c.criteria.ghg_100y_kgco2e.winner).toBe("vegetal");
  });

  it("follows (animal − plant) / animal for lower-is-better indicators", () => {
    const c = compareDishes(beef, lentil, { directions, conseils });
    // 3 vs 0.1 kg CO2e
    expect(c.criteria.ghg_100y_kgco2e.gapPercent).toBeCloseTo(((3 - 0.1) / 3) * 100);
  });

  it("flips the sign for higher-is-better criteria and lists where the animal dish does better, with a solution", () => {
    const c = compareDishes(beef, lentil, { directions, conseils });
    // protein 20 vs 10: plant is 50 % lower → −50 (animal better)
    expect(c.criteria.protein_g.gapPercent).toBeCloseTo(-50);
    expect(c.criteria.protein_g.winner).toBe("animal");
    // iron 3 vs 4: plant better
    expect(c.criteria.fe_mg.winner).toBe("vegetal");

    const ids = c.animalBetter.map((a) => a.criterion);
    expect(ids).toContain("vit_b12_ug");
    expect(ids).toContain("protein_g");
    expect(ids).not.toContain("fe_mg");
    expect(c.animalBetter.find((a) => a.criterion === "vit_b12_ug")?.conseil?.id).toBe("test-b12");
    expect(c.animalBetter.find((a) => a.criterion === "protein_g")?.conseil).toBeNull();
  });

  it("uses |animal| so a negative animal value keeps the meaning of the sign", () => {
    const negA = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 1000 }] }, data); // -5
    const posV = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 1000 }] }, data); // 100
    const c = compareDishes(negA, posV, { directions, conseils });
    expect(c.criteria.land_use_pt.winner).toBe("animal");
    expect(c.criteria.land_use_pt.gapPercent).toBeLessThan(0);
  });

  it("returns no gap (donnée manquante) when a side is missing, and no gap when the animal dish is 0", () => {
    const onion = dishTotals({ servings: 1, ingredients: [{ foodCode: "ONION", grams: 100 }] }, data);
    const c = compareDishes(beef, onion, { directions, conseils });
    expect(c.criteria.ghg_100y_kgco2e.vegetal).toBeNull();
    expect(c.criteria.ghg_100y_kgco2e.gapPercent).toBeNull();
    expect(c.criteria.ghg_100y_kgco2e.winner).toBeNull();

    const z = compareDishes(zero, zero, { directions, conseils });
    expect(z.criteria.ghg_100y_kgco2e.gapPercent).toBeNull();
    expect(z.criteria.ghg_100y_kgco2e.winner).toBe("egal");
  });

  it("reports whether the uncertainty ranges overlap", () => {
    const c = compareDishes(beef, lentil, { directions, conseils });
    expect(c.criteria.ghg_100y_kgco2e.rangesOverlap).toBe(false);
  });

  it("can compare per 100 kcal or per 10 g of protein", () => {
    const c = compareDishes(beef, lentil, { directions, conseils, basis: "per10gProtein" });
    // 1.5 vs 0.1 kg CO2e per 10 g protein
    expect(c.criteria.ghg_100y_kgco2e.animal).toBeCloseTo(1.5);
    expect(c.criteria.ghg_100y_kgco2e.vegetal).toBeCloseTo(0.1);
  });
});

describe("monetize", () => {
  const factors: MonetizationFactor[] = [
    { indicatorId: "ghg_100y_kgco2e", year: 2030, eurPerUnit: 0.5, method: "Test", sourceId: "test-vac" },
    { indicatorId: "ghg_100y_kgco2e", year: 2050, eurPerUnit: 1, method: "Test", sourceId: "test-vac" },
  ];

  it("multiplies the quantity by the factor of the requested year", () => {
    const r = monetize(4, 2030, factors);
    expect(r).toEqual({ eur: 2, eurPerUnit: 0.5, year: 2030, method: "Test", sourceId: "test-vac" });
  });

  it("returns null (donnée manquante) for a year without a published factor, never an interpolation", () => {
    expect(monetize(4, 2031, factors)).toBeNull();
  });

  it("keeps negative quantities (net removals) as they are", () => {
    expect(monetize(-2, 2050, factors)?.eur).toBe(-2);
  });

  it("requires a method when several are published for the same year", () => {
    const two = [...factors, { ...factors[0], method: "Autre", eurPerUnit: 0.7 }];
    expect(() => monetize(1, 2030, two)).toThrow();
    expect(monetize(1, 2030, two, { method: "Autre" })?.eur).toBeCloseTo(0.7);
  });
});

describe("simulate", () => {
  const beef = dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 100 }] }, data);
  const lentil = dishTotals({ servings: 1, ingredients: [{ foodCode: "LENTIL", grams: 100 }] }, data);
  const onion = dishTotals({ servings: 1, ingredients: [{ foodCode: "ONION", grams: 100 }] }, data);

  it("2 swaps per week for 1 year = 104 servings", () => {
    expect(simulate(2, 1, beef, lentil).servings).toBe(104);
  });

  it("accumulates the avoided impact per indicator, with a conservative range", () => {
    const s = simulate(2, 1, beef, lentil);
    expect(s.impacts.ghg_100y_kgco2e.avoided).toBeCloseTo((3 - 0.1) * 104);
    // low = animal low − plant high ; high = animal high − plant low
    expect(s.impacts.ghg_100y_kgco2e.avoidedLow).toBeCloseTo((2 - 0.15) * 104);
    expect(s.impacts.ghg_100y_kgco2e.avoidedHigh).toBeCloseTo((4 - 0.05) * 104);
    expect(s.animalImpacts.animals_killed_land.avoided).toBeCloseTo(0.1 * 0.004 * 104);
  });

  it("gives null, not 0, when a side is missing", () => {
    const s = simulate(2, 1, beef, onion);
    expect(s.impacts.ghg_100y_kgco2e.avoided).toBeNull();
  });

  it("rejects negative frequencies or durations", () => {
    expect(() => simulate(-1, 1, beef, lentil)).toThrow();
    expect(() => simulate(1, -1, beef, lentil)).toThrow();
  });
});
