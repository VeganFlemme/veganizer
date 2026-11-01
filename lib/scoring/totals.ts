import type { Amount, CategoryFactor, Dish, DishTotals, FoodData, ScoringData } from "./types";

// Unit conversions: the only constants allowed in code.
const GRAMS_PER_KG = 1000;
const GRAMS_PER_100G = 100;

export interface TotalsOptions {
  /** Nutrient id used for "per 100 kcal". Default: Ciqual energy, EU regulation 1169/2011. */
  energyNutrientId?: string;
  /** Nutrient id used for "per 10 g of protein". */
  proteinNutrientId?: string;
  /**
   * Derived nutrients: id -> components summed ingredient by ingredient (e.g. EPA + DHA). An
   * ingredient counts only when every component is known (a number or « < x »).
   */
  nutrientSums?: Record<string, string[]>;
}

/** Sum of contributions for one indicator, before division by servings. */
interface Accumulator {
  value: number;
  low: number;
  high: number;
  coveredGrams: number;
  worstDqr: number | null;
  sourceIds: Set<string>;
  censored: boolean;
}

interface Contribution {
  value: number;
  low: number;
  high: number;
  dqr: number | null;
  sourceId: string | null;
  censored?: boolean;
}

function add(acc: Map<string, Accumulator>, id: string, grams: number, c: Contribution): void {
  let a = acc.get(id);
  if (!a) {
    a = { value: 0, low: 0, high: 0, coveredGrams: 0, worstDqr: null, sourceIds: new Set(), censored: false };
    acc.set(id, a);
  }
  a.value += c.value;
  a.low += c.low;
  a.high += c.high;
  a.coveredGrams += grams;
  if (c.censored) a.censored = true;
  if (c.dqr != null) a.worstDqr = a.worstDqr == null ? c.dqr : Math.max(a.worstDqr, c.dqr);
  if (c.sourceId) a.sourceIds.add(c.sourceId);
}

function validate(dish: Dish): number {
  if (!Number.isInteger(dish.servings) || dish.servings <= 0) {
    throw new Error(`servings must be a positive integer, got ${dish.servings}`);
  }
  if (dish.ingredients.length === 0) throw new Error("a dish needs at least one ingredient");
  let total = 0;
  for (const i of dish.ingredients) {
    if (!Number.isFinite(i.grams) || i.grams <= 0) {
      throw new Error(`grams must be > 0 for ${i.foodCode}, got ${i.grams}`);
    }
    total += i.grams;
  }
  return total;
}

function finite(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

const ANIMALS_KILLED = "animals_killed_land";

/**
 * Factor per kg of product for one category and indicator. A per-animal factor is
 * multiplied by animals killed per kg of the same category (bounds × bounds);
 * without that factor it is missing data (null), never 0.
 */
/** The factor of an indicator that applies to this food: limited to it first, then general. */
export function factorFor(entry: CategoryFactor | CategoryFactor[] | undefined, foodCode: string): CategoryFactor | undefined {
  const list = entry == null ? [] : Array.isArray(entry) ? entry : [entry];
  return list.find((f) => f.foodCodes?.includes(foodCode)) ?? list.find((f) => !f.foodCodes);
}

function perKg(
  byIndicator: Record<string, CategoryFactor | CategoryFactor[] | undefined> | undefined,
  id: string,
  foodCode: string,
): { value: number; low: number; high: number; sourceIds: string[] } | null {
  const f = factorFor(byIndicator?.[id], foodCode);
  if (!f || !finite(f.value)) return null;
  const low = finite(f.low) ? f.low : f.value;
  const high = finite(f.high) ? f.high : f.value;
  if ((f.per ?? "kg") === "kg") return { value: f.value, low, high, sourceIds: [f.sourceId] };
  const k = factorFor(byIndicator?.[ANIMALS_KILLED], foodCode);
  if (!k || !finite(k.value) || (k.per ?? "kg") !== "kg") return null;
  const kl = finite(k.low) ? k.low : k.value;
  const kh = finite(k.high) ? k.high : k.value;
  return { value: f.value * k.value, low: low * kl, high: high * kh, sourceIds: [f.sourceId, k.sourceId] };
}

/**
 * Totals of a dish per serving, per 100 kcal and per 10 g of protein.
 *
 * Same rules as the SQL views dish_impacts / dish_nutrients / dish_animal_impacts:
 * - value per serving = Σ (grams_i × value_i) / servings, over ingredients that HAVE the value;
 * - a missing value is never counted as 0: it lowers massCoverage instead;
 * - an indicator no ingredient has is absent from the result (donnée manquante);
 * - published negative values are kept as they are;
 * - a missing low/high bound falls back on the central value;
 * - a nutrient published as « < x » (FoodData.nutrientMax) is covered, adds 0 to the low bound and
 *   x to the high bound; the dish then has a range and no central value (Amount.censored).
 *
 * Animal impacts: an ingredient with isAnimal = false contributes a real 0 (no
 * animal ingredient identified) and counts as covered; an animal ingredient
 * without a factor for its category is missing data.
 *
 * Normalisation per 100 kcal / per 10 g protein is only done when energy /
 * protein is known for the whole mass (a partial denominator would inflate it).
 */
export function dishTotals(dish: Dish, data: ScoringData, options: TotalsOptions = {}): DishTotals {
  const energyId = options.energyNutrientId ?? "energy_eu_kcal";
  const proteinId = options.proteinNutrientId ?? "protein_g";
  const totalGrams = validate(dish);

  const nutrients = new Map<string, Accumulator>();
  const impacts = new Map<string, Accumulator>();
  const animal = new Map<string, Accumulator>();

  const animalIndicatorIds = new Set<string>();
  for (const byIndicator of Object.values(data.categoryFactors)) {
    for (const id of Object.keys(byIndicator ?? {})) animalIndicatorIds.add(id);
  }

  for (const { foodCode, grams } of dish.ingredients) {
    const food: FoodData | undefined = data.foods[foodCode];
    if (!food) continue; // unknown food: missing for every indicator

    // Per 100 g of this food: exact value, or [0, x] for a value published as « < x ».
    const per100 = (id: string): { low: number; high: number; censored: boolean } | null => {
      const v = food.nutrients[id];
      if (finite(v)) return { low: v, high: v, censored: false };
      const max = food.nutrientMax?.[id];
      return finite(max) ? { low: 0, high: max, censored: true } : null;
    };
    const ids = new Set([...Object.keys(food.nutrients), ...Object.keys(food.nutrientMax ?? {})]);
    const sourceId = food.nutrientSourceId ?? null;
    for (const id of ids) {
      const n = per100(id);
      if (!n) continue;
      const k = grams / GRAMS_PER_100G;
      add(nutrients, id, grams, { value: n.censored ? 0 : k * n.low, low: k * n.low, high: k * n.high, dqr: null, sourceId, censored: n.censored });
    }
    for (const [id, parts] of Object.entries(options.nutrientSums ?? {})) {
      const ns = parts.map(per100);
      if (ns.some((n) => n == null)) continue;
      const k = grams / GRAMS_PER_100G;
      const low = ns.reduce((s, n) => s + n!.low, 0) * k;
      const high = ns.reduce((s, n) => s + n!.high, 0) * k;
      const censored = ns.some((n) => n!.censored);
      add(nutrients, id, grams, { value: censored ? 0 : low, low, high, dqr: null, sourceId, censored });
    }

    for (const [id, imp] of Object.entries(food.impacts)) {
      if (!imp || !finite(imp.value)) continue;
      const kg = grams / GRAMS_PER_KG;
      add(impacts, id, grams, {
        value: kg * imp.value,
        low: kg * (finite(imp.low) ? imp.low : imp.value),
        high: kg * (finite(imp.high) ? imp.high : imp.value),
        dqr: finite(imp.dqr) ? imp.dqr : null,
        sourceId: imp.sourceId,
      });
    }

    for (const id of animalIndicatorIds) {
      if (!food.isAnimal) {
        add(animal, id, grams, { value: 0, low: 0, high: 0, dqr: null, sourceId: null });
        continue;
      }
      const byIndicator = food.animalCategory ? data.categoryFactors[food.animalCategory] : undefined;
      const f = perKg(byIndicator, id, food.factorCode ?? foodCode);
      if (!f) continue;
      const kg = grams / GRAMS_PER_KG;
      add(animal, id, grams, { value: kg * f.value, low: kg * f.low, high: kg * f.high, dqr: null, sourceId: f.sourceIds[0] });
      for (const extra of f.sourceIds.slice(1)) animal.get(id)?.sourceIds.add(extra);
    }
  }

  // Steps of the dish itself: added to the impacts, no mass (coverage unchanged).
  for (const [id, f] of Object.entries(dish.fixedImpacts ?? {})) {
    if (finite(f.value)) add(impacts, id, 0, { value: f.value, low: f.value, high: f.value, dqr: null, sourceId: f.sourceId });
  }

  const fullyKnown = (id: string): number | null => {
    const a = nutrients.get(id);
    return a && a.coveredGrams === totalGrams && !a.censored ? a.value / dish.servings : null;
  };
  const kcalPerServing = fullyKnown(energyId);
  const proteinPerServing = fullyKnown(proteinId);

  const toAmounts = (acc: Map<string, Accumulator>): Record<string, Amount> => {
    const out: Record<string, Amount> = {};
    for (const [id, a] of acc) {
      // Only a range is known when an ingredient is « < x »: no central value (never x/2).
      const perServing = a.censored ? null : a.value / dish.servings;
      out[id] = {
        perServing,
        lowPerServing: a.low / dish.servings,
        highPerServing: a.high / dish.servings,
        per100kcal: kcalPerServing && perServing != null ? (perServing / kcalPerServing) * 100 : null,
        per10gProtein: proteinPerServing && perServing != null ? (perServing / proteinPerServing) * 10 : null,
        massCoverage: a.coveredGrams / totalGrams,
        worstDqr: a.worstDqr,
        sourceIds: [...a.sourceIds].sort(),
        ...(a.censored ? { censored: true } : {}),
      };
    }
    return out;
  };

  return {
    totalGrams,
    servings: dish.servings,
    kcalPerServing,
    proteinPerServing,
    nutrients: toAmounts(nutrients),
    impacts: toAmounts(impacts),
    animalImpacts: toAmounts(animal),
  };
}
