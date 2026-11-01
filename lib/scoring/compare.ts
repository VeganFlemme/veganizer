import { amountBounds, judgeRanges } from "./ranges";
import type { Amount, DishTotals } from "./types";

/** Bases of comparison (decision of Matt, 19 h 34): per serving and per 100 g of dish. */
export type Basis = "perServing" | "per100g";
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
  /**
   * From the [low, high] ranges at the basis, rounded as displayed: a point only when they do not
   * overlap, otherwise "egal". null when a side has neither a value nor a range.
   */
  winner: "animal" | "vegetal" | "egal" | null;
  /** true when the [low, high] ranges overlap (difference within uncertainty). Per serving only. */
  rangesOverlap: boolean | null;
  /** Lowest mass coverage of the two sides, as displayed (warn if < 0.95). */
  minCoverage: number | null;
  /** Lowest coverage of the totals the verdict rests on (`verdict` option), else minCoverage. */
  verdictCoverage: number | null;
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
  /** Unit of each indicator, for the display rounding of the verdicts (default: 3 significant digits). */
  units?: Record<string, string>;
  /**
   * Totals the verdicts rest on, e.g. the two dishes without their identical ingredients
   * (verdictTotals). Displayed values stay those of `animal` and `vegetal`. Per serving only:
   * per 100 g the identical ingredients no longer cancel out, so this option is ignored there.
   */
  verdict?: { animal: DishTotals; vegetal: DishTotals };
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
      const judged = basis === "perServing" ? options.verdict : undefined;
      const ja = judged ? judged.animal : animal;
      const jv = judged ? judged.vegetal : vegetal;
      const ra = amountBounds(ja[group][id], basis, ja);
      const rv = amountBounds(jv[group][id], basis, jv);

      let gapPercent: number | null = null;
      if (av != null && vv != null && av !== 0) {
        const diff = dir.higherIsBetter ? vv - av : av - vv;
        gapPercent = (diff / Math.abs(av)) * 100;
      }
      const winner: CriterionComparison["winner"] = ra && rv ? judgeRanges(ra, rv, dir.higherIsBetter, options.units?.[id]) : null;
      const ca = ja[group][id]?.massCoverage;
      const cv = jv[group][id]?.massCoverage;

      criteria[id] = {
        group,
        higherIsBetter: dir.higherIsBetter,
        animal: av,
        vegetal: vv,
        gapPercent,
        winner,
        rangesOverlap: overlap(a, v),
        minCoverage: a && v ? Math.min(a.massCoverage, v.massCoverage) : null,
        verdictCoverage: ca != null && cv != null ? Math.min(ca, cv) : null,
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
