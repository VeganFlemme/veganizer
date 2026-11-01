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
