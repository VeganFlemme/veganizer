// « Avec compléments » view (suite V1, S24). Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { buildPairPage, type ComplementSpec, type RawPairData } from "@/lib/compare/view";

const SPEC: ComplementSpec[] = [
  { code: "seeds", label: "graines", kind: "courant", maxGramsPerServing: 10, targets: ["ca_mg", "fiber_g"], justification: "oléagineux (ANSES)", conseils: ["calcium"] },
  { code: "drink", label: "boisson enrichie", kind: "enrichi", maxGramsPerServing: 250, targets: ["ca_mg"], justification: "enrichi (ANSES)", conseils: ["calcium"] },
];

function raw(): RawPairData {
  const n = (food_code: string, nutrient_id: string, value_per_100g: number) => ({ food_code, nutrient_id, value_per_100g, source_id: "ciqual-2025" });
  const imp = (food_code: string, value_per_kg: number) => ({ food_code, indicator_id: "ghg_100y_kgco2e", value_per_kg, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" });
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
      { code: "seeds", name_fr: "Graines", is_animal: false, animal_category: null, ciqual_code: null },
      { code: "drink", name_fr: "Boisson", is_animal: false, animal_category: null, ciqual_code: null },
    ],
    nutrientValues: [
      n("meat", "protein_g", 30), n("meat", "energy_eu_kcal", 200), n("meat", "ca_mg", 20), n("meat", "fiber_g", 0), n("meat", "vit_b12_ug", 2),
      n("beans", "protein_g", 20), n("beans", "energy_eu_kcal", 100), n("beans", "ca_mg", 10), n("beans", "fiber_g", 5), n("beans", "vit_b12_ug", 0),
      n("seeds", "ca_mg", 900), n("seeds", "fiber_g", 10), n("seeds", "vit_b12_ug", 0), n("seeds", "protein_g", 0), n("seeds", "energy_eu_kcal", 0),
      n("drink", "ca_mg", 100), n("drink", "fiber_g", 0), n("drink", "vit_b12_ug", 0), n("drink", "protein_g", 0), n("drink", "energy_eu_kcal", 0),
    ],
    impacts: [imp("meat", 30), imp("beans", 1), imp("seeds", 2), imp("drink", 1)],
    categoryFactors: [],
    nutrients: [
      { id: "protein_g", name_fr: "Protéines", unit: "g" },
      { id: "energy_eu_kcal", name_fr: "Énergie", unit: "kcal" },
      { id: "ca_mg", name_fr: "Calcium", unit: "mg" },
      { id: "fiber_g", name_fr: "Fibres", unit: "g" },
      { id: "vit_b12_ug", name_fr: "Vitamine B12", unit: "µg" },
    ],
    indicators: [{ id: "ghg_100y_kgco2e", name_fr: "GES", unit: "kg CO2e", higher_is_better: false, pillar: "climat" }],
    sources: [],
    monetizationFactors: [],
    monetizationRules: [],
    conseils: [{ id: "calcium", criteria: ["ca_mg"], titre: "Calcium", texte: "enrichis", sources: [] }, { id: "b12", criteria: ["vit_b12_ug"], titre: "B12", texte: "complément", sources: [] }],
    climateCostYears: [2025],
    dishPrices: [],
    foodPrices: [],
    iarc: [],
    pnns: [],
    eatLancet: [],
    complements: SPEC,
    complementLimits: { ca_mg: 2500 },
  };
}

describe("buildPairPage: completed version (decisions of Matt, 17 h 05 and 17 h 12)", () => {
  const page = buildPairPage(raw());
  const c = page.completed.maison!;
  const row = (id: string) => c.view.rows.perServing.find((r) => r.id === id)!;

  it("raises the main protein of the plant version to the protein of the animal dish", () => {
    // protein per serving: animal 60 g, plant 40 g -> +20 g per serving -> +200 g of beans (20 g/100 g)
    expect(c.boost?.code).toBe("beans");
    expect(c.boost?.extraGrams).toBeCloseTo(200);
    expect(row("protein_g").vegetal!.value!).toBeCloseTo(60);
  });

  it("then closes the other plant gaps with the whitelist, everyday foods first", () => {
    // calcium per serving: animal 40 mg, plant 600 g × 10 / 100 / 2 = 30 mg -> 10 mg -> 1.2 g of seeds
    expect(c.additions.map((a) => [a.code, a.gramsPerServing, a.nutrients])).toEqual([["seeds", 1.2, ["ca_mg"]]]);
    expect(row("ca_mg").vegetal!.value!).toBeGreaterThanOrEqual(row("ca_mg").animal!.value!);
  });

  it("leaves what no food closes to the advice (no dose), and never completes the animal dish", () => {
    expect(c.open).toEqual(["vit_b12_ug"]);
    expect(c.view.dish.ingredients.map((i) => i.code).sort()).toEqual(["beans", "seeds"]);
    expect(page.animal.ingredients.map((i) => i.code)).toEqual(["meat"]);
  });

  it("shows nutrition as « écarts comblés par construction », the other categories compared normally", () => {
    const n = c.view.scores.verdict.categories.find((x) => x.id === "nutrition")!;
    expect(n.constructed).toBe(true);
    expect(c.view.scores.verdict.total).toBe(4);
    expect(c.view.scores.verdict.sentence).toContain("écarts comblés par construction");
    // climate: (600 g of beans × 1 kg/kg + 2.4 g of seeds for the recipe × 2 kg/kg) / 1000 / 2 servings
    expect(row("ghg_100y_kgco2e").vegetal!.value!).toBeCloseTo((0.6 + 0.0048) / 2, 4);
  });

  it("names the gaps that remain in the nutrition label (« Écarts comblés, sauf : vitamine B12 »)", () => {
    const n = c.view.scores.verdict.categories.find((x) => x.id === "nutrition")!;
    expect(n.constructedLabel).toMatch(/^Écarts comblés, sauf : .*B12/i);
  });

  it("keeps the base version unchanged and has no completed version without a whitelist", () => {
    expect(page.variants.maison!.rows.perServing.find((r) => r.id === "ghg_100y_kgco2e")!.vegetal!.value!).toBeCloseTo(0.2);
    const r = raw();
    r.complements = [];
    expect(buildPairPage(r).completed.maison!.additions).toEqual([]);
  });
});

describe("plausible serving and role of the food (suite V1, 5 ter)", () => {
  // Cheese 100 g (30 g of protein) against a spread at 10 g of protein: doubling it is the cap.
  function cheese(): RawPairData {
    const r = raw();
    r.animal = { ...r.animal, servings: 1 };
    r.vegetal = [{ ...r.vegetal[0], servings: 1 }];
    r.ingredients = [
      { dish_id: "A", food_code: "meat", grams: 100, note: null },
      { dish_id: "M", food_code: "beans", grams: 100, note: null },
    ];
    r.foods = r.foods.map((f) => (f.code === "meat" ? { ...f, name_fr: "Emmental", food_subgroup: "fromages" } : f));
    r.nutrientValues = r.nutrientValues.map((x) => (x.food_code === "beans" && x.nutrient_id === "protein_g" ? { ...x, value_per_100g: 10 } : x));
    return r;
  }
  it("raises the main protein to twice its mass at most, and says so", () => {
    const c = buildPairPage(cheese()).completed.maison!;
    expect(c.boost?.extraGrams).toBe(100);
    expect(c.boost?.capped).toBe(true);
  });
  it("says that a cheese mostly brings calcium and fat: equal protein is only a reference", () => {
    expect(buildPairPage(cheese()).completed.maison!.roleNote).toBe(
      "Le fromage apporte surtout du calcium et des matières grasses ; l’égaler en protéines n’est qu’un repère.",
    );
    expect(buildPairPage(raw()).completed.maison!.roleNote).toBeNull();
  });
});
