// « À protéines égales » view (suite V1, step 1). Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { buildPairPage, type RawPairData } from "@/lib/compare/view";
import { equalProteinFactor, scaleDish, dishTotals, type ScoringData } from "@/lib/scoring";

describe("equalProteinFactor and scaleDish", () => {
  const data: ScoringData = {
    foods: { M: { nutrients: { protein_g: 20 }, impacts: {}, isAnimal: true, animalCategory: null }, B: { nutrients: { protein_g: 10 }, impacts: {}, isAnimal: false, animalCategory: null } },
    categoryFactors: {},
  };
  const a = dishTotals({ servings: 2, ingredients: [{ foodCode: "M", grams: 400 }] }, data); // 40 g per serving
  const v = dishTotals({ servings: 2, ingredients: [{ foodCode: "B", grams: 500 }] }, data); // 25 g per serving
  it("is animal protein / plant protein, from the data", () => {
    expect(equalProteinFactor(a, v)).toBeCloseTo(1.6);
  });
  it("is null when a protein total is missing or zero (no invented scale)", () => {
    const none = dishTotals({ servings: 1, ingredients: [{ foodCode: "B", grams: 100 }] }, { ...data, foods: { B: { ...data.foods.B!, nutrients: {} } } });
    expect(equalProteinFactor(a, none)).toBeNull();
    expect(equalProteinFactor(a, dishTotals({ servings: 1, ingredients: [{ foodCode: "B", grams: 100 }] }, { ...data, foods: { B: { ...data.foods.B!, nutrients: { protein_g: 0 } } } }))).toBeNull();
  });
  it("scales every ingredient, servings unchanged", () => {
    expect(scaleDish({ servings: 2, ingredients: [{ foodCode: "B", grams: 500 }] }, 1.6)).toEqual({ servings: 2, ingredients: [{ foodCode: "B", grams: 800 }] });
  });
});

function raw(): RawPairData {
  return {
    animal: { id: "A", slug: "plat", name_fr: "Plat animal", kind: "animal", servings: 2, description: null },
    vegetal: [{ id: "M", slug: "plat-maison", name_fr: "Plat maison", kind: "vegetal", servings: 2, description: null }],
    pairs: [{ vegan_dish_id: "M", variant: "maison", rationale: "même rôle" }],
    ingredients: [
      { dish_id: "A", food_code: "meat", grams: 400, note: null },
      { dish_id: "M", food_code: "beans", grams: 400, note: null },
    ],
    foods: [
      { code: "meat", name_fr: "Viande", is_animal: true, animal_category: "bovin", ciqual_code: null },
      { code: "beans", name_fr: "Haricot", is_animal: false, animal_category: null, ciqual_code: null },
    ],
    nutrientValues: [
      { food_code: "meat", nutrient_id: "protein_g", value_per_100g: 30, source_id: "ciqual-2025" },
      { food_code: "meat", nutrient_id: "energy_eu_kcal", value_per_100g: 200, source_id: "ciqual-2025" },
      { food_code: "beans", nutrient_id: "protein_g", value_per_100g: 20, source_id: "ciqual-2025" },
      { food_code: "beans", nutrient_id: "energy_eu_kcal", value_per_100g: 100, source_id: "ciqual-2025" },
    ],
    impacts: [
      { food_code: "meat", indicator_id: "ghg_100y_kgco2e", value_per_kg: 30, low_per_kg: null, high_per_kg: null, dqr: 3, source_id: "agribalyse-3.2" },
      { food_code: "beans", indicator_id: "ghg_100y_kgco2e", value_per_kg: 1, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
    ],
    categoryFactors: [],
    nutrients: [
      { id: "protein_g", name_fr: "Protéines", unit: "g" },
      { id: "energy_eu_kcal", name_fr: "Énergie", unit: "kcal" },
    ],
    indicators: [{ id: "ghg_100y_kgco2e", name_fr: "GES", unit: "kg CO2e", higher_is_better: false, pillar: "climat" }],
    sources: [],
    monetizationFactors: [{ indicatorId: "ghg_100y_kgco2e", year: 2025, eurPerUnit: 0.5, method: "m", sourceId: "vac-2025" }],
    monetizationRules: [],
    conseils: [],
    climateCostYears: [2025],
    dishPrices: [{ dish_id: "M", source_ids: ["rnm"], per_serving: 2, low_per_serving: 1, high_per_serving: 3, mass_coverage: 1, first_observed_on: null, last_observed_on: null }],
    foodPrices: [],
    iarc: [],
    pnns: [],
    eatLancet: [],
  };
}

describe("buildPairPage: equal-protein view", () => {
  const page = buildPairPage(raw());
  const eq = page.equalProtein.maison!;
  const row = (id: string) => eq.view.rows.perServing.find((r) => r.id === id)!;

  it("scales the plant version by animal protein / plant protein", () => {
    expect(eq.factor).toBeCloseTo(1.5); // 60 g vs 40 g per serving
    expect(eq.baseGramsPerServing).toBe(200);
    expect(eq.gramsPerServing).toBeCloseTo(300);
    expect(eq.view.dish.ingredients[0].grams).toBeCloseTo(600);
    expect(row("protein_g").vegetal?.value).toBeCloseTo(60);
  });

  it("recomputes the other pillars, the price and the simulator input", () => {
    expect(row("ghg_100y_kgco2e").vegetal?.value).toBeCloseTo(0.3); // 600 g × 1 / 1000 / 2
    expect(eq.view.price.vegetal?.value).toBeCloseTo(3);
    expect(eq.view.sim.vegetal.impacts.ghg_100y_kgco2e.perServing).toBeCloseTo(0.3);
  });

  it("does not count protein: equal by construction", () => {
    const n = eq.view.scores.verdict.categories.find((c) => c.id === "nutrition")!;
    expect(n.indicators.map((i) => i.id)).not.toContain("protein_g");
    const realistic = page.variants.maison!.scores.verdict.categories.find((c) => c.id === "nutrition")!;
    expect(n.total).toBe(realistic.total - 1);
  });

  it("keeps the realistic portion as the default view, unchanged", () => {
    expect(page.variants.maison!.rows.perServing.find((r) => r.id === "ghg_100y_kgco2e")!.vegetal?.value).toBeCloseTo(0.2);
  });

  it("has no equal-protein view when the plant protein is unknown", () => {
    const r = raw();
    r.nutrientValues = r.nutrientValues.filter((n) => !(n.food_code === "beans" && n.nutrient_id === "protein_g"));
    expect(buildPairPage(r).equalProtein.maison).toBeUndefined();
  });
});
