// « Modifier cette recette » (suite V1, decision of Matt 17 h 25): /recette opened with the recipe
// of the animal dish (?recette=<JSON>). Pure; shared by the pages and by /recette.
import { NO_CODE_PREFIX } from "./auto";
import type { DishView } from "./view";

export interface SharedRecipe {
  name: string;
  servings: number;
  ingredients: { code: string; name: string; grams: number; isAnimal: boolean }[];
}

/** Ingredients without a Ciqual code (official inputs without data) are left out: /recette cannot use them. */
export function recipeHref(dish: DishView): string {
  const r: SharedRecipe = {
    name: dish.name,
    servings: dish.servings,
    ingredients: dish.ingredients.filter((i) => !i.code.startsWith(NO_CODE_PREFIX)).map((i) => ({ code: i.code, name: i.label, grams: Math.round(i.grams), isAnimal: i.isAnimal })),
  };
  return `/recette?recette=${encodeURIComponent(JSON.stringify(r))}`;
}

/** Reads ?recette= back; null when absent or malformed (never throws). */
export function parseSharedRecipe(param: string | null): SharedRecipe | null {
  if (!param) return null;
  try {
    const r = JSON.parse(param) as SharedRecipe;
    if (typeof r?.name !== "string" || !Array.isArray(r.ingredients)) return null;
    const ingredients = r.ingredients.filter((i) => typeof i?.code === "string" && Number.isFinite(i.grams) && i.grams > 0).slice(0, 40);
    const servings = Number.isInteger(r.servings) && r.servings > 0 && r.servings <= 50 ? r.servings : 4;
    return { name: r.name.slice(0, 120), servings, ingredients: ingredients.map((i) => ({ code: i.code, name: String(i.name ?? i.code).slice(0, 160), grams: i.grams, isAnimal: !!i.isAnimal })) };
  } catch {
    return null;
  }
}
