// Automatic comparison (suite V1, step 3 ter, decision of Matt 17 h 25): animal recipe (official
// when available), plant version derived by the single rule for the protein chosen by the visitor.
// Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { buildAutoPage, climateWins, officialIngredients, rankedCandidates, type AutoInput } from "@/lib/compare/auto";
import { raw } from "./fixtures/raw";

const BASE = raw();
function input(over: Partial<AutoInput> = {}): AutoInput {
  return {
    raw: {
      ...BASE,
      vegetal: [],
      pairs: [],
      ingredients: [
        { dish_id: "A", food_code: "meat", grams: 400, note: "viande cuite" },
        { dish_id: "A", food_code: "butter", grams: 20, note: "beurre" },
        { dish_id: "A", food_code: "nodata", grams: 100, note: "légume" },
      ],
      foods: [
        ...BASE.foods,
        { code: "butter", name_fr: "Beurre doux", is_animal: true, animal_category: "vache laitière", ciqual_code: null, food_subgroup: "beurres" },
        { code: "oil", name_fr: "Huile de colza", is_animal: false, animal_category: null, ciqual_code: null },
        { code: "seitan", name_fr: "Seitan, préemballé", is_animal: false, animal_category: null, ciqual_code: null },
      ],
      nutrientValues: [
        ...BASE.nutrientValues,
        { food_code: "butter", nutrient_id: "protein_g", value_per_100g: 1, source_id: "ciqual-2025" },
        { food_code: "nodata", nutrient_id: "protein_g", value_per_100g: 1, source_id: "ciqual-2025" },
        { food_code: "oil", nutrient_id: "protein_g", value_per_100g: 0, source_id: "ciqual-2025" },
        { food_code: "butter", nutrient_id: "fat_g", value_per_100g: 80, source_id: "ciqual-2025" },
        { food_code: "oil", nutrient_id: "fat_g", value_per_100g: 100, source_id: "ciqual-2025" },
        { food_code: "seitan", nutrient_id: "protein_g", value_per_100g: 25, source_id: "ciqual-2025" },
        { food_code: "seitan", nutrient_id: "energy_eu_kcal", value_per_100g: 140, source_id: "ciqual-2025" },
      ],
      impacts: [
        ...BASE.impacts,
        { food_code: "seitan", indicator_id: "ghg_100y_kgco2e", value_per_kg: 2, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
        { food_code: "butter", indicator_id: "ghg_100y_kgco2e", value_per_kg: 9, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
        { food_code: "oil", indicator_id: "ghg_100y_kgco2e", value_per_kg: 3, low_per_kg: null, high_per_kg: null, dqr: 2, source_id: "agribalyse-3.2" },
      ],
    },
    candidates: [
      { code: "beans", name_fr: "Haricot", food_subgroup: "légumineuses", protein_g: 10, fat_g: 1, energy_kcal: 100 },
      { code: "seitan", name_fr: "Seitan, préemballé", food_subgroup: "ingrédients pour végétariens", protein_g: 25, fat_g: 2, energy_kcal: 140 },
    ],
    rules: [{ priority: 80, match_type: "subgroup", match_value: "beurres", to_code: "oil", ratio: 1, ratio_basis: "fat_g", justification: "Beurre → huile, même matière grasse." }],
    context: { fatPer100g: { butter: 80, oil: 100 }, cookingYieldPct: {} },
    recipe: { kind: "type" },
    ...over,
  };
}

describe("rankedCandidates", () => {
  it("ranks the candidates against the main animal ingredient, closest protein first", () => {
    const r = rankedCandidates(input());
    expect(r.map((c) => c.code)).toEqual(["seitan", "beans"]);
    expect(r[0].reason).toContain("la plus proche en protéines");
    expect(r[0].family).toBe("blé");
  });
});

describe("buildAutoPage", () => {
  it("replaces the main ingredient by the chosen protein at equal mass and the butter by the rule", () => {
    const { model, unmatched } = buildAutoPage(input(), "beans")!;
    const v = model.variants.beans!;
    expect(v.dish.ingredients.map((i) => [i.code, i.grams])).toEqual([["beans", 400], ["nodata", 100], ["oil", 16]]);
    expect(unmatched).toEqual([]);
    expect(model.choices.map((c) => c.id)).toEqual(["seitan", "beans"]);
    expect(model.choices[1].detail).toBe("10 g de protéines pour 100 g");
  });

  it("never shows a vegan claim of a Ciqual name (rule 10)", () => {
    const i = input();
    i.candidates[1] = { ...i.candidates[1], name_fr: "Seitan (convient aux véganes ou végétaliens), préemballé" };
    const { model } = buildAutoPage(i, "seitan")!;
    expect(JSON.stringify(model.choices)).not.toMatch(/v[ée]gan|v[ée]g[ée]talien/i);
    expect(model.variants.seitan!.dish.name).not.toMatch(/v[ée]gan/i);
  });

  it("raises the chosen protein, not another ingredient, in the completed version", () => {
    const { model } = buildAutoPage(input(), "beans")!;
    expect(model.completed.beans?.boost?.code).toBe("beans");
  });

  it("returns null for an unknown protein code", () => {
    expect(buildAutoPage(input(), "nothing")).toBeNull();
  });
});

describe("climateWins", () => {
  it("counts the proteins for which the plant version emits less (ranges not overlapping)", () => {
    expect(climateWins(input())).toEqual({ wins: 2, total: 2 });
  });
});

describe("officialIngredients", () => {
  it("scales the official recipe to the mass of our dish and keeps the sides", () => {
    const rows = officialIngredients(
      "A",
      [
        { dish_code: "25009", flow: "Ground beef", food_code: "6254", ingredient_fr: "Bœuf haché", kg_per_kg_dish: 0.3 },
        { dish_code: "25009", flow: "Potato", food_code: "4008", ingredient_fr: "Pommes de terre", kg_per_kg_dish: 0.6 },
        { dish_code: "25009", flow: "Mushroom", food_code: null, ingredient_fr: "Champignon", kg_per_kg_dish: 0.1 },
      ],
      [
        { dish_id: "A", food_code: "6255", grams: 400, note: "bœuf" },
        { dish_id: "A", food_code: "20031", grams: 200, note: "salade" },
      ],
      ["20031"],
    );
    // main dish of our recipe = 400 g (salad kept as a side): official kg per kg × 400 g
    expect(rows.map((r) => [r.food_code, Math.round(r.grams), r.note])).toEqual([
      ["6254", 120, "bœuf haché (recette officielle)"],
      ["4008", 240, "pommes de terre (recette officielle)"],
      ["agb30:Mushroom", 40, "champignon (recette officielle, sans donnée)"],
      ["20031", 200, "salade"],
    ]);
  });
});

describe("recipe link (« Modifier cette recette »)", () => {
  it("round-trips the recipe, without the official inputs that have no code", async () => {
    const { recipeHref, parseSharedRecipe } = await import("@/lib/compare/recipe-link");
    const href = recipeHref({ slug: "x", name: "Hachis", description: null, servings: 4, gramsPerServing: 300, ingredients: [
      { code: "6254", label: "bœuf haché", officialName: null, grams: 400.4, isAnimal: true },
      { code: "agb30:Mushroom", label: "champignon", officialName: null, grams: 40, isAnimal: false },
    ] });
    const back = parseSharedRecipe(decodeURIComponent(href.split("recette=")[1]));
    expect(back).toEqual({ name: "Hachis", servings: 4, ingredients: [{ code: "6254", name: "bœuf haché", grams: 400, isAnimal: true }] });
    expect(parseSharedRecipe("{not json")).toBeNull();
  });
});

describe("official dish: published impact kept on both sides (suite V1, 5 quater)", () => {
  // Dish of 1 kg: beef 0.3 kg (contribution 9 kg CO2e per kg of dish), potato 0.7 kg (0.1), other steps 0.5.
  const official = [
    { dish_code: "D", flow: "Beef", food_code: "meat", ingredient_fr: "Bœuf haché", kg_per_kg_dish: 0.3 },
    { dish_code: "D", flow: "Potato", food_code: "nodata", ingredient_fr: "Pommes de terre", kg_per_kg_dish: 0.7 },
  ];
  const contributions = [
    { ingredient: "Bœuf haché", indicator_id: "ghg_100y_kgco2e", value_per_kg: 9, source_id: "agribalyse-3.2" },
    { ingredient: "Pommes de terre", indicator_id: "ghg_100y_kgco2e", value_per_kg: 0.1, source_id: "agribalyse-3.2" },
    { ingredient: "Autres étapes", indicator_id: "ghg_100y_kgco2e", value_per_kg: 0.5, source_id: "agribalyse-3.2" },
  ];
  it("animal = published impact; plant = published − replaced contributions + substitute × its impact per kg", async () => {
    const { officialRecipe } = await import("@/lib/compare/auto");
    const base = input();
    const r = officialRecipe({ dishId: "A", dishCode: "D", official, contributions, ours: [{ dish_id: "A", food_code: "__mass", grams: 1000, note: null }], sides: [], raw: base.raw, context: base.context });
    const i: AutoInput = { ...base, raw: { ...base.raw, animal: { ...base.raw.animal, servings: 1, fixed_impacts: r.fixed }, foods: [...base.raw.foods, ...r.foods], impacts: [...base.raw.impacts, ...r.impacts], ingredients: r.ingredients }, context: r.context };
    const { model } = buildAutoPage(i, "seitan")!;
    const co2 = model.variants.seitan!.rows.perServing.find((x) => x.id === "ghg_100y_kgco2e")!;
    expect(co2.animal!.value).toBeCloseTo(9 + 0.1 + 0.5); // published total of 1 kg of dish
    expect(co2.vegetal!.value).toBeCloseTo(9 + 0.1 + 0.5 - 9 + 0.3 * 2); // seitan 0.3 kg × 2 kg CO2e/kg
  });
});
