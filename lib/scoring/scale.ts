// « À protéines égales » (suite V1, step 1): the plant version scaled so that it brings as much
// protein as the animal dish. Pure: no network, no Supabase.

import type { Dish, DishTotals } from "./types";

/**
 * Animal protein / plant protein per serving, from the data. null when a total is unknown, only
 * known as a range, or zero: no scale is invented.
 */
export function equalProteinFactor(animal: DishTotals, vegetal: DishTotals): number | null {
  const a = animal.proteinPerServing;
  const v = vegetal.proteinPerServing;
  if (a == null || v == null || !(a > 0) || !(v > 0)) return null;
  return a / v;
}

/** Every ingredient multiplied by `factor`; same number of servings. */
export function scaleDish(dish: Dish, factor: number): Dish {
  return { servings: dish.servings, ingredients: dish.ingredients.map((i) => ({ foodCode: i.foodCode, grams: i.grams * factor })) };
}

/**
 * « Version complétée » (decision of Matt, 2026-11-01, 17 h 12): only the main protein of the plant
 * version is increased, up to the protein of the animal dish per serving. Main protein = the
 * ingredient, among those not shared with the animal dish, that brings the most protein. null when
 * there is nothing to add or no such ingredient with a known protein value.
 */
export function boostMainProtein(
  dish: Dish,
  data: { foods: Record<string, { nutrients: Record<string, number | null | undefined> } | undefined> },
  targetProteinPerServing: number,
  sharedCodes: string[],
  /** Plausible serving (5 ter): the main protein never exceeds maxFactor × its starting mass. */
  maxFactor?: number,
): { dish: Dish; code: string; extraGrams: number; capped: boolean } | null {
  const per100 = (code: string) => data.foods[code]?.nutrients.protein_g;
  const known = dish.ingredients.map((i) => ({ ...i, p: per100(i.foodCode) }));
  if (known.some((i) => i.p == null)) return null; // total not known: no invented boost
  const current = known.reduce((s, i) => s + (i.grams / 100) * i.p!, 0) / dish.servings;
  const missing = targetProteinPerServing - current;
  if (!(missing > 0)) return null;
  const candidates = known.filter((i) => !sharedCodes.includes(i.foodCode) && i.p! > 0);
  if (candidates.length === 0) return null;
  const main = candidates.reduce((a, b) => ((b.grams * b.p!) > (a.grams * a.p!) ? b : a));
  const needed = (missing * dish.servings * 100) / main.p!;
  const cap = maxFactor != null ? (maxFactor - 1) * main.grams : Number.POSITIVE_INFINITY;
  const extraGrams = Math.min(needed, cap);
  if (!(extraGrams > 0)) return null;
  return {
    code: main.foodCode,
    extraGrams,
    capped: needed > cap,
    dish: { servings: dish.servings, ingredients: dish.ingredients.map((i) => (i.foodCode === main.foodCode ? { foodCode: i.foodCode, grams: i.grams + extraGrams } : i)) },
  };
}
