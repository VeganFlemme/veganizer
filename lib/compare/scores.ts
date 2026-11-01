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
};

export interface CategoryScoreView extends CategoryScore {
  id: CategoryId;
  label: string;
  short: string;
  /** What the score rests on, in one or two sentences (docs/DESIGN.md, principle 3). */
  sentence: string;
  /** Short form for the summary cards. */
  summary: string;
  /** Completed version: the gaps of this category are closed by construction, no score (decision of Matt, 17 h 12). */
  constructed?: boolean;
}

export const CONSTRUCTED_TEXT = "Écarts comblés par construction";

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
  /** The plant dish has no identified animal ingredient and the animal dish has at least one (rule 10: "identifié", never "vegan"). */
  vegetalAnimalFree?: boolean;
}

export const ANIMAL_FREE_TEXT = "La version végétale ne contient aucun ingrédient animal identifié : elle ne peut pas faire moins bien sur la protection animale.";

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

/** Short basis of a score for the cards: the compared indicators when few, counts otherwise. */
export function categorySummary(score: CategoryScore, labels: Record<string, string>): string {
  if (score.compared === 0) return "Aucun indicateur comparable pour l’instant : données manquantes, jamais comptées comme 0.";
  const compared = score.indicators.filter((i) => ["animal", "vegetal", "egal"].includes(i.outcome)).map((i) => labels[i.id] ?? i.id);
  const rest = score.total - score.compared;
  const head =
    score.compared <= 3
      ? `${list(compared)}.`
      : `${score.compared} indicateurs comparés : végétal mieux sur ${score.vegetalPoints}, plat animal sur ${score.animalPoints}.`;
  const tail = rest === 0 ? "" : ` ${rest === 1 ? "1 autre indicateur" : `Les ${rest} autres indicateurs`} : données manquantes ou partielles, non ${rest === 1 ? "compté" : "comptés"}.`;
  return head + tail;
}

export function verdictSentence(all: CategoryScoreView[]): string {
  const categories = all.filter((c) => !c.constructed);
  const v = categories.filter((c) => c.winner === "vegetal").length;
  const parts = [`${v === 1 ? "catégorie gagnée" : "catégories gagnées"} par la version végétale.`];
  const animal = categories.filter((c) => c.winner === "animal").map((c) => lower(c.label));
  const tie = categories.filter((c) => c.winner === "egal").map((c) => lower(c.label));
  const none = categories.filter((c) => c.winner === "insuffisant").map((c) => lower(c.label));
  if (animal.length) parts.push(`Le plat animal fait mieux en ${list(animal)}.`);
  if (tie.length) parts.push(`Égalité en ${list(tie)}.`);
  if (none.length) parts.push(`Données insuffisantes en ${list(none)}.`);
  const built = all.filter((c) => c.constructed).map((c) => c.label);
  if (built.length) parts.push(`${list(built)} : écarts comblés par construction, non comptée.`);
  return parts.join(" ");
}

function values(category: RuleCategory, input: ScoreInput, basis: Basis): Record<string, IndicatorValues | undefined> {
  const out: Record<string, IndicatorValues | undefined> = {};
  const rows = new Map(input.rows[basis].map((r) => [r.id, r]));
  for (const i of category.indicators) {
    if (i.group === "nutrients" || i.group === "impacts" || i.group === "animalImpacts") {
      const r = rows.get(i.id);
      out[i.id] = r
        ? { animal: r.animal?.value, vegetal: r.vegetal?.value, animalRange: r.verdictRanges.animal, vegetalRange: r.verdictRanges.vegetal, unit: r.unit, partial: r.verdictPartial }
        : undefined;
    } else if (i.group === "iarc") {
      const x = input.iarc.find((e) => e.entry.id === i.iarcId);
      out[i.id] = x ? { animal: x.animalGrams, vegetal: x.vegetalGrams } : undefined;
    } else if (i.group === "price") {
      const { animal, vegetal } = input.price;
      const range = (p: PriceView["animal"]) => (p && p.low != null && p.high != null ? { low: p.low, high: p.high } : null);
      out[i.id] = {
        animal: animal?.value,
        vegetal: vegetal?.value,
        animalRange: range(animal),
        vegetalRange: range(vegetal),
        unit: "€",
        partial: !animal || !vegetal || animal.coverage < COVERAGE_WARNING || vegetal.coverage < COVERAGE_WARNING,
      };
    } else if (i.group === "climateCost") {
      const c = input.climateCost[0];
      const co2 = input.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
      out[i.id] = c ? { animal: c.animalEur, vegetal: c.vegetalEur, unit: "€", partial: !co2 || co2.verdictPartial } : undefined;
    }
  }
  return out;
}

const gramsFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/**
 * Summary of the Santé card with the real values: « 20 g de lardon fumé (viande transformée,
 * groupe 1) et 125 g de bœuf (viande rouge, groupe 2A) par portion », food names (not recipe notes).
 */
export function healthSummary(iarc: IarcView[]): string {
  const part = (side: "animal" | "vegetal") =>
    iarc.flatMap((x) =>
      (side === "animal" ? x.animalItems : x.vegetalItems).map(
        (i) => `${gramsFr.format(i.grams)}\u00a0g de ${i.name} (${x.entry.libelle.toLowerCase()}, groupe ${x.entry.groupe})`,
      ),
    );
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);
  const a = part("animal");
  const v = part("vegetal");
  const animal = a.length ? `Plat animal : ${join(a)} par portion.` : "Plat animal : aucun ingrédient classé par le CIRC (viande rouge ou transformée).";
  const vegetal = v.length ? ` Version végétale : ${join(v)} par portion.` : " Version végétale : aucun ingrédient classé.";
  return animal + vegetal;
}

function scoreOf(category: RuleCategory, input: ScoreInput, basis: Basis, exclude: string[] = [], constructed: string[] = []): CategoryScoreView {
  const rule: ScoreCategoryRule = {
    id: category.id,
    indicators: category.indicators.filter((i) => !exclude.includes(i.id)).map((i) => ({ id: i.id, direction: i.direction === "higher_is_better" ? "higher_is_better" : "lower_is_better" })),
    vegetalCannotBeWorse: category.id === "animaux" && input.vegetalAnimalFree === true,
  };
  const score = scoreCategory(rule, values(category, input, basis), SCORE_OPTIONS);
  const labels = Object.fromEntries(category.indicators.map((i) => [i.id, i.label]));
  if (constructed.includes(category.id)) {
    const text = `${CONSTRUCTED_TEXT} : la version végétale complétée reçoit autant de protéines que le plat animal et ses autres manques sont comblés quand un aliment de la liste le permet. Pas de score, pour rester équitable.`;
    return { ...score, animalPoints: 0, vegetalPoints: 0, winner: "egal", provisional: false, id: category.id as CategoryId, label: category.label, short: category.short, sentence: text, summary: text, constructed: true };
  }
  const lead = score.vegetalCannotBeWorse ? `${ANIMAL_FREE_TEXT} ` : "";
  const summary = lead + (category.id === "sante" ? healthSummary(input.iarc) : categorySummary(score, labels));
  return { ...score, id: category.id as CategoryId, label: category.label, short: category.short, sentence: lead + categorySentence(score, labels), summary };
}

/**
 * Scores of a pair. `exclude`: indicators not counted in this view (e.g. protein in the
 * equal-protein view, equal by construction).
 */
export function scorePair(input: ScoreInput, exclude: string[] = [], constructed: string[] = []): PairScores {
  const categories = CATEGORIES.map((c) => scoreOf(c, input, "perServing", exclude, constructed));
  const counted = categories.filter((c) => !c.constructed);
  const nutrition = CATEGORIES.find((c) => c.id === "nutrition")!;
  return {
    verdict: {
      vegetalWins: counted.filter((c) => c.winner === "vegetal").length,
      animalWins: counted.filter((c) => c.winner === "animal").length,
      total: counted.length,
      categories,
      sentence: verdictSentence(categories),
    },
    nutritionByBasis: {
      perServing: categories[0],
      per100kcal: scoreOf(nutrition, input, "per100kcal", exclude, constructed),
      per10gProtein: scoreOf(nutrition, input, "per10gProtein", exclude, constructed),
    },
  };
}
