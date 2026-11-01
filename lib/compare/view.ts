// Pure: turns database rows into the serialisable model of /compare/[slug].
// No network, no Supabase: tested with Vitest (tests/compare-view.test.ts).

import {
  compareDishes,
  dishTotals,
  monetize,
  type Amount,
  type Basis,
  type CategoryFactor,
  type Conseil,
  type Directions,
  type DishTotals,
  type FoodData,
  type MonetizationFactor,
  type MonetizationRule,
  amountBounds,
  boostMainProtein,
  solveComplements,
  withoutSharedIngredients,
  type ComplementFood,
  type Range,
  type ScoringData,
  verdictTotals,
} from "@/lib/scoring";
import {
  BASES,
  categoryOf,
  CLIMATE_INDICATORS,
  CLIMATE_MAIN,
  COVERAGE_WARNING,
  directionOf,
  EAT_POULTRY_CATEGORIES,
  EAT_RED_MEAT_CATEGORIES,
  EAT_SEAFOOD_CATEGORIES,
  EGG_SUBGROUP,
  FRESH_WORD,
  KEY_CRITERIA,
  NUTRIENT_SUMS,
  NUTRIENTS,
  PNNS_FISH_CATEGORIES,
  PNNS_LEGUME_SUBGROUP,
  PNNS_MEAT_CATEGORIES,
  VEGAN_WORD,
  type ScoreCategoryId,
} from "./config";
import scoreRules from "@/data/score_rules.json";
import { dishPriceFromFoods } from "./prices";
import { scorePair, type PairScores } from "./scores";

// ---------------------------------------------------------------------------
// Raw rows (subset of the Supabase rows)
// ---------------------------------------------------------------------------
export interface DishRow {
  id: string;
  slug: string;
  name_fr: string;
  kind: string;
  servings: number;
  description: string | null;
}
export interface PairRow {
  vegan_dish_id: string;
  variant: string | null;
  rationale: string | null;
  /** Completed version: the ingredient raised to equal protein (the protein chosen by the visitor); default = main protein. */
  boost_code?: string;
}
export interface IngredientRow {
  dish_id: string;
  food_code: string;
  grams: number;
  note: string | null;
}
export interface FoodRow {
  code: string;
  name_fr: string;
  is_animal: boolean;
  animal_category: string | null;
  ciqual_code: string | null;
  /** IARC vol. 114 category of the food (foods.iarc_meat). */
  iarc_meat?: string | null;
  food_subgroup?: string | null;
}
export interface NutrientValueRow {
  food_code: string;
  nutrient_id: string;
  value_per_100g: number | null;
  source_id: string;
  /** Ciqual qualifier of a cell without a number: "< 0.5" (known interval [0 ; 0.5]) or "traces" (missing). */
  qualifier?: string | null;
}
export interface ImpactRow {
  food_code: string;
  indicator_id: string;
  value_per_kg: number;
  low_per_kg: number | null;
  high_per_kg: number | null;
  dqr: number | null;
  source_id: string;
}
export interface CategoryFactorRow {
  category: string;
  indicator_id: string;
  value: number;
  low: number | null;
  high: number | null;
  source_id: string;
  unit_basis?: string;
  notes?: string | null;
  per?: string;
  food_codes?: string[] | null;
}
export interface DishPriceRow {
  dish_id: string;
  source_ids: string[];
  per_serving: number;
  low_per_serving: number | null;
  high_per_serving: number | null;
  mass_coverage: number;
  first_observed_on: string | null;
  last_observed_on: string | null;
}
/** food_prices_best row: one source per food. */
export interface FoodPriceRow {
  food_code: string;
  source_id: string;
  median_eur_per_kg: number;
  observations: number;
  first_observed_on: string | null;
  last_observed_on: string | null;
  place: string | null;
  /** Raw food whose price was divided by the cooking yield (null = direct price). */
  derived_from?: string | null;
  yield_pct?: number | null;
}
export interface IarcEntry {
  id: string;
  groupe: string;
  libelle: string;
  classement: string;
  definition: string;
  source: { sourceId: string; publisher: string; title: string; pages?: string; url: string; accessedOn: string };
}
export interface MetaRow {
  id: string;
  name_fr: string;
  unit: string;
  higher_is_better?: boolean;
  pillar?: string;
}
export interface SourceRow {
  id: string;
  name: string;
  publisher: string | null;
  version: string | null;
  license: string;
  commercial_use: boolean | null;
  url: string | null;
}

export interface PnnsEntry {
  id: string;
  libelle: string;
  repere: string;
  limiteGrammesSemaine?: number;
  foisParSemaine?: number;
  /** EAT-Lancet: reference intake in grams per day. */
  grammesJour?: number;
  source: IarcEntry["source"];
}

export interface RawPairData {
  animal: DishRow;
  vegetal: DishRow[];
  pairs: PairRow[];
  ingredients: IngredientRow[];
  foods: FoodRow[];
  nutrientValues: NutrientValueRow[];
  impacts: ImpactRow[];
  categoryFactors: CategoryFactorRow[];
  nutrients: MetaRow[];
  indicators: MetaRow[];
  sources: SourceRow[];
  monetizationFactors: MonetizationFactor[];
  monetizationRules: MonetizationRule[];
  conseils: Conseil[];
  /** Years of the climate cost shown. */
  climateCostYears: number[];
  dishPrices: DishPriceRow[];
  foodPrices: FoodPriceRow[];
  iarc: IarcEntry[];
  pnns: PnnsEntry[];
  eatLancet: PnnsEntry[];
  /** Whitelist of data/complements.json (« Avec compléments »); absent or empty = no such view. */
  complements?: ComplementSpec[];
  /** Upper safety limits per day (ANSES), by nutrient id. */
  complementLimits?: Record<string, number>;
}

/** One food of data/complements.json. */
export interface ComplementSpec {
  code: string;
  label: string;
  kind: "courant" | "enrichi";
  maxGramsPerServing: number;
  targets: string[];
  justification: string;
  conseils: string[];
}

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------
/** A plant version of the page: "maison", "commerce", or a food code on /aliment. */
export type Variant = string;

/** One choice of plant version, in display order. */
export interface Choice {
  id: Variant;
  label: string;
  /** Why this alternative (rule of the catalogue, rationale of the pair, rank by proximity). */
  reason?: string;
  /** Short data shown with the choice (protein per 100 g). */
  detail?: string;
  /** Family of the protein (soja, légumineuses, blé, autres). */
  family?: string;
}

const CHOICE_LABEL: Record<string, string> = { maison: "Fait maison", commerce: "Du commerce" };
const CHOICE_ORDER: Record<string, number> = { maison: 0, commerce: 1 };

export interface SideValue {
  value: number | null;
  low: number | null;
  high: number | null;
  /** true when a range is shown: published by the source, or a Ciqual « < x » value. */
  rangePublished: boolean;
  /** true when only the range is known (an ingredient published as « < x »): value is null. */
  censored: boolean;
  coverage: number;
  /** Worst Agribalyse DQR among the ingredients of this dish (null for nutrients and animal factors). */
  dqr: number | null;
}

export interface CriterionRow {
  id: string;
  name: string;
  /** Name as published by the source (Ciqual / Agribalyse). */
  sourceName: string;
  unit: string;
  group: "nutrients" | "impacts" | "animalImpacts";
  direction: "up" | "down" | "none";
  animal: SideValue | null;
  vegetal: SideValue | null;
  /** (animal − plant) / |animal| × 100: positive = the plant dish has less. null if not computable. */
  reductionPercent: number | null;
  /**
   * Verdict, only when the data the verdict rests on covers at least COVERAGE_WARNING of the mass
   * of both dishes. Per serving, ingredients identical on both sides are left out (their
   * contribution cancels out); a point only when the two ranges do not overlap.
   */
  winner: "animal" | "vegetal" | "egal" | null;
  /** Same comparison on partial data (verdictPartial): indicative only, never shown as a verdict. */
  indicativeWinner: "animal" | "vegetal" | "egal" | null;
  sourceIds: string[];
  worstDqr: number | null;
  /** Displayed totals cover less than COVERAGE_WARNING of the mass of a dish (warning shown). */
  lowCoverage: boolean;
  /** Lowest coverage of the data the verdict rests on (identical ingredients left out per serving). */
  verdictCoverage: number | null;
  /** The verdict rests on too little data: not counted in the score. */
  verdictPartial: boolean;
  /** Ranges the verdict rests on (scores.ts). */
  verdictRanges: { animal: Range | null; vegetal: Range | null };
  /** Shown first in the Nutrition tab (indicators of the score and of DESIGN.md). */
  featured: boolean;
}

export interface IngredientView {
  code: string;
  label: string;
  /** Name in Ciqual/Agribalyse; null when it contains a word the site never displays (rule 10). */
  officialName: string | null;
  grams: number;
  isAnimal: boolean;
}

export interface DishView {
  slug: string;
  name: string;
  description: string | null;
  servings: number;
  gramsPerServing: number;
  ingredients: IngredientView[];
}

export interface AdvantageView {
  criterion: string;
  name: string;
  /** true when the comparison rests on partial data (coverage < COVERAGE_WARNING). */
  partial: boolean;
  conseil: Conseil | null;
  /** Category of the score the criterion belongs to: the box of each tab shows its own. */
  category: ScoreCategoryId | null;
  /** Values of both dishes per serving (« plat animal : 12,7 mg ; version végétale : 5,3 mg »); absent for IARC grams and prices. */
  animal?: SideValue | null;
  vegetal?: SideValue | null;
  unit?: string;
  /** up = « plus = mieux » (a gap to cover); down = « moins = mieux » (shown apart, facts only). */
  direction?: "up" | "down" | "none";
  /** « moins = mieux » nutrients: plant ingredients that bring the most of it (Ciqual), largest first. */
  contributors?: string[];
}

export interface ClimateCostView {
  year: number;
  animalEur: number | null;
  vegetalEur: number | null;
  eurPerKg: number | null;
  derived: boolean;
  sourceId: string | null;
}

export interface PriceSide {
  value: number;
  low: number | null;
  high: number | null;
  coverage: number;
  /** null when energy / protein are not known for the whole dish. */
  per100kcal: number | null;
  per10gProtein: number | null;
  firstObservedOn: string | null;
  lastObservedOn: string | null;
}

export interface IngredientPrice {
  code: string;
  label: string;
  /** null = no published price (donnée manquante, never 0). */
  eurPerKg: number | null;
  sourceId: string | null;
  place: string | null;
  observations: number | null;
  firstObservedOn: string | null;
  lastObservedOn: string | null;
  /** Cooking yield (%) used when the price comes from the raw product. */
  yieldPct: number | null;
}

export interface PriceView {
  animal: PriceSide | null;
  vegetal: PriceSide | null;
  sourceIds: string[];
  animalIngredients: IngredientPrice[];
  vegetalIngredients: IngredientPrice[];
}

export interface IarcView {
  entry: IarcEntry;
  /** Grams per serving of foods in this IARC category; plant dish: real 0 when no animal ingredient. */
  animalGrams: number;
  vegetalGrams: number;
  /** Ingredients of each dish in this IARC category (recipe labels). */
  animalFoods: string[];
  vegetalFoods: string[];
  /** Same ingredients with their food name (Ciqual, short form) and grams per serving. */
  animalItems: { name: string; grams: number }[];
  vegetalItems: { name: string; grams: number }[];
}

export interface PnnsView {
  entry: PnnsEntry;
  animalGrams: number;
  vegetalGrams: number;
  /** grams per serving / weekly limit (PNNS) or daily target (EAT-Lancet) × 100; null for frequencies. */
  animalPercent: number | null;
  vegetalPercent: number | null;
}

export interface AnimalFactorNote {
  category: string;
  indicatorId: string;
  per: "kg" | "animal";
  unitBasis: string | null;
  notes: string | null;
  sourceId: string;
}

/** What the client-side simulator needs (subset of DishTotals, serialisable). */
export interface SimInput {
  animal: DishTotals;
  vegetal: DishTotals;
}

export interface VariantView {
  variant: Variant;
  dish: DishView;
  rationale: string | null;
  /** Criteria per basis (per serving, per 100 kcal, per 10 g protein). */
  rows: Record<Basis, CriterionRow[]>;
  animalBetter: AdvantageView[];
  /** Lowest mass coverage of the key criteria (energy, protein, CO2e), both dishes. */
  keyCoverage: number | null;
  /**
   * The recipe contains an egg ingredient: ADEME reports that Agribalyse 3.2 underestimates the
   * impacts of eggs and of every product containing them (notice of the food spreadsheet, 21/08/2025).
   */
  eggImpactsUnderestimated: { animal: boolean; vegetal: boolean };
  /** Soy-based ingredients of the plant version (Ciqual names): ANSES opinion on isoflavones (2025). */
  soyIngredients: string[];
  /** true when at least one criterion shown rests on partial data. */
  anyPartial: boolean;
  climateCost: ClimateCostView[];
  /** Animal-pillar indicators with data (category_factors); empty = "bientôt". */
  hasAnimalData: boolean;
  /** Factors used for the animal ingredients of the animal dish (unit basis and hypotheses). */
  animalFactorNotes: AnimalFactorNote[];
  /** Animal ingredients of the animal dish without any factor (shown as missing data). */
  animalWithoutFactor: string[];
  price: PriceView;
  iarc: IarcView[];
  pnns: PnnsView[];
  eatLancet: PnnsView[];
  sim: SimInput;
  /** Scores and winners per category (lib/compare/scores.ts, data/score_rules.json). */
  scores: PairScores;
}

/** One addition of the completed version (data/complements.json). */
export interface ComplementAddition {
  code: string;
  label: string;
  gramsPerServing: number;
  nutrients: string[];
  justification: string;
  kind: "courant" | "enrichi";
}

/**
 * « Version complétée » (decisions of Matt, 2026-11-01, 17 h 05 and 17 h 12): the animal dish
 * unchanged; the plant version with its main protein raised to the protein of the animal dish,
 * then its other gaps closed with data/complements.json. Nutrition: gaps closed by construction.
 */
export interface CompletedVariantView {
  view: VariantView;
  /** Main protein increased (null when the plant version already had as much protein). */
  boost: { code: string; label: string; extraGrams: number } | null;
  additions: ComplementAddition[];
  /** Gaps no whitelisted food closes (B12, EPA + DHA, vitamin D…): advice only, no dose. */
  open: string[];
}

export interface PairPageModel {
  slug: string;
  animal: DishView;
  /** Realistic portions (default view). */
  variants: Partial<Record<Variant, VariantView>>;
  /** Plant versions offered, in display order (« Fait maison », « Du commerce », or alternatives). */
  choices: Choice[];
  /** « Version complétée » of each variant; the base version (variants) stays the reference. */
  completed: Partial<Record<Variant, CompletedVariantView>>;
  sources: Record<string, SourceRow>;
  monetizationFactors: MonetizationFactor[];
  monetizationRules: MonetizationRule[];
}

// Soy-based foods, from their Ciqual name (isoflavones: ANSES opinion 2022-SA-0221).
const SOY_WORD = /\bsoja\b|tofu|tempeh|edamame/i;

// ---------------------------------------------------------------------------
const num = (x: number | string | null | undefined): number | null => (x == null ? null : Number(x));

/** Upper bound of a Ciqual « < x » qualifier (stored as "< 0.5"); null for "traces" or anything else. */
export function lessThan(qualifier: string | null | undefined): number | null {
  const m = /^<\s*(\d+(?:\.\d+)?)$/.exec((qualifier ?? "").trim());
  return m ? Number(m[1]) : null;
}

export function scoringData(raw: RawPairData): ScoringData {
  const foods: Record<string, FoodData> = {};
  const byCode = new Map(raw.foods.map((f) => [f.code, f]));
  for (const f of raw.foods) {
    const nutrientCode = f.ciqual_code ?? f.code;
    const nutrients: FoodData["nutrients"] = {};
    const nutrientMax: NonNullable<FoodData["nutrientMax"]> = {};
    let nutrientSourceId: string | undefined;
    for (const n of raw.nutrientValues) {
      if (n.food_code !== nutrientCode) continue;
      nutrients[n.nutrient_id] = num(n.value_per_100g);
      const max = n.value_per_100g == null ? lessThan(n.qualifier) : null;
      if (max != null) nutrientMax[n.nutrient_id] = max;
      nutrientSourceId = n.source_id;
    }
    const impacts: FoodData["impacts"] = {};
    for (const i of raw.impacts) {
      if (i.food_code !== f.code) continue;
      impacts[i.indicator_id] = {
        value: Number(i.value_per_kg),
        low: num(i.low_per_kg),
        high: num(i.high_per_kg),
        dqr: num(i.dqr),
        sourceId: i.source_id,
      };
    }
    foods[f.code] = {
      nutrients,
      ...(Object.keys(nutrientMax).length ? { nutrientMax } : {}),
      nutrientSourceId,
      impacts,
      isAnimal: byCode.get(f.code)?.is_animal ?? false,
      animalCategory: f.animal_category,
    };
  }
  const categoryFactors: ScoringData["categoryFactors"] = {};
  for (const c of raw.categoryFactors) {
    const byIndicator = (categoryFactors[c.category] ??= {}) as Record<string, CategoryFactor | CategoryFactor[]>;
    const f: CategoryFactor = {
      value: Number(c.value),
      low: num(c.low),
      high: num(c.high),
      sourceId: c.source_id,
      per: c.per === "animal" ? "animal" : "kg",
      foodCodes: c.food_codes ?? null,
    };
    // Several rows for one indicator (disjoint food_codes, e.g. milk and cheese): kept together.
    const prev = byIndicator[c.indicator_id];
    byIndicator[c.indicator_id] = prev == null ? f : [...(Array.isArray(prev) ? prev : [prev]), f];
  }
  return { foods, categoryFactors };
}

export function dishView(dish: DishRow, raw: RawPairData): DishView {
  const names = new Map(raw.foods.map((f) => [f.code, f]));
  const ingredients = raw.ingredients
    .filter((i) => i.dish_id === dish.id)
    .map((i) => {
      const official = names.get(i.food_code)?.name_fr ?? null;
      const safe = official && !VEGAN_WORD.test(official) ? official : null;
      return {
        code: i.food_code,
        label: i.note ?? safe ?? i.food_code,
        officialName: safe,
        grams: Number(i.grams),
        isAnimal: names.get(i.food_code)?.is_animal ?? false,
      };
    })
    .sort((a, b) => b.grams - a.grams);
  const total = ingredients.reduce((s, i) => s + i.grams, 0);
  return {
    slug: dish.slug,
    name: dish.name_fr,
    description: dish.description,
    servings: dish.servings,
    gramsPerServing: total / dish.servings,
    ingredients,
  };
}

function side(a: Amount | undefined, basis: Basis, t: DishTotals): SideValue | null {
  if (!a) return null;
  const value = a[basis];
  const r = amountBounds(a, basis, t);
  const low = r?.low ?? null;
  const high = r?.high ?? null;
  return {
    value,
    low,
    high,
    rangePublished: low != null && high != null && (value == null || low !== value || high !== value),
    censored: !!a.censored,
    coverage: a.massCoverage,
    dqr: a.worstDqr,
  };
}

/** Directions of the criteria counted by the score (data/score_rules.json); others get no verdict. */
function directions(raw: RawPairData): Directions {
  const d: Directions = {};
  for (const m of [...raw.nutrients, ...raw.indicators]) {
    const dir = directionOf(m.id);
    if (dir !== "none") d[m.id] = { higherIsBetter: dir === "up" };
  }
  return d;
}

/**
 * Short name of a food for a sentence: the Ciqual name up to the first comma, lower case
 * (« Lardon fumé, cuit » → « lardon fumé », « Boeuf, à bourguignon… » → « bœuf »).
 */
export function shortFoodName(name: string): string {
  const head = name.split(",")[0].trim();
  const fr = head.replace(/\bBoeuf\b/g, "Bœuf").replace(/\boeuf/g, "œuf").replace(/\bOeuf/g, "Œuf");
  return fr.charAt(0).toLowerCase() + fr.slice(1);
}

export function reductionPercent(animal: number | null, vegetal: number | null): number | null {
  if (animal == null || vegetal == null || animal === 0) return null;
  return ((animal - vegetal) / Math.abs(animal)) * 100;
}

export interface VerdictInput {
  animal: DishTotals;
  vegetal: DishTotals;
}

/**
 * Rows of every criterion at one basis. `verdict` (per serving): totals of the two dishes without
 * their identical ingredients, on which the verdicts rest (lib/scoring/ranges.ts).
 */
export function rowsFor(animal: DishTotals, vegetal: DishTotals, raw: RawPairData, basis: Basis, verdict?: VerdictInput): CriterionRow[] {
  const dirs = directions(raw);
  const meta = new Map([...raw.nutrients, ...raw.indicators, ...derivedMeta()].map((m) => [m.id, m]));
  const units = Object.fromEntries([...meta].map(([id, m]) => [id, m.unit]));
  const judged = basis === "perServing" ? verdict : undefined;
  const cmp = compareDishes(animal, vegetal, { directions: dirs, conseils: raw.conseils, basis, units, verdict: judged });
  const rows: CriterionRow[] = [];

  const labels = new Map(NUTRIENTS.map((n) => [n.id, n.label]));
  const featured = new Set(NUTRIENTS.map((n) => n.id));
  const push = (id: string, group: CriterionRow["group"], direction: CriterionRow["direction"]) => {
    const a = animal[group][id];
    const v = vegetal[group][id];
    const m = meta.get(id);
    const as = side(a, basis, animal);
    const vs = side(v, basis, vegetal);
    const c = cmp.criteria[id];
    const coverages = [a?.massCoverage, v?.massCoverage].filter((x): x is number => x != null);
    const dqrs = [a?.worstDqr, v?.worstDqr].filter((x): x is number => x != null);
    const lowCoverage = coverages.length < 2 || Math.min(...coverages) < COVERAGE_WARNING;
    const verdictCoverage = c?.verdictCoverage ?? (coverages.length < 2 ? null : Math.min(...coverages));
    const verdictPartial = verdictCoverage == null || verdictCoverage < COVERAGE_WARNING;
    const outcome = direction === "none" ? null : (c?.winner ?? null);
    const ja = judged?.animal ?? animal;
    const jv = judged?.vegetal ?? vegetal;
    rows.push({
      id,
      name: labels.get(id) ?? m?.name_fr ?? id,
      sourceName: m?.name_fr ?? id,
      unit: m?.unit ?? "",
      group,
      direction,
      animal: as,
      vegetal: vs,
      reductionPercent: reductionPercent(as?.value ?? null, vs?.value ?? null),
      winner: verdictPartial ? null : outcome,
      indicativeWinner: verdictPartial ? outcome : null,
      sourceIds: [...new Set([...(a?.sourceIds ?? []), ...(v?.sourceIds ?? [])])].sort(),
      worstDqr: dqrs.length ? Math.max(...dqrs) : null,
      lowCoverage,
      verdictCoverage,
      verdictPartial,
      verdictRanges: { animal: amountBounds(ja[group][id], basis, ja), vegetal: amountBounds(jv[group][id], basis, jv) },
      featured: group === "nutrients" && featured.has(id),
    });
  };

  // Every Ciqual constituent is shown (featured ones first); only those of the score get a verdict.
  const derived = new Set(Object.keys(NUTRIENT_SUMS));
  const others = raw.nutrients
    .filter((n) => !featured.has(n.id) && !derived.has(n.id) && (animal.nutrients[n.id] || vegetal.nutrients[n.id]))
    .sort((x, y) => x.name_fr.localeCompare(y.name_fr, "fr"));
  for (const n of NUTRIENTS) push(n.id, "nutrients", n.direction);
  for (const n of others) push(n.id, "nutrients", directionOf(n.id));
  for (const id of CLIMATE_INDICATORS) push(id, "impacts", directionOf(id));
  const animalIds = new Set([...Object.keys(animal.animalImpacts), ...Object.keys(vegetal.animalImpacts)]);
  // Display order: animals, days of life, then pain by increasing intensity (never summed).
  const ORDER = ["animals_killed_land", "fish_killed", "life_days_farmed", "pain_hours_annoying", "pain_hours_hurtful", "pain_hours_disabling", "pain_hours_excruciating"];
  const rank = (id: string) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
  for (const id of [...animalIds].sort((x, y) => rank(x) - rank(y) || x.localeCompare(y))) {
    push(id, "animalImpacts", directionOf(id));
  }
  return rows;
}

/** Options of dishTotals for every page: derived nutrients (EPA + DHA). */
export const TOTALS_OPTIONS = { nutrientSums: Object.fromEntries(Object.entries(NUTRIENT_SUMS).map(([id, d]) => [id, d.parts])) };

/** Label of a counted indicator (data/score_rules.json). */
function labelOf(id: string): string {
  for (const c of scoreRules.categories) for (const i of c.indicators) if (i.id === id) return i.label;
  return id;
}

/** Meta of the derived nutrients (sums of Ciqual constituents, e.g. EPA + DHA). */
function derivedMeta(): MetaRow[] {
  return Object.entries(NUTRIENT_SUMS).map(([id, d]) => ({ id, name_fr: d.label, unit: d.unit }));
}

// Indicators the simulator uses: CO2e and the animal pillar.
function simTotals(t: DishTotals): DishTotals {
  const pick = (r: Record<string, Amount>, ids?: string[]) =>
    Object.fromEntries(Object.entries(r).filter(([id]) => !ids || ids.includes(id)));
  return { ...t, nutrients: {}, impacts: pick(t.impacts, [CLIMATE_MAIN]), animalImpacts: pick(t.animalImpacts) };
}

export interface BuildOptions {
  /** Indicators not counted in the scores of this view. */
  excludeFromScore?: string[];
  /** Categories whose gaps are closed by construction (completed version): no score. */
  constructed?: string[];
  /** false: only the realistic portions (used to build the derived views). */
  withViews?: boolean;
}

// Nutrients a dish can gain by adding food: counted, « plus = mieux » (data/score_rules.json).
const COMPLETABLE = new Set(scoreRules.categories.find((c) => c.id === "nutrition")!.indicators.filter((i) => i.direction === "higher_is_better").map((i) => i.id));
// Fortified foods are used only when everyday foods are not enough.
const KIND_WEIGHT = { courant: 1, enrichi: 10 } as const;

function completedVariant(raw: RawPairData, dish: DishRow, pair: PairRow, data: ScoringData): { view: CompletedVariantView; sources: Record<string, SourceRow> } | null {
  const dishOf = (d: DishRow) => ({
    servings: d.servings,
    ingredients: raw.ingredients.filter((i) => i.dish_id === d.id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })),
  });
  const animalDish = dishOf(raw.animal);
  const plantDish = dishOf(dish);
  const shared = withoutSharedIngredients(animalDish, plantDish).shared;
  const animalProtein = dishTotals(animalDish, data, TOTALS_OPTIONS).proteinPerServing;
  // 1. Main protein raised to the protein of the animal dish.
  const boostShared = pair.boost_code ? plantDish.ingredients.map((i) => i.foodCode).filter((c) => c !== pair.boost_code) : shared;
  const b = animalProtein == null ? null : boostMainProtein(plantDish, data, animalProtein, boostShared);
  const boosted = raw.ingredients.map((i) => (b && i.dish_id === dish.id && i.food_code === b.code ? { ...i, grams: Number(i.grams) + b.extraGrams } : i));
  const prices = (ingredients: IngredientRow[]) =>
    [raw.animal, dish]
      .map((d) => dishPriceFromFoods(d.id, d.servings, ingredients.filter((i) => i.dish_id === d.id).map((i) => ({ code: i.food_code, grams: Number(i.grams) })), raw.foodPrices))
      .filter((x): x is DishPriceRow => x != null);
  const step1 = buildPairPage({ ...raw, pairs: [pair], ingredients: boosted, dishPrices: prices(boosted) }, { withViews: false });
  const v1 = step1.variants[pair.variant as Variant];
  if (!v1) return null;
  // 2. Other plant gaps closed with the whitelist (the animal dish is never completed).
  const specs = (raw.complements ?? []).filter((c) => data.foods[c.code]);
  const foods: ComplementFood[] = specs.map((c) => ({
    code: c.code,
    maxGrams: c.maxGramsPerServing,
    weight: KIND_WEIGHT[c.kind],
    per100g: Object.fromEntries(Object.entries(data.foods[c.code]!.nutrients).filter(([, x]) => x != null)) as Record<string, number>,
  }));
  const hi = (x: SideValue | null) => x?.high ?? x?.value ?? null;
  const lo = (x: SideValue | null) => x?.low ?? x?.value ?? null;
  const gaps: Record<string, number> = {};
  const base: Record<string, number> = {};
  for (const r of v1.rows.perServing) {
    if (r.group !== "nutrients" || !COMPLETABLE.has(r.id)) continue;
    if (hi(r.vegetal) != null) base[r.id] = hi(r.vegetal)!;
    if (r.winner !== "animal" && r.indicativeWinner !== "animal") continue;
    const a = hi(r.animal);
    const p = lo(r.vegetal);
    if (a != null && p != null && a > p) gaps[r.id] = a - p;
  }
  const solved = foods.length ? solveComplements(gaps, foods, { limits: raw.complementLimits, base }) : { additions: [], closed: [], open: Object.keys(gaps) };
  const additions: ComplementAddition[] = solved.additions.map((a) => {
    const s = specs.find((x) => x.code === a.code)!;
    return { code: a.code, label: s.label, gramsPerServing: a.grams, nutrients: a.nutrients, justification: s.justification, kind: s.kind };
  });
  const merged = new Map<string, IngredientRow>();
  for (const i of [...boosted, ...additions.map((a) => ({ dish_id: dish.id, food_code: a.code, grams: a.gramsPerServing * dish.servings, note: a.label }))]) {
    const k = `${i.dish_id}|${i.food_code}`;
    const prev = merged.get(k);
    merged.set(k, prev ? { ...prev, grams: Number(prev.grams) + Number(i.grams) } : { ...i });
  }
  const ingredients = [...merged.values()];
  const page = buildPairPage({ ...raw, pairs: [pair], ingredients, dishPrices: prices(ingredients) }, { withViews: false, constructed: ["nutrition"] });
  const view = page.variants[pair.variant as Variant];
  if (!view) return null;
  return {
    // Recipe label, never the raw official name (rule 10).
    view: { view, boost: b ? { code: b.code, label: dishView(dish, raw).ingredients.find((i) => i.code === b.code)?.label ?? b.code, extraGrams: b.extraGrams } : null, additions, open: solved.open },
    sources: page.sources,
  };
}

/** Builds the page model; variants without data are simply absent. */
export function buildPairPage(raw: RawPairData, options: BuildOptions = {}): PairPageModel {
  const data = scoringData(raw);
  const totalsOptions = TOTALS_OPTIONS;
  const dishOf = (d: DishRow) => ({
    servings: d.servings,
    ingredients: raw.ingredients.filter((i) => i.dish_id === d.id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })),
  });
  const totalsOf = (d: DishRow) => dishTotals(dishOf(d), data, totalsOptions);
  const animalTotals = totalsOf(raw.animal);
  const variants: PairPageModel["variants"] = {};
  const usedSources = new Set<string>();

  for (const p of raw.pairs) {
    if (!p.variant) continue;
    const dish = raw.vegetal.find((d) => d.id === p.vegan_dish_id);
    if (!dish) continue;
    const vegTotals = totalsOf(dish);
    const verdict = verdictTotals(dishOf(raw.animal), dishOf(dish), data, totalsOptions);
    const rows = Object.fromEntries(BASES.map((b) => [b.id, rowsFor(animalTotals, vegTotals, raw, b.id, verdict)])) as Record<Basis, CriterionRow[]>;
    for (const r of rows.perServing) r.sourceIds.forEach((s) => usedSources.add(s));

    // Plant ingredients that bring the most of a nutrient (Ciqual per 100 g × grams), two at most.
    const plantView = dishView(dish, raw);
    const contributorsOf = (nutrient: string) =>
      plantView.ingredients
        .map((i) => ({ label: i.label, amount: ((data.foods[i.code]?.nutrients[nutrient] ?? 0) * i.grams) / 100 }))
        .filter((x) => x.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 2)
        .map((x) => x.label.replace(/\s*\(.*\)$/, ""));
    // Where the animal dish does better (rule 3): verdicts, plus partial-data cases flagged as such,
    // so that a gap in the data never hides an advantage of the animal dish.
    const animalBetter: AdvantageView[] = rows.perServing
      .filter((r) => r.winner === "animal" || r.indicativeWinner === "animal")
      .map((r) => ({
        criterion: r.id,
        name: r.name,
        partial: r.winner !== "animal",
        conseil: raw.conseils.find((c) => c.criteria.includes(r.id)) ?? null,
        category: categoryOf(r.id),
        animal: r.animal,
        vegetal: r.vegetal,
        unit: r.unit,
        direction: r.direction,
        contributors: r.direction === "down" && r.group === "nutrients" ? contributorsOf(r.id) : [],
      }));
    for (const x of animalBetter) x.conseil?.sources.forEach((s) => usedSources.add(s.sourceId));

    const coverages = rows.perServing
      .filter((r) => KEY_CRITERIA.includes(r.id))
      .flatMap((r) => [r.animal?.coverage ?? 0, r.vegetal?.coverage ?? 0]);

    const a = animalTotals.impacts[CLIMATE_MAIN]?.perServing ?? null;
    const v = vegTotals.impacts[CLIMATE_MAIN]?.perServing ?? null;
    const opts = { indicatorId: CLIMATE_MAIN, rules: raw.monetizationRules };
    const climateCost: ClimateCostView[] = raw.climateCostYears.map((year) => {
      const ma = a == null ? null : monetize(a, year, raw.monetizationFactors, opts);
      const mv = v == null ? null : monetize(v, year, raw.monetizationFactors, opts);
      const unit = ma ?? mv;
      if (unit) usedSources.add(unit.sourceId);
      return {
        year,
        animalEur: ma?.eur ?? null,
        vegetalEur: mv?.eur ?? null,
        eurPerKg: unit?.eurPerUnit ?? null,
        derived: unit?.derived ?? false,
        sourceId: unit?.sourceId ?? null,
      };
    });

    const priceOf = (d: DishRow, t: DishTotals): PriceSide | null => {
      const r = raw.dishPrices.find((x) => x.dish_id === d.id);
      if (!r) return null;
      r.source_ids.forEach((s) => usedSources.add(s));
      const value = Number(r.per_serving);
      return {
        value,
        low: num(r.low_per_serving),
        high: num(r.high_per_serving),
        coverage: Number(r.mass_coverage),
        per100kcal: t.kcalPerServing ? (value / t.kcalPerServing) * 100 : null,
        per10gProtein: t.proteinPerServing ? (value / t.proteinPerServing) * 10 : null,
        firstObservedOn: r.first_observed_on,
        lastObservedOn: r.last_observed_on,
      };
    };
    const ingredientPrices = (d: DishRow): IngredientPrice[] =>
      dishView(d, raw).ingredients.map((i) => {
        const fp = raw.foodPrices.find((p) => p.food_code === i.code);
        return {
          code: i.code,
          label: i.label,
          eurPerKg: fp ? Number(fp.median_eur_per_kg) : null,
          sourceId: fp?.source_id ?? null,
          place: fp?.place ?? null,
          observations: fp ? Number(fp.observations) : null,
          firstObservedOn: fp?.first_observed_on ?? null,
          lastObservedOn: fp?.last_observed_on ?? null,
          yieldPct: fp?.yield_pct != null ? Number(fp.yield_pct) : null,
        };
      });
    const price: PriceView = {
      animal: priceOf(raw.animal, animalTotals),
      vegetal: priceOf(dish, vegTotals),
      sourceIds: [...new Set(raw.dishPrices.filter((x) => x.dish_id === raw.animal.id || x.dish_id === dish.id).flatMap((x) => x.source_ids))],
      animalIngredients: ingredientPrices(raw.animal),
      vegetalIngredients: ingredientPrices(dish),
    };

    const foodsByCode = new Map(raw.foods.map((f) => [f.code, f]));
    const iarcGrams = (d: DishRow, id: string) =>
      raw.ingredients
        .filter((i) => i.dish_id === d.id && foodsByCode.get(i.food_code)?.iarc_meat === id)
        .reduce((sum, i) => sum + Number(i.grams), 0) / d.servings;
    const iarc = raw.iarc.map((entry) => {
      usedSources.add(entry.source.sourceId);
      const inCategory = (d: DishRow) => dishView(d, raw).ingredients.filter((i) => foodsByCode.get(i.code)?.iarc_meat === entry.id);
      const labels = (d: DishRow) => inCategory(d).map((i) => i.label);
      const items = (d: DishRow) => inCategory(d).map((i) => ({ name: shortFoodName(i.officialName ?? i.label), grams: i.grams / d.servings }));
      return {
        entry,
        animalGrams: iarcGrams(raw.animal, entry.id),
        vegetalGrams: iarcGrams(dish, entry.id),
        animalFoods: labels(raw.animal),
        vegetalFoods: labels(dish),
        animalItems: items(raw.animal),
        vegetalItems: items(dish),
      };
    });

    const pnnsMatch: Record<string, (f: FoodRow) => boolean> = {
      viande: (f) => f.is_animal && PNNS_MEAT_CATEGORIES.includes(f.animal_category ?? "") && f.iarc_meat !== "transformée",
      charcuterie: (f) => f.iarc_meat === "transformée",
      poisson: (f) => f.is_animal && PNNS_FISH_CATEGORIES.includes(f.animal_category ?? ""),
      "legumes-secs": (f) => f.food_subgroup === PNNS_LEGUME_SUBGROUP && !FRESH_WORD.test(f.name_fr),
      "eat-viande-rouge": (f) => f.is_animal && EAT_RED_MEAT_CATEGORIES.includes(f.animal_category ?? ""),
      "eat-volaille": (f) => f.is_animal && EAT_POULTRY_CATEGORIES.includes(f.animal_category ?? "") && f.food_subgroup !== EGG_SUBGROUP,
      "eat-poisson": (f) => f.is_animal && EAT_SEAFOOD_CATEGORIES.includes(f.animal_category ?? ""),
      "eat-oeufs": (f) => f.is_animal && f.food_subgroup === EGG_SUBGROUP,
    };
    const pnnsGrams = (d: DishRow, match: (f: FoodRow) => boolean) =>
      raw.ingredients
        .filter((i) => i.dish_id === d.id && foodsByCode.has(i.food_code) && match(foodsByCode.get(i.food_code)!))
        .reduce((sum, i) => sum + Number(i.grams), 0) / d.servings;
    const guideline = (entries: PnnsEntry[]): PnnsView[] => entries.flatMap((entry) => {
      const match = pnnsMatch[entry.id];
      if (!match) return [];
      usedSources.add(entry.source.sourceId);
      const ag = pnnsGrams(raw.animal, match);
      const vg = pnnsGrams(dish, match);
      const limit = entry.limiteGrammesSemaine ?? entry.grammesJour;
      const pct = (g: number) => (limit ? (g / limit) * 100 : null);
      return [{ entry, animalGrams: ag, vegetalGrams: vg, animalPercent: pct(ag), vegetalPercent: pct(vg) }];
    });
    const pnns = guideline(raw.pnns);
    const eatLancet = guideline(raw.eatLancet);

    const hasEgg = (d: DishRow) => raw.ingredients.some((i) => i.dish_id === d.id && foodsByCode.get(i.food_code)?.food_subgroup === EGG_SUBGROUP);
    const animalFoods = raw.ingredients
      .filter((i) => i.dish_id === raw.animal.id)
      .map((i) => foodsByCode.get(i.food_code))
      .filter((f): f is FoodRow => !!f && f.is_animal);
    const animalFactorNotes: AnimalFactorNote[] = [];
    const animalWithoutFactor: string[] = [];
    for (const f of animalFoods) {
      const factors = raw.categoryFactors.filter((c) => c.category === f.animal_category);
      if (factors.length === 0) animalWithoutFactor.push(f.name_fr);
      for (const c of factors) {
        if (c.food_codes && !c.food_codes.includes(f.code)) continue;
        if (!animalFactorNotes.some((n) => n.category === c.category && n.indicatorId === c.indicator_id && n.sourceId === c.source_id)) {
          animalFactorNotes.push({ category: c.category, indicatorId: c.indicator_id, per: c.per === "animal" ? "animal" : "kg", unitBasis: c.unit_basis ?? null, notes: c.notes ?? null, sourceId: c.source_id });
        }
      }
    }
    // Per indicator: when none of the animal ingredients of the animal dish has a usable factor
    // (per kg, or per animal with animals_killed_land), the animal dish has no figure: never 0.
    const applies = (c: CategoryFactorRow, code: string) => !c.food_codes || c.food_codes.includes(code);
    const usable = (food: FoodRow, id: string) => {
      const fs = raw.categoryFactors.filter((c) => c.category === food.animal_category);
      const f = fs.find((c) => c.indicator_id === id && applies(c, food.code));
      if (!f) return false;
      if (f.per !== "animal") return true;
      return fs.some((c) => c.indicator_id === "animals_killed_land" && c.per !== "animal" && applies(c, food.code));
    };
    for (const b of BASES) {
      for (const r of rows[b.id]) {
        if (r.group !== "animalImpacts" || animalFoods.length === 0) continue;
        if (animalFoods.some((f) => usable(f, r.id))) continue;
        r.animal = null;
        r.reductionPercent = null;
        r.winner = null;
        r.indicativeWinner = null;
        r.lowCoverage = true;
        r.verdictPartial = true;
        r.verdictRanges = { animal: null, vegetal: r.verdictRanges.vegetal };
      }
    }

    // Animal welfare (decision of Matt, 17 h 40): every ingredient of the plant dish is a known food
    // with no identified animal ingredient, and the animal dish has at least one.
    const plantIngredients = raw.ingredients.filter((i) => i.dish_id === dish.id);
    const vegetalAnimalFree =
      animalFoods.length > 0 && plantIngredients.length > 0 && plantIngredients.every((i) => foodsByCode.get(i.food_code)?.is_animal === false);
    const scores = scorePair({ rows, iarc, price, climateCost, vegetalAnimalFree }, options.excludeFromScore, options.constructed);
    // Health and economy are not rows: their advantages come from the scores (IARC grams, price, climate cost).
    for (const c of scores.verdict.categories) {
      if (c.id !== "sante" && c.id !== "economie") continue;
      for (const i of c.indicators) {
        if (i.outcome !== "animal") continue;
        const conseil = raw.conseils.find((x) => x.criteria.includes(i.id)) ?? null;
        conseil?.sources.forEach((s) => usedSources.add(s.sourceId));
        animalBetter.push({ criterion: i.id, name: labelOf(i.id), partial: false, conseil, category: c.id });
      }
    }

    // « Écarts comblés, sauf : … » names exactly what the « Ce qui reste à couvrir » box lists.
    for (const c of [...scores.verdict.categories, ...Object.values(scores.nutritionByBasis)]) {
      if (!c.constructed) continue;
      const left = animalBetter.filter((x) => x.category === c.id && x.direction !== "down").map((x) => x.name.charAt(0).toLowerCase() + x.name.slice(1));
      c.constructedLabel = left.length ? `Écarts comblés, sauf : ${left.join(", ")}` : "Écarts comblés";
    }
    variants[p.variant] = {
      variant: p.variant,
      dish: dishView(dish, raw),
      rationale: p.rationale,
      rows,
      animalBetter,
      keyCoverage: coverages.length ? Math.min(...coverages) : null,
      eggImpactsUnderestimated: { animal: hasEgg(raw.animal), vegetal: hasEgg(dish) },
      soyIngredients: [...new Set(raw.ingredients.filter((i) => i.dish_id === dish.id).map((i) => foodsByCode.get(i.food_code)?.name_fr).filter((n): n is string => !!n && SOY_WORD.test(n)))],
      anyPartial: rows.perServing.some((r) => r.lowCoverage && (r.animal != null || r.vegetal != null)),
      climateCost,
      hasAnimalData: Object.keys(animalTotals.animalImpacts).length > 0,
      animalFactorNotes,
      animalWithoutFactor,
      price,
      iarc,
      pnns,
      eatLancet,
      sim: { animal: simTotals(animalTotals), vegetal: simTotals(vegTotals) },
      scores,
    };
  }

  // « Version complétée »: main protein raised, other gaps closed (data/complements.json).
  const completed: PairPageModel["completed"] = {};
  if (options.withViews !== false) {
    for (const p of raw.pairs) {
      if (!p.variant) continue;
      const dish = raw.vegetal.find((d) => d.id === p.vegan_dish_id);
      const v = variants[p.variant];
      if (!dish || !v) continue;
      const c = completedVariant(raw, dish, p, data);
      if (!c) continue;
      Object.keys(c.sources).forEach((s) => usedSources.add(s));
      completed[p.variant] = c.view;
    }
  }

  const choices: Choice[] = raw.pairs
    .filter((p): p is PairRow & { variant: string } => !!p.variant && !!variants[p.variant])
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (CHOICE_ORDER[a.p.variant] ?? 2) - (CHOICE_ORDER[b.p.variant] ?? 2) || a.i - b.i)
    .map(({ p }) => {
      const label = CHOICE_LABEL[p.variant] ?? variants[p.variant]!.dish.name;
      return CHOICE_LABEL[p.variant] ? { id: p.variant, label } : { id: p.variant, label, reason: p.rationale ?? undefined };
    });

  return {
    slug: raw.animal.slug,
    animal: dishView(raw.animal, raw),
    variants,
    choices,
    completed,
    sources: Object.fromEntries(raw.sources.filter((s) => usedSources.has(s.id)).map((s) => [s.id, s])),
    monetizationFactors: raw.monetizationFactors,
    monetizationRules: raw.monetizationRules,
  };
}
