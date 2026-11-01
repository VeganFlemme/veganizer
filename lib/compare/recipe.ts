// Pure: /recette ("Analyse ta recette"). Substitutions ingredient by ingredient from the reviewed
// table (pipeline/substitutions.csv), then the same page model as /compare (lib/compare/view.ts).

import { buildPairPage, type DishPriceRow, type FoodPriceRow, type PairPageModel, type RawPairData } from "./view";

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
  justification: string;
}

export interface SubstitutionChange {
  from: string;
  to: string;
  grams: number;
  newGrams: number;
  justification: string;
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
    const grams = rule ? i.grams * rule.ratio : i.grams;
    if (rule) changes.push({ from: i.code, to: rule.to_code, grams: i.grams, newGrams: grams, justification: rule.justification });
    out.set(code, (out.get(code) ?? 0) + grams);
  }
  return { ingredients: [...out].map(([code, grams]) => ({ code, grams })), changes, unmatched };
}

/** Same rule as the dish_prices_best view: covered grams × median price, coverage reported. */
export function dishPriceFromFoods(dishId: string, servings: number, ingredients: RecipeIngredient[], prices: FoodPriceRow[]): DishPriceRow | null {
  const total = ingredients.reduce((s, i) => s + i.grams, 0);
  let eur = 0;
  let covered = 0;
  const sources = new Set<string>();
  let first: string | null = null;
  let last: string | null = null;
  for (const i of ingredients) {
    const p = prices.find((x) => x.food_code === i.code);
    if (!p) continue;
    eur += (i.grams / 1000) * Number(p.median_eur_per_kg);
    covered += i.grams;
    sources.add(p.source_id);
    if (p.first_observed_on && (!first || p.first_observed_on < first)) first = p.first_observed_on;
    if (p.last_observed_on && (!last || p.last_observed_on > last)) last = p.last_observed_on;
  }
  if (covered === 0 || total === 0) return null;
  return {
    dish_id: dishId,
    source_ids: [...sources].sort(),
    per_serving: eur / servings,
    low_per_serving: null,
    high_per_serving: null,
    mass_coverage: covered / total,
    first_observed_on: first,
    last_observed_on: last,
  };
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
