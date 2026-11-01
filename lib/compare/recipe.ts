// Pure: /recette ("Analyse ta recette"). Substitutions ingredient by ingredient from the reviewed
// table (pipeline/substitutions.csv), then the same page model as /compare (lib/compare/view.ts).

import { dishPriceFromFoods } from "./prices";
import { buildPairPage, type DishPriceRow, type FoodPriceRow, type PairPageModel, type RawPairData } from "./view";

export { dishPriceFromFoods };

export interface RecipeIngredient {
  code: string;
  grams: number;
}

export interface RecipeFood {
  code: string;
  name_fr: string;
  is_animal: boolean;
  animal_category: string | null;
  food_subgroup: string | null;
  iarc_meat: string | null;
}

export interface SubstitutionRule {
  priority: number;
  match_type: "iarc" | "name_regex" | "subgroup" | "category";
  match_value: string;
  to_code: string;
  ratio: number;
  /** How newGrams is computed (migration 20261103000000): null = grams × ratio. */
  ratio_basis?: "fat_g" | "cooking_yield" | null;
  justification: string;
}

export interface SubstitutionChange {
  from: string;
  to: string;
  grams: number;
  newGrams: number;
  /** Data the quantity rests on; null = the fixed ratio of the rule (data missing or none asked). */
  basis: "fat_g" | "cooking_yield" | null;
  justification: string;
}

/** Data for the computed ratios: Ciqual lipids per 100 g, USDA cooking yields (%) by raw food code. */
export interface SubstitutionContext {
  fatPer100g: Record<string, number | undefined>;
  cookingYieldPct: Record<string, number | undefined>;
}

// Unit conversion only: a yield is published in percent.
const PERCENT = 100;

/** Quantity of the substitute and what it rests on. */
function substituteGrams(rule: SubstitutionRule, from: string, grams: number, ctx: SubstitutionContext): { grams: number; basis: SubstitutionChange["basis"] } {
  if (rule.ratio_basis === "fat_g") {
    const a = ctx.fatPer100g[from];
    const b = ctx.fatPer100g[rule.to_code];
    if (a != null && b != null && b > 0) return { grams: (grams * a) / b, basis: "fat_g" };
  }
  if (rule.ratio_basis === "cooking_yield") {
    const y = ctx.cookingYieldPct[from];
    if (y != null && y > 0) return { grams: (grams * y) / PERCENT, basis: "cooking_yield" };
  }
  return { grams: grams * rule.ratio, basis: null };
}

function matches(rule: SubstitutionRule, f: RecipeFood): boolean {
  switch (rule.match_type) {
    case "iarc":
      return f.iarc_meat === rule.match_value;
    case "name_regex":
      return new RegExp(rule.match_value, "i").test(f.name_fr);
    case "subgroup":
      return f.food_subgroup === rule.match_value;
    case "category":
      return f.animal_category === rule.match_value;
  }
}

/** Replaces each animal ingredient by the first matching rule (by priority). Plant ingredients are kept. */
export function applySubstitutions(
  ingredients: RecipeIngredient[],
  foods: Record<string, RecipeFood | undefined>,
  rules: SubstitutionRule[],
  context: SubstitutionContext = { fatPer100g: {}, cookingYieldPct: {} },
): { ingredients: RecipeIngredient[]; changes: SubstitutionChange[]; unmatched: string[] } {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const out = new Map<string, number>();
  const changes: SubstitutionChange[] = [];
  const unmatched: string[] = [];
  for (const i of ingredients) {
    const f = foods[i.code];
    const rule = f?.is_animal ? sorted.find((r) => matches(r, f)) : undefined;
    if (f?.is_animal && !rule) unmatched.push(i.code);
    const code = rule ? rule.to_code : i.code;
    const sub = rule ? substituteGrams(rule, i.code, i.grams, context) : { grams: i.grams, basis: null };
    const grams = sub.grams;
    if (rule) changes.push({ from: i.code, to: rule.to_code, grams: i.grams, newGrams: grams, basis: sub.basis, justification: rule.justification });
    out.set(code, (out.get(code) ?? 0) + grams);
  }
  return { ingredients: [...out].map(([code, grams]) => ({ code, grams })), changes, unmatched };
}

/** Context of the computed ratios from the loaded rows (nutrients read through ciqual_code, as dish_nutrients). */
export function substitutionContext(data: Pick<RecipeData, "foods" | "nutrientValues"> & { cookingYields?: { raw_code: string; yield_pct: number }[] }): SubstitutionContext {
  const fatPer100g: SubstitutionContext["fatPer100g"] = {};
  for (const f of data.foods) {
    const n = data.nutrientValues.find((x) => x.food_code === (f.ciqual_code ?? f.code) && x.nutrient_id === "fat_g");
    if (n?.value_per_100g != null) fatPer100g[f.code] = Number(n.value_per_100g);
  }
  const cookingYieldPct: SubstitutionContext["cookingYieldPct"] = {};
  for (const y of data.cookingYields ?? []) cookingYieldPct[y.raw_code] = Number(y.yield_pct);
  return { fatPer100g, cookingYieldPct };
}

export type RecipeData = Omit<RawPairData, "animal" | "vegetal" | "pairs" | "ingredients" | "dishPrices"> & {
  foodPrices: FoodPriceRow[];
};

/** Page model of a user recipe and its plant version, identical to /compare. */
export function buildRecipePage(
  recipe: { name: string; servings: number; ingredients: RecipeIngredient[] },
  plant: RecipeIngredient[],
  data: RecipeData,
): PairPageModel {
  const animal = { id: "R", slug: "ma-recette", name_fr: recipe.name || "Ma recette", kind: "animal", servings: recipe.servings, description: null };
  const vegetal = { id: "V", slug: "ma-recette-vegetale", name_fr: `${recipe.name || "Ma recette"}, version végétale`, kind: "vegetal", servings: recipe.servings, description: null };
  const rows = (dishId: string, list: RecipeIngredient[]) => list.map((i) => ({ dish_id: dishId, food_code: i.code, grams: i.grams, note: null }));
  const prices = [dishPriceFromFoods("R", recipe.servings, recipe.ingredients, data.foodPrices), dishPriceFromFoods("V", recipe.servings, plant, data.foodPrices)];
  return buildPairPage({
    ...data,
    animal,
    vegetal: [vegetal],
    pairs: [{ vegan_dish_id: "V", variant: "maison", rationale: "Substitutions ingrédient par ingrédient, d'après une table relue (justification affichée pour chacune)." }],
    ingredients: [...rows("R", recipe.ingredients), ...rows("V", plant)],
    dishPrices: prices.filter((p): p is DishPriceRow => p != null),
  });
}
