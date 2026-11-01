// Pure: scores and winners of a pair page, from the page model rows and data/score_rules.json.
// The engine is lib/scoring/score.ts; this file only gathers the values and writes the sentences.

import scoreRules from "@/data/score_rules.json";
import { scoreCategory, type Basis, type CategoryScore, type IndicatorValues, type ScoreCategoryRule, type ScoreOptions } from "@/lib/scoring";
import { CLIMATE_MAIN, COVERAGE_WARNING } from "./config";
import type { ClimateCostView, CriterionRow, IarcView, PriceView } from "./view";

export type CategoryId = "nutrition" | "sante" | "environnement" | "animaux" | "economie";

interface RuleIndicator {
  id: string;
  label: string;
  group: string;
  direction: string;
  iarcId?: string;
}
interface RuleCategory {
  id: string;
  label: string;
  short: string;
  indicators: RuleIndicator[];
}

const CATEGORIES = scoreRules.categories as RuleCategory[];
export const SCORE_OPTIONS: ScoreOptions = {
  significantDigits: scoreRules.significantDigits,
  provisionalBelowShare: scoreRules.provisionalBelowShare,
};

export interface CategoryScoreView extends CategoryScore {
  id: CategoryId;
  label: string;
  short: string;
  /** What the score rests on, in one or two sentences (docs/DESIGN.md, principle 3). */
  sentence: string;
}

export interface VerdictView {
  vegetalWins: number;
  animalWins: number;
  total: number;
  categories: CategoryScoreView[];
  sentence: string;
}

export interface PairScores {
  /** Per serving (default unit), all five categories. */
  verdict: VerdictView;
  /** Nutrition at each unit of the Nutrition tab (the score follows the unit displayed). */
  nutritionByBasis: Record<Basis, CategoryScoreView>;
}

export interface ScoreInput {
  rows: Record<Basis, CriterionRow[]>;
  iarc: IarcView[];
  price: PriceView;
  climateCost: ClimateCostView[];
}

const list = (xs: string[]) => xs.join(", ");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** One sentence: which indicators each dish wins, which are ties, which are not counted. */
export function categorySentence(score: CategoryScore, labels: Record<string, string>): string {
  const names = (outcome: string[]) => score.indicators.filter((i) => outcome.includes(i.outcome)).map((i) => labels[i.id] ?? i.id);
  const vegetal = names(["vegetal"]);
  const animal = names(["animal"]);
  const tie = names(["egal"]);
  const missing = names(["manquant", "partiel"]);
  const parts: string[] = [];
  if (score.compared === 0) {
    parts.push(`Aucun indicateur comparable : ${lower(list(missing))} (données manquantes ou partielles, jamais comptées comme 0).`);
    return parts.join(" ");
  }
  parts.push(`${score.compared} indicateur${score.compared > 1 ? "s" : ""} comparé${score.compared > 1 ? "s" : ""} sur ${score.total}.`);
  if (vegetal.length) parts.push(`Mieux pour la version végétale : ${lower(list(vegetal))}.`);
  if (animal.length) parts.push(`Mieux pour le plat animal : ${lower(list(animal))}.`);
  if (tie.length) parts.push(`Égalité : ${lower(list(tie))}.`);
  if (missing.length) parts.push(`Non comptés (données manquantes ou partielles) : ${lower(list(missing))}.`);
  return parts.join(" ");
}

export function verdictSentence(categories: CategoryScoreView[]): string {
  const v = categories.filter((c) => c.winner === "vegetal").length;
  const parts = [`${v === 1 ? "catégorie gagnée" : "catégories gagnées"} par la version végétale.`];
  const animal = categories.filter((c) => c.winner === "animal").map((c) => lower(c.label));
  const tie = categories.filter((c) => c.winner === "egal").map((c) => lower(c.label));
  const none = categories.filter((c) => c.winner === "insuffisant").map((c) => lower(c.label));
  if (animal.length) parts.push(`Le plat animal fait mieux en ${list(animal)}.`);
  if (tie.length) parts.push(`Égalité en ${list(tie)}.`);
  if (none.length) parts.push(`Données insuffisantes en ${list(none)}.`);
  return parts.join(" ");
}

function values(category: RuleCategory, input: ScoreInput, basis: Basis): Record<string, IndicatorValues | undefined> {
  const out: Record<string, IndicatorValues | undefined> = {};
  const rows = new Map(input.rows[basis].map((r) => [r.id, r]));
  for (const i of category.indicators) {
    if (i.group === "nutrients" || i.group === "impacts" || i.group === "animalImpacts") {
      const r = rows.get(i.id);
      out[i.id] = r ? { animal: r.animal?.value, vegetal: r.vegetal?.value, partial: r.lowCoverage } : undefined;
    } else if (i.group === "iarc") {
      const x = input.iarc.find((e) => e.entry.id === i.iarcId);
      out[i.id] = x ? { animal: x.animalGrams, vegetal: x.vegetalGrams } : undefined;
    } else if (i.group === "price") {
      const { animal, vegetal } = input.price;
      out[i.id] = {
        animal: animal?.value,
        vegetal: vegetal?.value,
        partial: !animal || !vegetal || animal.coverage < COVERAGE_WARNING || vegetal.coverage < COVERAGE_WARNING,
      };
    } else if (i.group === "climateCost") {
      const c = input.climateCost[0];
      const co2 = input.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
      out[i.id] = c ? { animal: c.animalEur, vegetal: c.vegetalEur, partial: !co2 || co2.lowCoverage } : undefined;
    }
  }
  return out;
}

function scoreOf(category: RuleCategory, input: ScoreInput, basis: Basis): CategoryScoreView {
  const rule: ScoreCategoryRule = {
    id: category.id,
    indicators: category.indicators.map((i) => ({ id: i.id, direction: i.direction === "higher_is_better" ? "higher_is_better" : "lower_is_better" })),
  };
  const score = scoreCategory(rule, values(category, input, basis), SCORE_OPTIONS);
  const labels = Object.fromEntries(category.indicators.map((i) => [i.id, i.label]));
  return { ...score, id: category.id as CategoryId, label: category.label, short: category.short, sentence: categorySentence(score, labels) };
}

export function scorePair(input: ScoreInput): PairScores {
  const categories = CATEGORIES.map((c) => scoreOf(c, input, "perServing"));
  const nutrition = CATEGORIES.find((c) => c.id === "nutrition")!;
  return {
    verdict: {
      vegetalWins: categories.filter((c) => c.winner === "vegetal").length,
      animalWins: categories.filter((c) => c.winner === "animal").length,
      total: categories.length,
      categories,
      sentence: verdictSentence(categories),
    },
    nutritionByBasis: {
      perServing: categories[0],
      per100kcal: scoreOf(nutrition, input, "per100kcal"),
      per10gProtein: scoreOf(nutrition, input, "per10gProtein"),
    },
  };
}
