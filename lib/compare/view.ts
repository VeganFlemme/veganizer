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
  type ScoringData,
} from "@/lib/scoring";
import { BASES, CLIMATE_INDICATORS, CLIMATE_MAIN, COVERAGE_WARNING, KEY_CRITERIA, NUTRIENTS, VEGAN_WORD } from "./config";

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
}
export interface NutrientValueRow {
  food_code: string;
  nutrient_id: string;
  value_per_100g: number | null;
  source_id: string;
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
  /** Year of the climate cost shown (current year of the official carbon value). */
  climateCostYear: number;
}

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------
export type Variant = "maison" | "commerce";

export interface SideValue {
  value: number | null;
  low: number | null;
  high: number | null;
  /** true when the source publishes no range (low = high = value). */
  rangePublished: boolean;
  coverage: number;
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
  /** Verdict, only when both sides cover at least COVERAGE_WARNING of the mass. */
  winner: "animal" | "vegetal" | "egal" | null;
  /** Same comparison on partial data (lowCoverage): indicative only, never shown as a verdict. */
  indicativeWinner: "animal" | "vegetal" | "egal" | null;
  sourceIds: string[];
  worstDqr: number | null;
  lowCoverage: boolean;
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
}

export interface ClimateCostView {
  year: number;
  animalEur: number | null;
  vegetalEur: number | null;
  eurPerKg: number | null;
  derived: boolean;
  sourceId: string | null;
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
  /** true when at least one criterion shown rests on partial data. */
  anyPartial: boolean;
  climateCost: ClimateCostView;
  /** Animal-pillar indicators with data (category_factors); empty = "bientôt". */
  hasAnimalData: boolean;
}

export interface PairPageModel {
  slug: string;
  animal: DishView;
  variants: Partial<Record<Variant, VariantView>>;
  sources: Record<string, SourceRow>;
}

// ---------------------------------------------------------------------------
const num = (x: number | string | null | undefined): number | null => (x == null ? null : Number(x));

function scoringData(raw: RawPairData): ScoringData {
  const foods: Record<string, FoodData> = {};
  const byCode = new Map(raw.foods.map((f) => [f.code, f]));
  for (const f of raw.foods) {
    const nutrientCode = f.ciqual_code ?? f.code;
    const nutrients: FoodData["nutrients"] = {};
    let nutrientSourceId: string | undefined;
    for (const n of raw.nutrientValues) {
      if (n.food_code !== nutrientCode) continue;
      nutrients[n.nutrient_id] = num(n.value_per_100g);
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
      nutrientSourceId,
      impacts,
      isAnimal: byCode.get(f.code)?.is_animal ?? false,
      animalCategory: f.animal_category,
    };
  }
  const categoryFactors: ScoringData["categoryFactors"] = {};
  for (const c of raw.categoryFactors) {
    const byIndicator: Record<string, CategoryFactor> = (categoryFactors[c.category] ??= {}) as Record<string, CategoryFactor>;
    byIndicator[c.indicator_id] = { value: Number(c.value), low: num(c.low), high: num(c.high), sourceId: c.source_id };
  }
  return { foods, categoryFactors };
}

function dishView(dish: DishRow, raw: RawPairData): DishView {
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

function side(a: Amount | undefined, basis: Basis): SideValue | null {
  if (!a) return null;
  const value = a[basis];
  // Ranges are only computed per serving; on other bases the central value is shown.
  const scale = basis === "perServing" || a.perServing == null || value == null || a.perServing === 0 ? 1 : value / a.perServing;
  const low = basis === "perServing" ? a.lowPerServing : a.lowPerServing == null || value == null ? null : a.lowPerServing * scale;
  const high = basis === "perServing" ? a.highPerServing : a.highPerServing == null || value == null ? null : a.highPerServing * scale;
  return {
    value,
    low,
    high,
    rangePublished: low != null && high != null && value != null && (low !== value || high !== value),
    coverage: a.massCoverage,
  };
}

function directions(raw: RawPairData): Directions {
  const d: Directions = {};
  for (const n of NUTRIENTS) if (n.direction !== "none") d[n.id] = { higherIsBetter: n.direction === "up" };
  for (const i of raw.indicators) d[i.id] = { higherIsBetter: Boolean(i.higher_is_better) };
  return d;
}

export function reductionPercent(animal: number | null, vegetal: number | null): number | null {
  if (animal == null || vegetal == null || animal === 0) return null;
  return ((animal - vegetal) / Math.abs(animal)) * 100;
}

function rowsFor(animal: DishTotals, vegetal: DishTotals, raw: RawPairData, basis: Basis): CriterionRow[] {
  const dirs = directions(raw);
  const cmp = compareDishes(animal, vegetal, { directions: dirs, conseils: raw.conseils, basis });
  const meta = new Map([...raw.nutrients, ...raw.indicators].map((m) => [m.id, m]));
  const rows: CriterionRow[] = [];

  const labels = new Map(NUTRIENTS.map((n) => [n.id, n.label]));
  const push = (id: string, group: CriterionRow["group"], direction: CriterionRow["direction"]) => {
    const a = animal[group][id];
    const v = vegetal[group][id];
    const m = meta.get(id);
    const as = side(a, basis);
    const vs = side(v, basis);
    const c = cmp.criteria[id];
    const coverages = [a?.massCoverage, v?.massCoverage].filter((x): x is number => x != null);
    const dqrs = [a?.worstDqr, v?.worstDqr].filter((x): x is number => x != null);
    const lowCoverage = coverages.length < 2 || Math.min(...coverages) < COVERAGE_WARNING;
    const verdict = direction === "none" ? null : (c?.winner ?? null);
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
      winner: lowCoverage ? null : verdict,
      indicativeWinner: lowCoverage ? verdict : null,
      sourceIds: [...new Set([...(a?.sourceIds ?? []), ...(v?.sourceIds ?? [])])].sort(),
      worstDqr: dqrs.length ? Math.max(...dqrs) : null,
      lowCoverage,
    });
  };

  for (const n of NUTRIENTS) push(n.id, "nutrients", n.direction);
  for (const id of CLIMATE_INDICATORS) {
    push(id, "impacts", dirs[id]?.higherIsBetter ? "up" : "down");
  }
  const animalIds = new Set([...Object.keys(animal.animalImpacts), ...Object.keys(vegetal.animalImpacts)]);
  for (const id of [...animalIds].sort()) push(id, "animalImpacts", dirs[id]?.higherIsBetter ? "up" : "down");
  return rows;
}

/** Builds the page model; variants without data are simply absent. */
export function buildPairPage(raw: RawPairData): PairPageModel {
  const data = scoringData(raw);
  const totalsOf = (d: DishRow) =>
    dishTotals(
      {
        servings: d.servings,
        ingredients: raw.ingredients.filter((i) => i.dish_id === d.id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })),
      },
      data,
    );
  const animalTotals = totalsOf(raw.animal);
  const variants: PairPageModel["variants"] = {};
  const usedSources = new Set<string>();

  for (const p of raw.pairs) {
    if (p.variant !== "maison" && p.variant !== "commerce") continue;
    const dish = raw.vegetal.find((d) => d.id === p.vegan_dish_id);
    if (!dish) continue;
    const vegTotals = totalsOf(dish);
    const rows = Object.fromEntries(BASES.map((b) => [b.id, rowsFor(animalTotals, vegTotals, raw, b.id)])) as Record<Basis, CriterionRow[]>;
    for (const r of rows.perServing) r.sourceIds.forEach((s) => usedSources.add(s));

    // Where the animal dish does better (rule 3): verdicts, plus partial-data cases flagged as such,
    // so that a gap in the data never hides an advantage of the animal dish.
    const animalBetter: AdvantageView[] = rows.perServing
      .filter((r) => r.winner === "animal" || r.indicativeWinner === "animal")
      .map((r) => ({
        criterion: r.id,
        name: r.name,
        partial: r.winner !== "animal",
        conseil: raw.conseils.find((c) => c.criteria.includes(r.id)) ?? null,
      }));
    for (const x of animalBetter) x.conseil?.sources.forEach((s) => usedSources.add(s.sourceId));

    const coverages = rows.perServing
      .filter((r) => KEY_CRITERIA.includes(r.id))
      .flatMap((r) => [r.animal?.coverage ?? 0, r.vegetal?.coverage ?? 0]);

    const a = animalTotals.impacts[CLIMATE_MAIN]?.perServing ?? null;
    const v = vegTotals.impacts[CLIMATE_MAIN]?.perServing ?? null;
    const opts = { indicatorId: CLIMATE_MAIN, rules: raw.monetizationRules };
    const ma = a == null ? null : monetize(a, raw.climateCostYear, raw.monetizationFactors, opts);
    const mv = v == null ? null : monetize(v, raw.climateCostYear, raw.monetizationFactors, opts);
    const unit = ma ?? mv;
    if (unit) usedSources.add(unit.sourceId);

    variants[p.variant] = {
      variant: p.variant,
      dish: dishView(dish, raw),
      rationale: p.rationale,
      rows,
      animalBetter,
      keyCoverage: coverages.length ? Math.min(...coverages) : null,
      anyPartial: rows.perServing.some((r) => r.lowCoverage && (r.animal != null || r.vegetal != null)),
      climateCost: {
        year: raw.climateCostYear,
        animalEur: ma?.eur ?? null,
        vegetalEur: mv?.eur ?? null,
        eurPerKg: unit?.eurPerUnit ?? null,
        derived: unit?.derived ?? false,
        sourceId: unit?.sourceId ?? null,
      },
      hasAnimalData: Object.keys(animalTotals.animalImpacts).length > 0,
    };
  }

  return {
    slug: raw.animal.slug,
    animal: dishView(raw.animal, raw),
    variants,
    sources: Object.fromEntries(raw.sources.filter((s) => usedSources.has(s.id)).map((s) => [s.id, s])),
  };
}
