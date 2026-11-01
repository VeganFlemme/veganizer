import type { Amount, DishTotals } from "./types";

export type Basis = "perServing" | "per100kcal" | "per10gProtein";
export type Group = "nutrients" | "impacts" | "animalImpacts";

/** indicators.higher_is_better, plus the same flag for the nutrients compared. */
export type Directions = Record<string, { higherIsBetter: boolean }>;

export interface ConseilSource {
  /** public.sources.id */
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
  reference?: string;
  pages?: string;
  date?: string;
  accessedOn: string;
}

/** One entry of data/conseils.json. */
export interface Conseil {
  id: string;
  /** Nutrient or indicator ids this advice answers (e.g. 'vit_b12_ug'). */
  criteria: string[];
  titre: string;
  texte: string;
  sources: ConseilSource[];
}

export interface CriterionComparison {
  group: Group;
  higherIsBetter: boolean;
  animal: number | null;
  vegetal: number | null;
  /**
   * Plant advantage in %, relative to the animal dish:
   * (animal − plant) / |animal| × 100 when lower is better,
   * (plant − animal) / |animal| × 100 when higher is better.
   * Positive = plant dish does better. null if a side is missing or animal = 0.
   */
  gapPercent: number | null;
  winner: "animal" | "vegetal" | "egal" | null;
  /** true when the [low, high] ranges overlap (difference within uncertainty). Per serving only. */
  rangesOverlap: boolean | null;
  /** Lowest mass coverage of the two sides (warn if < 0.95). */
  minCoverage: number | null;
}

export interface AnimalAdvantage {
  criterion: string;
  group: Group;
  gapPercent: number | null;
  /** Advice from data/conseils.json; null when none applies. */
  conseil: Conseil | null;
}

export interface Comparison {
  basis: Basis;
  criteria: Record<string, CriterionComparison>;
  /** Criteria where the animal dish does better (always shown, with a solution). */
  animalBetter: AnimalAdvantage[];
}

export interface CompareOptions {
  directions: Directions;
  conseils: Conseil[];
  basis?: Basis;
}

const GROUPS: Group[] = ["nutrients", "impacts", "animalImpacts"];

function overlap(a: Amount | undefined, v: Amount | undefined): boolean | null {
  if (!a || !v) return null;
  const { lowPerServing: al, highPerServing: ah } = a;
  const { lowPerServing: vl, highPerServing: vh } = v;
  if (al == null || ah == null || vl == null || vh == null) return null;
  return Math.max(Math.min(al, ah), Math.min(vl, vh)) <= Math.min(Math.max(al, ah), Math.max(vl, vh));
}

/**
 * Compares an animal dish with its plant alternative on every criterion that
 * has a direction. Only criteria listed in `directions` are compared.
 */
export function compareDishes(animal: DishTotals, vegetal: DishTotals, options: CompareOptions): Comparison {
  const basis = options.basis ?? "perServing";
  const criteria: Record<string, CriterionComparison> = {};
  const animalBetter: AnimalAdvantage[] = [];

  for (const group of GROUPS) {
    const ids = new Set([...Object.keys(animal[group]), ...Object.keys(vegetal[group])]);
    for (const id of ids) {
      const dir = options.directions[id];
      if (!dir || criteria[id]) continue;
      const a = animal[group][id];
      const v = vegetal[group][id];
      const av = a?.[basis] ?? null;
      const vv = v?.[basis] ?? null;

      let gapPercent: number | null = null;
      let winner: CriterionComparison["winner"] = null;
      if (av != null && vv != null) {
        const diff = dir.higherIsBetter ? vv - av : av - vv;
        winner = diff > 0 ? "vegetal" : diff < 0 ? "animal" : "egal";
        if (av !== 0) gapPercent = (diff / Math.abs(av)) * 100;
      }

      criteria[id] = {
        group,
        higherIsBetter: dir.higherIsBetter,
        animal: av,
        vegetal: vv,
        gapPercent,
        winner,
        rangesOverlap: overlap(a, v),
        minCoverage: a && v ? Math.min(a.massCoverage, v.massCoverage) : null,
      };

      if (winner === "animal") {
        animalBetter.push({
          criterion: id,
          group,
          gapPercent,
          conseil: options.conseils.find((c) => c.criteria.includes(id)) ?? null,
        });
      }
    }
  }

  return { basis, criteria, animalBetter };
}
