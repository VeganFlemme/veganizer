// Pure: price of a dish from the price per kg of its foods (same rule as the dish_prices_best view).

import type { DishPriceRow, FoodPriceRow } from "./view";

export interface PricedIngredient {
  code: string;
  grams: number;
}

/** Same rule as the dish_prices_best view: covered grams × median price, coverage reported. */
export function dishPriceFromFoods(dishId: string, servings: number, ingredients: PricedIngredient[], prices: FoodPriceRow[]): DishPriceRow | null {
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

