// Shared fixture of a pair page. Values are invented for the tests only (not displayed anywhere).
import type { RawPairData } from "@/lib/compare/view";

export function raw(over: Partial<RawPairData> = {}): RawPairData {
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
    eatLancet: [
      { id: "eat-viande-rouge", libelle: "Bœuf, porc ou agneau", repere: "15 g par jour", grammesJour: 15, source: { sourceId: "eat-lancet-summary-2025", publisher: "EAT", title: "t", url: "https://example.org", accessedOn: "2026-11-01" } },
    ],
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
