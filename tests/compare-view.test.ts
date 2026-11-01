// Fixture values are invented for the test only (not displayed anywhere).
import { describe, expect, it } from "vitest";
import { buildPairPage, reductionPercent, type RawPairData } from "@/lib/compare/view";

function raw(over: Partial<RawPairData> = {}): RawPairData {
  return {
    animal: { id: "A", slug: "plat", name_fr: "Plat animal", kind: "animal", servings: 2, description: null },
    vegetal: [
      { id: "M", slug: "plat-maison", name_fr: "Plat maison", kind: "vegetal", servings: 2, description: null },
      { id: "C", slug: "plat-commerce", name_fr: "Plat commerce", kind: "vegetal", servings: 2, description: null },
    ],
    pairs: [
      { vegan_dish_id: "M", variant: "maison", rationale: "même rôle" },
      { vegan_dish_id: "C", variant: "commerce", rationale: "même rôle" },
    ],
    ingredients: [
      { dish_id: "A", food_code: "meat", grams: 400, note: "viande cuite" },
      { dish_id: "M", food_code: "beans", grams: 400, note: null },
      { dish_id: "C", food_code: "beans", grams: 300, note: null },
      { dish_id: "C", food_code: "nodata", grams: 100, note: "ingrédient sans données" },
    ],
    foods: [
      { code: "meat", name_fr: "Viande", is_animal: true, animal_category: "bovin", ciqual_code: null },
      { code: "beans", name_fr: "Haricot", is_animal: false, animal_category: null, ciqual_code: null },
      { code: "nodata", name_fr: "Inconnu", is_animal: false, animal_category: null, ciqual_code: null },
    ],
    nutrientValues: [
      { food_code: "meat", nutrient_id: "protein_g", value_per_100g: 30, source_id: "ciqual-2025" },
      { food_code: "meat", nutrient_id: "energy_eu_kcal", value_per_100g: 200, source_id: "ciqual-2025" },
      { food_code: "meat", nutrient_id: "vit_b12_ug", value_per_100g: 2, source_id: "ciqual-2025" },
      { food_code: "beans", nutrient_id: "protein_g", value_per_100g: 10, source_id: "ciqual-2025" },
      { food_code: "beans", nutrient_id: "energy_eu_kcal", value_per_100g: 100, source_id: "ciqual-2025" },
      { food_code: "beans", nutrient_id: "vit_b12_ug", value_per_100g: 0, source_id: "ciqual-2025" },
    ],
    impacts: [
      { food_code: "meat", indicator_id: "ghg_100y_kgco2e", value_per_kg: 30, low_per_kg: null, high_per_kg: null, dqr: 3, source_id: "agribalyse-3.2" },
      { food_code: "beans", indicator_id: "ghg_100y_kgco2e", value_per_kg: 1, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
      { food_code: "meat", indicator_id: "land_use_pt", value_per_kg: -5, low_per_kg: null, high_per_kg: null, dqr: 3, source_id: "agribalyse-3.2" },
    ],
    categoryFactors: [],
    nutrients: [
      { id: "protein_g", name_fr: "Protéines", unit: "g" },
      { id: "energy_eu_kcal", name_fr: "Énergie", unit: "kcal" },
      { id: "vit_b12_ug", name_fr: "Vitamine B12", unit: "µg" },
    ],
    indicators: [
      { id: "ghg_100y_kgco2e", name_fr: "GES", unit: "kg CO2e", higher_is_better: false, pillar: "climat" },
      { id: "land_use_pt", name_fr: "Sols", unit: "Pt", higher_is_better: false, pillar: "climat" },
    ],
    sources: [
      { id: "ciqual-2025", name: "Ciqual", publisher: "ANSES", version: "2025", license: "LO", commercial_use: true, url: null },
      { id: "agribalyse-3.2", name: "Agribalyse", publisher: "ADEME", version: "3.2", license: "LO", commercial_use: true, url: null },
      { id: "vac-2025", name: "VAC", publisher: "FS", version: "2025", license: "public", commercial_use: true, url: null },
      { id: "unused", name: "Unused", publisher: null, version: null, license: "x", commercial_use: null, url: null },
    ],
    monetizationFactors: [{ indicatorId: "ghg_100y_kgco2e", year: 2025, eurPerUnit: 0.5, method: "m", sourceId: "vac-2025" }],
    monetizationRules: [],
    conseils: [{ id: "b12", criteria: ["vit_b12_ug"], titre: "B12", texte: "complément", sources: [] }],
    climateCostYears: [2025, 2050],
    pnns: [
      { id: "viande", libelle: "Viande hors volaille", repere: "…", limiteGrammesSemaine: 500, source: { sourceId: "spf-pnns-2019", publisher: "SpF", title: "t", url: "https://example.org", accessedOn: "2026-11-01" } },
      { id: "legumes-secs", libelle: "Légumes secs", repere: "…", foisParSemaine: 2, source: { sourceId: "spf-pnns-2019", publisher: "SpF", title: "t", url: "https://example.org", accessedOn: "2026-11-01" } },
    ],
    dishPrices: [
      { dish_id: "A", source_ids: ["open-prices"], per_serving: 2, low_per_serving: 1, high_per_serving: 3, mass_coverage: 1, first_observed_on: "2025-11-15", last_observed_on: "2026-10-15" },
    ],
    foodPrices: [
      { food_code: "meat", source_id: "rnm", median_eur_per_kg: 5, observations: 12, first_observed_on: "2025-11-15", last_observed_on: "2026-10-15", place: "France, GMS" },
    ],
    iarc: [
      {
        id: "rouge",
        groupe: "2A",
        libelle: "Viande rouge",
        classement: "probablement cancérogène",
        definition: "…",
        source: { sourceId: "iarc-114", publisher: "CIRC", title: "vol. 114", url: "https://example.org", accessedOn: "2026-11-01" },
      },
    ],
    ...over,
  };
}

describe("reductionPercent", () => {
  it("follows (animal − plant) / animal × 100", () => {
    expect(reductionPercent(10, 1)).toBe(90);
    expect(reductionPercent(10, 12)).toBe(-20);
    expect(reductionPercent(-5, -2)).toBe(-60);
  });
  it("is not computable when a side is missing or the animal value is 0", () => {
    expect(reductionPercent(null, 1)).toBeNull();
    expect(reductionPercent(10, null)).toBeNull();
    expect(reductionPercent(0, 1)).toBeNull();
  });
});

describe("buildPairPage", () => {
  const page = buildPairPage(raw());
  const maison = page.variants.maison!;
  const commerce = page.variants.commerce!;
  const row = (v: typeof maison, id: string) => v.rows.perServing.find((r) => r.id === id)!;

  it("computes per serving values with the engine", () => {
    const co2 = row(maison, "ghg_100y_kgco2e");
    expect(co2.animal?.value).toBeCloseTo(6); // 400 g × 30 / 1000 / 2
    expect(co2.vegetal?.value).toBeCloseTo(0.2);
    expect(co2.reductionPercent).toBeCloseTo(96.67, 1);
    expect(co2.winner).toBe("vegetal");
    expect(co2.worstDqr).toBe(3);
  });

  it("says when the source publishes no range", () => {
    expect(row(maison, "ghg_100y_kgco2e").animal?.rangePublished).toBe(false);
  });

  it("lists where the animal dish does better, with the sourced advice", () => {
    const b12 = maison.animalBetter.find((a) => a.criterion === "vit_b12_ug");
    expect(b12?.conseil?.id).toBe("b12");
    expect(b12?.partial).toBe(false);
  });

  it("keeps animal advantages found on partial data, flagged as partial", () => {
    const b12 = commerce.animalBetter.find((a) => a.criterion === "vit_b12_ug");
    expect(b12?.partial).toBe(true);
    expect(commerce.rows.perServing.find((r) => r.id === "vit_b12_ug")?.winner).toBeNull();
  });

  it("never turns missing data into 0 and flags low coverage", () => {
    const co2 = row(commerce, "ghg_100y_kgco2e");
    expect(co2.vegetal?.coverage).toBeCloseTo(0.75);
    expect(co2.lowCoverage).toBe(true);
    expect(commerce.keyCoverage).toBeCloseTo(0.75);
    expect(co2.winner).toBeNull();
    expect(co2.indicativeWinner).toBe("vegetal");
    // A nutrient nobody has stays absent, not 0.
    const fiber = row(maison, "fiber_g");
    expect(fiber.animal).toBeNull();
    expect(fiber.vegetal).toBeNull();
    expect(fiber.reductionPercent).toBeNull();
  });

  it("keeps published negative values", () => {
    expect(row(maison, "land_use_pt").animal?.value).toBeCloseTo(-1);
  });

  it("gives energy no winner", () => {
    expect(row(maison, "energy_eu_kcal").winner).toBeNull();
  });

  it("normalises per 100 kcal and per 10 g of protein", () => {
    const co2 = maison.rows.per10gProtein.find((r) => r.id === "ghg_100y_kgco2e")!;
    expect(co2.animal?.value).toBeCloseTo(1); // 6 kg for 60 g protein → 1 kg per 10 g
    const per100 = maison.rows.per100kcal.find((r) => r.id === "ghg_100y_kgco2e")!;
    expect(per100.animal?.value).toBeCloseTo(1.5); // 6 kg for 400 kcal
  });

  it("monetises CO2e with the published carbon value", () => {
    const [y2025, y2050] = maison.climateCost;
    expect(y2025.animalEur).toBeCloseTo(3);
    expect(y2025.vegetalEur).toBeCloseTo(0.1);
    expect(y2025.derived).toBe(false);
    // No factor nor rule for 2050 in the fixture: missing, never 0.
    expect(y2050.animalEur).toBeNull();
  });

  it("shows the animal pillar as 'bientôt' while category_factors is empty", () => {
    expect(maison.hasAnimalData).toBe(false);
    expect(maison.animalWithoutFactor).toEqual(["Viande"]);
  });

  it("uses category factors per kg for the animal pillar", () => {
    const p = buildPairPage(
      raw({ categoryFactors: [{ category: "bovin", indicator_id: "animals_killed_land", value: 0.003, low: 0.002, high: 0.004, source_id: "faostat-qcl", unit_basis: "par kg de carcasse" }] }),
    );
    const r = p.variants.maison!.rows.perServing.find((x) => x.id === "animals_killed_land")!;
    expect(r.animal?.value).toBeCloseTo(0.0006); // 400 g × 0.003 / 2
    expect(r.vegetal?.value).toBe(0); // no animal ingredient: a real 0
    expect(p.variants.maison!.animalFactorNotes[0].unitBasis).toBe("par kg de carcasse");
  });

  it("counts grams of IARC red meat per serving", () => {
    const p = buildPairPage(
      raw({
        foods: [
          { code: "meat", name_fr: "Viande", is_animal: true, animal_category: "bovin", ciqual_code: null, iarc_meat: "rouge" },
          { code: "beans", name_fr: "Haricot", is_animal: false, animal_category: null, ciqual_code: null },
          { code: "nodata", name_fr: "Inconnu", is_animal: false, animal_category: null, ciqual_code: null },
        ],
      }),
    );
    expect(p.variants.maison!.iarc[0].animalGrams).toBe(200);
    expect(p.variants.maison!.iarc[0].vegetalGrams).toBe(0);
  });

  it("keeps the price coverage and normalises the dish price per 100 kcal and per 10 g of protein", () => {
    expect(maison.price.animal?.coverage).toBe(1);
    expect(maison.price.animal?.per100kcal).toBeCloseTo(0.5); // 2 € for 400 kcal
    expect(maison.price.animal?.per10gProtein).toBeCloseTo(2 / 60 * 10);
    expect(maison.price.vegetal).toBeNull();
  });

  it("lists the price per kg of each ingredient, missing prices stay null", () => {
    expect(maison.price.animalIngredients[0]).toMatchObject({ code: "meat", eurPerKg: 5, sourceId: "rnm", place: "France, GMS" });
    expect(maison.price.vegetalIngredients[0].eurPerKg).toBeNull();
  });

  it("only exposes the sources actually used", () => {
    expect(Object.keys(page.sources).sort()).toEqual(["agribalyse-3.2", "ciqual-2025", "vac-2025"]); // iarc-114, open-prices: not in the fixture sources
  });

  it("labels ingredients with the recipe note and keeps the official name", () => {
    const ing = page.animal.ingredients[0];
    expect(ing.label).toBe("viande cuite");
    expect(ing.officialName).toBe("Viande");
    expect(page.animal.gramsPerServing).toBe(200);
  });
});

describe("rule 10", () => {
  it("never passes a food name containing 'vegan' to the page", () => {
    const page = buildPairPage(
      raw({
        foods: [
          { code: "meat", name_fr: "Viande", is_animal: true, animal_category: "bovin", ciqual_code: null },
          { code: "beans", name_fr: "Galette (convient aux véganes ou végétaliens)", is_animal: false, animal_category: null, ciqual_code: null },
          { code: "nodata", name_fr: "Inconnu", is_animal: false, animal_category: null, ciqual_code: null },
        ],
      }),
    );
    expect(JSON.stringify(page)).not.toMatch(/v[eé]gan|v[eé]g[eé]talien/i);
    expect(page.variants.maison!.dish.ingredients[0].label).toBe("beans");
  });
});

describe("animal pillar without any factor", () => {
  it("shows missing data, not 0, when no animal ingredient has a factor", () => {
    const p = buildPairPage(
      raw({ categoryFactors: [{ category: "porc", indicator_id: "animals_killed_land", value: 0.01, low: null, high: null, source_id: "faostat-qcl" }] }),
    );
    const r = p.variants.maison!.rows.perServing.find((x) => x.id === "animals_killed_land")!;
    expect(r.animal).toBeNull();
    expect(r.winner).toBeNull();
    expect(r.vegetal?.value).toBe(0);
  });
});

describe("per-animal factors on the page", () => {
  it("shows missing data when the animal ingredient has only an unconvertible per-animal factor", () => {
    const p = buildPairPage(
      raw({ categoryFactors: [{ category: "bovin", indicator_id: "pain_hours_annoying", value: 100, low: null, high: null, source_id: "welfare-footprint", per: "animal" }] }),
    );
    const r = p.variants.maison!.rows.perServing.find((x) => x.id === "pain_hours_annoying")!;
    expect(r.animal).toBeNull();
    expect(r.vegetal?.value).toBe(0);
  });

  it("converts per-animal factors with animals_killed_land of the same category", () => {
    const p = buildPairPage(
      raw({
        categoryFactors: [
          { category: "bovin", indicator_id: "animals_killed_land", value: 0.003, low: null, high: null, source_id: "faostat-qcl", per: "kg" },
          { category: "bovin", indicator_id: "life_days_farmed", value: 500, low: null, high: null, source_id: "x", per: "animal" },
        ],
      }),
    );
    const r = p.variants.maison!.rows.perServing.find((x) => x.id === "life_days_farmed")!;
    expect(r.animal?.value).toBeCloseTo(0.4 * 0.003 * 500 / 2); // 0.3 day per serving
  });
});

describe("PNNS guidelines", () => {
  it("gives meat grams per serving as a share of the weekly limit, and legumes without a percentage", () => {
    const p = buildPairPage(
      raw({
        foods: [
          { code: "meat", name_fr: "Viande", is_animal: true, animal_category: "bovin", ciqual_code: null, iarc_meat: "rouge" },
          { code: "beans", name_fr: "Haricot, bouilli", is_animal: false, animal_category: null, ciqual_code: null, food_subgroup: "légumineuses" },
          { code: "nodata", name_fr: "Fève fraîche", is_animal: false, animal_category: null, ciqual_code: null, food_subgroup: "légumineuses" },
        ],
      }),
    );
    const [viande, legumes] = p.variants.commerce!.pnns;
    expect(viande.animalGrams).toBe(200);
    expect(viande.animalPercent).toBe(40); // 200 g / 500 g
    expect(viande.vegetalPercent).toBe(0);
    expect(legumes.vegetalGrams).toBe(150); // 300 g / 2 servings; the fresh broad bean is not counted
    expect(legumes.animalPercent).toBeNull();
  });
});
