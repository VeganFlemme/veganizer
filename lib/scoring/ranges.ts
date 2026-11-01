// Display rounding, ranges and verdicts of one indicator. Pure: no network, no Supabase.
// Decisions of Matt (2026-11-01, review of PR #15): one rounding rule per unit; a point only when
// the ranges of the two dishes do not overlap; ingredients identical on both sides do not count
// in the coverage of a verdict, since their contribution cancels out.

import type { Basis } from "./compare";
import { dishTotals, type TotalsOptions } from "./totals";
import type { Amount, Dish, DishTotals, ScoringData } from "./types";

/** Units shown with exactly two decimals (« 0,65 », « 1,20 », « 1,00 »). */
const TWO_DECIMAL_UNITS = new Set(["kg CO2e", "€"]);
const SIGNIFICANT_DIGITS = 3;
const GRAMS_EPSILON = 1e-9;

export interface Range {
  low: number;
  high: number;
}

/** Display precision of a value: 2 decimals for kg CO2e and euros, 3 significant digits otherwise. */
export function roundForUnit(x: number, unit: string | undefined): number {
  if (!Number.isFinite(x) || x === 0) return x;
  if (unit && TWO_DECIMAL_UNITS.has(unit)) return Math.round(x * 100) / 100 + 0;
  return Number(x.toPrecision(SIGNIFICANT_DIGITS));
}

/** [low, high] of an amount at a basis; null when neither a value nor a range is known. */
export function amountBounds(a: Amount | undefined, basis: Basis, totals: Pick<DishTotals, "kcalPerServing" | "proteinPerServing">): Range | null {
  if (!a) return null;
  const low = a.lowPerServing ?? a.perServing;
  const high = a.highPerServing ?? a.perServing;
  if (low == null || high == null) return null;
  const k = basis === "perServing" ? 1 : basis === "per100kcal" ? (totals.kcalPerServing ? 100 / totals.kcalPerServing : null) : totals.proteinPerServing ? 10 / totals.proteinPerServing : null;
  if (k == null) return null;
  return { low: Math.min(low, high) * k, high: Math.max(low, high) * k };
}

/**
 * Verdict of one indicator from the two ranges, rounded as displayed: a point only when they do
 * not overlap; overlapping ranges (or equal values after rounding) are a tie.
 */
export function judgeRanges(animal: Range, vegetal: Range, higherIsBetter: boolean, unit?: string): "animal" | "vegetal" | "egal" {
  const r = (x: number) => roundForUnit(x, unit);
  const [al, ah, vl, vh] = [r(animal.low), r(animal.high), r(vegetal.low), r(vegetal.high)];
  if (al <= vh && vl <= ah) return "egal";
  const plantLower = vh < al;
  return plantLower !== higherIsBetter ? "vegetal" : "animal";
}

function merged(d: Dish): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of d.ingredients) m.set(i.foodCode, (m.get(i.foodCode) ?? 0) + i.grams);
  return m;
}

/**
 * Ingredients strictly identical on both sides (same code, same grams per serving) and the two
 * dishes without them (null when nothing is left). Their contribution per serving is the same on
 * both sides, so it cancels out in the comparison.
 */
export function withoutSharedIngredients(animal: Dish, vegetal: Dish): { shared: string[]; animal: Dish | null; vegetal: Dish | null } {
  const a = merged(animal);
  const v = merged(vegetal);
  const shared = [...a.keys()].filter((code) => v.has(code) && Math.abs(a.get(code)! / animal.servings - v.get(code)! / vegetal.servings) < GRAMS_EPSILON);
  const rest = (d: Dish, m: Map<string, number>): Dish | null => {
    const ingredients = [...m].filter(([code]) => !shared.includes(code)).map(([foodCode, grams]) => ({ foodCode, grams }));
    return ingredients.length ? { servings: d.servings, ingredients } : null;
  };
  return { shared, animal: rest(animal, a), vegetal: rest(vegetal, v) };
}

/** Totals of an empty remainder: every indicator of `like` is a real 0 with full coverage. */
function zeroTotals(servings: number, like: DishTotals): DishTotals {
  const zero = (r: Record<string, Amount>) =>
    Object.fromEntries(
      Object.keys(r).map((id) => [id, { perServing: 0, lowPerServing: 0, highPerServing: 0, per100kcal: null, per10gProtein: null, massCoverage: 1, worstDqr: null, sourceIds: [] } satisfies Amount]),
    );
  return { totalGrams: 0, servings, kcalPerServing: null, proteinPerServing: null, nutrients: zero(like.nutrients), impacts: zero(like.impacts), animalImpacts: zero(like.animalImpacts) };
}

/**
 * Totals used to judge each indicator per serving: the two dishes without their identical
 * ingredients. Values, ranges and coverage then describe only what differs.
 */
export function verdictTotals(animal: Dish, vegetal: Dish, data: ScoringData, options: TotalsOptions = {}): { animal: DishTotals; vegetal: DishTotals } {
  const r = withoutSharedIngredients(animal, vegetal);
  const a = r.animal ? dishTotals(r.animal, data, options) : null;
  const v = r.vegetal ? dishTotals(r.vegetal, data, options) : null;
  if (a && v) return { animal: a, vegetal: v };
  if (a) return { animal: a, vegetal: zeroTotals(vegetal.servings, a) };
  if (v) return { animal: zeroTotals(animal.servings, v), vegetal: v };
  const empty = dishTotals(animal, data, options);
  return { animal: zeroTotals(animal.servings, empty), vegetal: zeroTotals(vegetal.servings, empty) };
}
