import type { Amount, DishTotals } from "./types";

// Unit conversion: the simulator counts 52 weeks per year (2 swaps/week × 1 year = 104 servings).
const WEEKS_PER_YEAR = 52;

export interface Cumulative {
  /** (animal − plant) × servings; null if a side is missing. */
  avoided: number | null;
  /** Conservative bounds: animal low − plant high, animal high − plant low. */
  avoidedLow: number | null;
  avoidedHigh: number | null;
  /** Lowest mass coverage of the two sides (warn if < 0.95). */
  minCoverage: number | null;
}

export interface Simulation {
  servings: number;
  impacts: Record<string, Cumulative>;
  animalImpacts: Record<string, Cumulative>;
}

function cumulate(a: Record<string, Amount>, v: Record<string, Amount>, servings: number): Record<string, Cumulative> {
  const out: Record<string, Cumulative> = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(v)])) {
    const x = a[id];
    const y = v[id];
    const diff = (p: number | null | undefined, q: number | null | undefined) =>
      p == null || q == null ? null : (p - q) * servings;
    out[id] = {
      avoided: diff(x?.perServing, y?.perServing),
      avoidedLow: diff(x?.lowPerServing, y?.highPerServing),
      avoidedHigh: diff(x?.highPerServing, y?.lowPerServing),
      minCoverage: x && y ? Math.min(x.massCoverage, y.massCoverage) : null,
    };
  }
  return out;
}

/**
 * Cumulative effect of replacing the animal dish by the plant dish
 * `swapsPerWeek` times a week for `years` years, per indicator.
 */
export function simulate(swapsPerWeek: number, years: number, animal: DishTotals, vegetal: DishTotals): Simulation {
  if (!Number.isFinite(swapsPerWeek) || swapsPerWeek < 0) throw new Error(`invalid swapsPerWeek: ${swapsPerWeek}`);
  if (!Number.isFinite(years) || years < 0) throw new Error(`invalid years: ${years}`);
  const servings = swapsPerWeek * WEEKS_PER_YEAR * years;
  return {
    servings,
    impacts: cumulate(animal.impacts, vegetal.impacts, servings),
    animalImpacts: cumulate(animal.animalImpacts, vegetal.animalImpacts, servings),
  };
}
