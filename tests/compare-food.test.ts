// Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { buildFoodPage, buildFoodPairPage, displayName, type FoodRawData } from "@/lib/compare/food";

const base: FoodRawData = {
  code: "meat",
  foodGroup: "viandes",
  foodSubgroup: "viandes cuites",
  foods: [
    { code: "meat", name_fr: "Viande cuite", is_animal: true, animal_category: "bovin", ciqual_code: null },
    { code: "tofu", name_fr: "Galette (convient aux véganes ou végétaliens)", is_animal: false, animal_category: null, ciqual_code: null },
  ],
  nutrientValues: [
    { food_code: "meat", nutrient_id: "protein_g", value_per_100g: 25, source_id: "ciqual-2025" },
    { food_code: "meat", nutrient_id: "energy_eu_kcal", value_per_100g: 200, source_id: "ciqual-2025" },
    { food_code: "tofu", nutrient_id: "protein_g", value_per_100g: 15, source_id: "ciqual-2025" },
    { food_code: "tofu", nutrient_id: "energy_eu_kcal", value_per_100g: 150, source_id: "ciqual-2025" },
  ],
  impacts: [
    { food_code: "meat", indicator_id: "ghg_100y_kgco2e", value_per_kg: 30, low_per_kg: null, high_per_kg: null, dqr: 3, source_id: "agribalyse-3.2" },
    { food_code: "tofu", indicator_id: "ghg_100y_kgco2e", value_per_kg: 2, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
  ],
  categoryFactors: [{ category: "bovin", indicator_id: "animals_killed_land", value: 0.003, low: null, high: null, source_id: "faostat-qcl", per: "kg" }],
  nutrients: [
    { id: "protein_g", name_fr: "Protéines", unit: "g" },
    { id: "energy_eu_kcal", name_fr: "Énergie", unit: "kcal" },
  ],
  indicators: [{ id: "ghg_100y_kgco2e", name_fr: "GES", unit: "kg CO2e", higher_is_better: false, pillar: "climat" }],
  sources: [{ id: "agribalyse-3.2", name: "Agribalyse", publisher: "ADEME", version: "3.2", license: "LO", commercial_use: true, url: null }],
  conseils: [],
  alternatives: [{ plant_code: "tofu", rank: 1, rule: "Viande cuite → protéine végétale" }],
};

describe("buildFoodPage", () => {
  const page = buildFoodPage(base)!;
  const alt = page.alternatives[0];

  it("compares per 100 g with the engine", () => {
    const co2 = alt.rows.perServing.find((r) => r.id === "ghg_100y_kgco2e")!;
    expect(co2.animal?.value).toBeCloseTo(3); // 100 g × 30 kg/kg
    expect(co2.vegetal?.value).toBeCloseTo(0.2);
    expect(alt.proteinGapPercent).toBeCloseTo(-40);
  });

  it("never shows a vegan claim from a source name", () => {
    expect(alt.name).toBe("Galette");
    expect(JSON.stringify(page)).not.toMatch(/v[eé]gan|v[eé]g[eé]talien/i);
  });

  it("keeps the animal pillar: real 0 for the plant food", () => {
    const a = alt.rows.perServing.find((r) => r.id === "animals_killed_land")!;
    expect(a.animal?.value).toBeCloseTo(0.0003);
    expect(a.vegetal?.value).toBe(0);
  });

  it("returns null for an unknown food and no alternative for a plant food without rule", () => {
    expect(buildFoodPage({ ...base, code: "nope" })).toBeNull();
    expect(buildFoodPage({ ...base, code: "tofu", alternatives: [] })!.alternatives).toEqual([]);
  });
});

describe("displayName", () => {
  it("removes the quoted claim only", () => {
    expect(displayName("Nuggets soja et blé (convient aux véganes ou végétaliens), préemballé")).toBe("Nuggets soja et blé, préemballé");
  });
});

describe("buildFoodPairPage (S24d: same display as dish pages)", () => {
  const extra = {
    monetizationFactors: [],
    monetizationRules: [],
    climateCostYears: [2025],
    foodPrices: [],
    iarc: [],
    pnns: [],
    eatLancet: [],
  };
  const page = buildFoodPairPage({ ...base, ...extra })!;
  const old = buildFoodPage(base)!;

  it("treats each food as a one-ingredient dish of 100 g, with one choice per alternative", () => {
    expect(page.animal.servings).toBe(1);
    expect(page.animal.gramsPerServing).toBe(100);
    expect(page.choices).toEqual([{ id: "tofu", label: "Galette", reason: "Viande cuite → protéine végétale" }]);
  });

  it("has the same five categories, scores and versions as a dish page", () => {
    const v = page.variants.tofu!;
    expect(v.scores.verdict.categories.map((c) => c.id)).toEqual(["nutrition", "sante", "environnement", "animaux", "economie"]);
    expect(page.completed.tofu).toBeDefined();
  });

  it("keeps the figures per 100 g unchanged", () => {
    const value = (rows: { id: string; animal: { value: number | null } | null; vegetal: { value: number | null } | null }[], id: string) => {
      const r = rows.find((x) => x.id === id)!;
      return [r.animal?.value, r.vegetal?.value];
    };
    for (const id of ["ghg_100y_kgco2e", "protein_g", "animals_killed_land"]) {
      expect(value(page.variants.tofu!.rows.perServing, id)).toEqual(value(old.alternatives[0].rows.perServing, id));
    }
  });

  it("returns a page without choice for a food without alternative, and null for an unknown code", () => {
    expect(buildFoodPairPage({ ...base, ...extra, code: "tofu", alternatives: [] })!.choices).toEqual([]);
    expect(buildFoodPairPage({ ...base, ...extra, code: "nope" })).toBeNull();
  });
});
