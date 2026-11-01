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
      n("beans", "protein_g", 30), n("beans", "energy_eu_kcal", 100), n("beans", "ca_mg", 10), n("beans", "fiber_g", 5), n("beans", "vit_b12_ug", 0),
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

describe("buildPairPage: view with complements", () => {
  const page = buildPairPage(raw());
  const c = page.completed.maison!;
  const row = (id: string) => c.view.rows.perServing.find((r) => r.id === id)!;

  it("closes the plant gaps with the smallest additions, everyday foods first", () => {
    // calcium per serving: animal 40 mg, plant 20 mg -> gap 20 mg -> 2.3 g of seeds (900 mg/100 g)
    const add = c.plant.additions;
    expect(add.map((a) => a.code)).toEqual(["seeds"]);
    expect(add[0].gramsPerServing).toBeCloseTo(2.3);
    expect(add[0].label).toBe("graines");
    expect(add[0].nutrients).toEqual(["ca_mg"]);
    expect(row("ca_mg").vegetal!.value!).toBeGreaterThanOrEqual(row("ca_mg").animal!.value!);
  });

  it("leaves gaps no whitelisted food closes open, without adding anything for them", () => {
    expect(c.plant.open).toEqual(["vit_b12_ug"]);
    expect(c.view.animalBetter.map((a) => a.criterion)).toContain("vit_b12_ug");
  });

  it("does the same for the animal dish where the plant version does better (symmetry)", () => {
    // fibre per serving: animal 0, plant 10 g -> gap 10 g, seeds max 10 g -> 1 g of fibre: not closable
    expect(c.animal.open).toEqual(["fiber_g"]);
    expect(c.animal.additions).toEqual([]);
  });

  it("recomputes the other pillars with the additions", () => {
    // plant CO2e: 0.2 kg + 2.3 g × 2 kg/kg / 1000 per serving
    expect(row("ghg_100y_kgco2e").vegetal!.value!).toBeCloseTo(0.2 + 0.0023 * 2, 4);
    expect(page.variants.maison!.rows.perServing.find((r) => r.id === "ghg_100y_kgco2e")!.vegetal!.value!).toBeCloseTo(0.2);
  });

  it("has no completed view without a whitelist", () => {
    const r = raw();
    r.complements = [];
    expect(buildPairPage(r).completed.maison).toBeUndefined();
  });
});
