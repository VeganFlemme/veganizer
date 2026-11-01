// Scores and winners per category (docs/DESIGN.md § 5). Pure: no network, no Supabase.
// Rules (indicators and directions) come from data/score_rules.json; values from the database.

import { judgeRanges, type Range } from "./ranges";

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
  /** Range the verdict rests on; default [value, value]. A side with a range and no value is compared. */
  animalRange?: Range | null;
  vegetalRange?: Range | null;
  /** Unit, for the display rounding of ties (roundForUnit); default 3 significant digits. */
  unit?: string;
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

const rangeOf = (value: number | null, range: Range | null | undefined): Range | null =>
  range && finite(range.low) && finite(range.high) ? range : value == null ? null : { low: value, high: value };

/**
 * One point for the dish that does better when the two ranges, rounded as displayed, do not
 * overlap; overlapping ranges or equal values are a tie (decision of Matt, 2026-11-01).
 * `options.significantDigits` is kept for the units without a rule of their own.
 */
export function scoreIndicator(rule: ScoreIndicatorRule, values: IndicatorValues | undefined, options: ScoreOptions): IndicatorScore {
  const animal = finite(values?.animal) ? values.animal : null;
  const vegetal = finite(values?.vegetal) ? values.vegetal : null;
  const base = { id: rule.id, direction: rule.direction, animal, vegetal };
  const ra = rangeOf(animal, values?.animalRange);
  const rv = rangeOf(vegetal, values?.vegetalRange);
  if (!ra || !rv) return { ...base, outcome: "manquant" };
  if (values?.partial) return { ...base, outcome: "partiel" };
  const unit = values?.unit;
  const round = (r: Range): Range =>
    unit ? r : { low: roundSignificant(r.low, options.significantDigits), high: roundSignificant(r.high, options.significantDigits) };
  return { ...base, outcome: judgeRanges(round(ra), round(rv), rule.direction === "higher_is_better", unit) };
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
