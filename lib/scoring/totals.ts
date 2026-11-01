import type { Amount, CategoryFactor, Dish, DishTotals, FoodData, ScoringData } from "./types";

// Unit conversions: the only constants allowed in code.
const GRAMS_PER_KG = 1000;
const GRAMS_PER_100G = 100;

export interface TotalsOptions {
  /** Nutrient id used for "per 100 kcal". Default: Ciqual energy, EU regulation 1169/2011. */
  energyNutrientId?: string;
  /** Nutrient id used for "per 10 g of protein". */
  proteinNutrientId?: string;
}

/** Sum of contributions for one indicator, before division by servings. */
interface Accumulator {
  value: number;
  low: number;
  high: number;
  coveredGrams: number;
  worstDqr: number | null;
  sourceIds: Set<string>;
}

interface Contribution {
  value: number;
  low: number;
  high: number;
  dqr: number | null;
  sourceId: string | null;
}

function add(acc: Map<string, Accumulator>, id: string, grams: number, c: Contribution): void {
  let a = acc.get(id);
  if (!a) {
    a = { value: 0, low: 0, high: 0, coveredGrams: 0, worstDqr: null, sourceIds: new Set() };
    acc.set(id, a);
  }
  a.value += c.value;
  a.low += c.low;
  a.high += c.high;
  a.coveredGrams += grams;
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
function perKg(
  byIndicator: Record<string, CategoryFactor | undefined> | undefined,
  id: string,
  foodCode: string,
): { value: number; low: number; high: number; sourceIds: string[] } | null {
  const f = byIndicator?.[id];
  if (!f || !finite(f.value)) return null;
  if (f.foodCodes && !f.foodCodes.includes(foodCode)) return null;
  const low = finite(f.low) ? f.low : f.value;
  const high = finite(f.high) ? f.high : f.value;
  if ((f.per ?? "kg") === "kg") return { value: f.value, low, high, sourceIds: [f.sourceId] };
  const k = byIndicator?.[ANIMALS_KILLED];
  if (!k || !finite(k.value) || (k.per ?? "kg") !== "kg") return null;
  if (k.foodCodes && !k.foodCodes.includes(foodCode)) return null;
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
 * - a missing low/high bound falls back on the central value.
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

    for (const [id, per100g] of Object.entries(food.nutrients)) {
      if (!finite(per100g)) continue;
      const v = (grams / GRAMS_PER_100G) * per100g;
      add(nutrients, id, grams, { value: v, low: v, high: v, dqr: null, sourceId: food.nutrientSourceId ?? null });
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
      const f = perKg(byIndicator, id, foodCode);
      if (!f) continue;
      const kg = grams / GRAMS_PER_KG;
      add(animal, id, grams, { value: kg * f.value, low: kg * f.low, high: kg * f.high, dqr: null, sourceId: f.sourceIds[0] });
      for (const extra of f.sourceIds.slice(1)) animal.get(id)?.sourceIds.add(extra);
    }
  }

  const fullyKnown = (id: string): number | null => {
    const a = nutrients.get(id);
    return a && a.coveredGrams === totalGrams ? a.value / dish.servings : null;
  };
  const kcalPerServing = fullyKnown(energyId);
  const proteinPerServing = fullyKnown(proteinId);

  const toAmounts = (acc: Map<string, Accumulator>): Record<string, Amount> => {
    const out: Record<string, Amount> = {};
    for (const [id, a] of acc) {
      const perServing = a.value / dish.servings;
      out[id] = {
        perServing,
        lowPerServing: a.low / dish.servings,
        highPerServing: a.high / dish.servings,
        per100kcal: kcalPerServing ? (perServing / kcalPerServing) * 100 : null,
        per10gProtein: proteinPerServing ? (perServing / proteinPerServing) * 10 : null,
        massCoverage: a.coveredGrams / totalGrams,
        worstDqr: a.worstDqr,
        sourceIds: [...a.sourceIds].sort(),
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
