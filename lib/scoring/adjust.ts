// One plant version that the visitor adjusts (suite V1, step 3 quinquies, decision of Matt 19 h 31).
// Pure: no network. Written as generic constraints { indicator, sense, target } (point 8 bis) so
// that V2 can open every indicator; V1 builds them from three requests only:
// - equalise protein ("=" on protein: the main protein is raised or lowered, at most maxBoostFactor
//   × its starting mass; beyond, the gap goes to the whitelist like any other gap);
// - equalise calories ("=" on energy: the whole plant serving is scaled);
// - close gaps (">=" on a nutrient: the smallest additions from the whitelist, solveComplements).
// The animal dish never changes. Indicators reached by an adjustment are « filled »: not scored.

import { solveComplements, type ComplementFood } from "./complements";
import { boostMainProtein, scaleDish } from "./scale";
import { dishTotals, type TotalsOptions } from "./totals";
import type { Dish, DishTotals, ScoringData } from "./types";

export type AdjustSense = "=" | ">=" | "<=";

export interface AdjustConstraint {
  indicator: string;
  sense: AdjustSense;
  /** Per serving, in the unit of the indicator. */
  target: number;
}

export interface AdjustRequest {
  equalize: "none" | "protein" | "energy";
  /** Nutrients to bring at least to the animal dish; "all" = every completable gap. */
  close: string[] | "all";
  /** Grams per serving of the main protein, set by hand (overrides the protein equalisation). */
  mainGramsPerServing?: number | null;
}

export interface AdjustResult {
  dish: Dish;
  constraints: AdjustConstraint[];
  boost: { code: string; extraGrams: number; capped: boolean } | null;
  /** Factor applied to the whole plant serving (calories); null when not scaled. */
  scale: number | null;
  /** Additions from the whitelist, grams per serving. */
  additions: { code: string; grams: number; nutrients: string[] }[];
  closed: string[];
  open: string[];
  /** Indicators reached by the adjustment: shown « comblé », not counted in the Nutrition score. */
  filled: string[];
}

const PROTEIN = "protein_g";
const ENERGY = "energy_eu_kcal";
const EPS = 1e-9;

const high = (t: DishTotals, id: string) => t.nutrients[id]?.highPerServing ?? t.nutrients[id]?.perServing ?? null;
const low = (t: DishTotals, id: string) => t.nutrients[id]?.lowPerServing ?? t.nutrients[id]?.perServing ?? null;

function setMain(dish: Dish, code: string, grams: number): Dish {
  return { ...dish, ingredients: dish.ingredients.map((i) => (i.foodCode === code ? { ...i, grams: Math.max(0, grams) } : i)) };
}

export function adjustDish(args: {
  dish: Dish;
  data: ScoringData;
  /** Main protein of the plant version (the protein chosen by the visitor). */
  main: string;
  animal: DishTotals;
  request: AdjustRequest;
  complements: ComplementFood[];
  limits?: Record<string, number>;
  maxBoostFactor: number;
  /** Nutrients a food can add (« plus = mieux », data/score_rules.json). */
  completable: string[];
  totalsOptions?: TotalsOptions;
}): AdjustResult {
  const { data, main, animal, request } = args;
  let dish = args.dish;
  const constraints: AdjustConstraint[] = [];
  let boost: AdjustResult["boost"] = null;
  let scale: number | null = null;
  const filled = new Set<string>();
  const totals = (d: Dish) => dishTotals(d, data, args.totalsOptions);
  const mainGrams = dish.ingredients.find((i) => i.foodCode === main)?.grams ?? 0;
  const proteinTarget = animal.proteinPerServing;
  let proteinGapToList = false;

  // 1. Equalities (one at a time: protein, calories, or a quantity set by hand).
  if (request.mainGramsPerServing != null) {
    dish = setMain(dish, main, request.mainGramsPerServing * dish.servings);
  } else if (request.equalize === "protein" && proteinTarget != null) {
    constraints.push({ indicator: PROTEIN, sense: "=", target: proteinTarget });
    const current = totals(dish).proteinPerServing;
    const per100 = data.foods[main]?.nutrients[PROTEIN];
    if (current != null && per100 != null && per100 > 0) {
      if (current > proteinTarget + EPS) {
        // Lower the main protein (never below 0).
        dish = setMain(dish, main, mainGrams - ((current - proteinTarget) * dish.servings * 100) / per100);
        filled.add(PROTEIN);
      } else {
        const others = dish.ingredients.map((i) => i.foodCode).filter((c) => c !== main);
        const b = boostMainProtein(dish, data, proteinTarget, others, args.maxBoostFactor);
        if (b) {
          dish = b.dish;
          boost = { code: b.code, extraGrams: b.extraGrams, capped: b.capped };
          proteinGapToList = b.capped;
        }
        if (!b || !b.capped) filled.add(PROTEIN);
      }
    }
  } else if (request.equalize === "energy") {
    const a = animal.kcalPerServing;
    const v = totals(dish).kcalPerServing;
    if (a != null && v != null && v > 0) {
      constraints.push({ indicator: ENERGY, sense: "=", target: a });
      scale = a / v;
      dish = scaleDish(dish, scale);
    }
  }

  // 2. Gaps (">="), after the equalisation; protein beyond the plausible serving joins them.
  const asked = new Set(request.close === "all" ? args.completable : request.close);
  if (proteinGapToList) asked.add(PROTEIN);
  const t = totals(dish);
  const gaps: Record<string, number> = {};
  const base: Record<string, number> = {};
  for (const id of asked) {
    const a = high(animal, id);
    const p = low(t, id);
    const h = high(t, id);
    if (h != null) base[id] = h;
    if (a != null && p != null && a > p + EPS) {
      gaps[id] = a - p;
      constraints.push({ indicator: id, sense: ">=", target: a });
    }
  }
  const solved = args.complements.length ? solveComplements(gaps, args.complements, { limits: args.limits, base }) : { additions: [], closed: [], open: Object.keys(gaps) };
  if (solved.additions.length) {
    const merged = new Map(dish.ingredients.map((i) => [i.foodCode, i.grams]));
    for (const a of solved.additions) merged.set(a.code, (merged.get(a.code) ?? 0) + a.grams * dish.servings);
    dish = { ...dish, ingredients: [...merged].map(([foodCode, grams]) => ({ foodCode, grams })) };
  }
  for (const id of solved.closed) filled.add(id);
  if (proteinGapToList && !solved.closed.includes(PROTEIN)) filled.delete(PROTEIN);

  return { dish, constraints, boost, scale, additions: solved.additions, closed: solved.closed, open: solved.open, filled: [...filled] };
}
