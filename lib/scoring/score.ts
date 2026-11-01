// Scores and winners per category (docs/DESIGN.md § 5). Pure: no network, no Supabase.
// Rules (indicators and directions) come from data/score_rules.json; values from the database.

export type Direction = "lower_is_better" | "higher_is_better";

export interface ScoreIndicatorRule {
  id: string;
  direction: Direction;
}

export interface ScoreCategoryRule {
  id: string;
  indicators: ScoreIndicatorRule[];
}

export interface ScoreOptions {
  /** Display precision: values equal after this rounding are a tie. */
  significantDigits: number;
  /** "provisoire" when compared / total is below this share. */
  provisionalBelowShare: number;
}

export interface IndicatorValues {
  animal: number | null | undefined;
  vegetal: number | null | undefined;
  /** true when the data covers too little of the mass of one dish: not counted. */
  partial?: boolean;
}

/** "manquant": a value is missing; "partiel": data too partial to judge. Neither is counted. */
export type IndicatorOutcome = "animal" | "vegetal" | "egal" | "manquant" | "partiel";

export interface IndicatorScore {
  id: string;
  direction: Direction;
  animal: number | null;
  vegetal: number | null;
  outcome: IndicatorOutcome;
}

export type CategoryWinner = "vegetal" | "animal" | "egal" | "insuffisant";

export interface CategoryScore {
  id: string;
  animalPoints: number;
  vegetalPoints: number;
  /** Indicators actually compared (both values, enough coverage). */
  compared: number;
  total: number;
  winner: CategoryWinner;
  provisional: boolean;
  indicators: IndicatorScore[];
}

export interface Verdict {
  categories: CategoryScore[];
  vegetalWins: number;
  animalWins: number;
  total: number;
}

const finite = (x: number | null | undefined): x is number => typeof x === "number" && Number.isFinite(x);

/** Rounds to `digits` significant digits (same precision as the displayed values). */
export function roundSignificant(x: number, digits: number): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  return Number(x.toPrecision(digits));
}

export function scoreIndicator(rule: ScoreIndicatorRule, values: IndicatorValues | undefined, options: ScoreOptions): IndicatorScore {
  const animal = finite(values?.animal) ? values.animal : null;
  const vegetal = finite(values?.vegetal) ? values.vegetal : null;
  const base = { id: rule.id, direction: rule.direction, animal, vegetal };
  if (animal == null || vegetal == null) return { ...base, outcome: "manquant" };
  if (values?.partial) return { ...base, outcome: "partiel" };
  const a = roundSignificant(animal, options.significantDigits);
  const v = roundSignificant(vegetal, options.significantDigits);
  if (a === v) return { ...base, outcome: "egal" };
  const plantBetter = rule.direction === "lower_is_better" ? v < a : v > a;
  return { ...base, outcome: plantBetter ? "vegetal" : "animal" };
}

export function scoreCategory(
  rule: ScoreCategoryRule,
  values: Record<string, IndicatorValues | undefined>,
  options: ScoreOptions,
): CategoryScore {
  const indicators = rule.indicators.map((i) => scoreIndicator(i, values[i.id], options));
  const animalPoints = indicators.filter((i) => i.outcome === "animal").length;
  const vegetalPoints = indicators.filter((i) => i.outcome === "vegetal").length;
  const compared = indicators.filter((i) => i.outcome === "animal" || i.outcome === "vegetal" || i.outcome === "egal").length;
  const total = indicators.length;
  const winner: CategoryWinner =
    compared === 0 ? "insuffisant" : vegetalPoints > animalPoints ? "vegetal" : animalPoints > vegetalPoints ? "animal" : "egal";
  return {
    id: rule.id,
    animalPoints,
    vegetalPoints,
    compared,
    total,
    winner,
    provisional: total === 0 || compared / total < options.provisionalBelowShare,
    indicators,
  };
}

/** Global verdict: categories won by each dish ("4 sur 5"). No weighted grade in V1. */
export function verdict(categories: CategoryScore[]): Verdict {
  return {
    categories,
    vegetalWins: categories.filter((c) => c.winner === "vegetal").length,
    animalWins: categories.filter((c) => c.winner === "animal").length,
    total: categories.length,
  };
}
