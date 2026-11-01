// Pure: automatic comparison (suite V1, decision of Matt 17 h 25). The animal recipe (official
// AGRIBALYSE recipe when one is retained, else the recipe type written by Veganizer) and the plant
// version derived by the single rule for the protein chosen by the visitor:
// - main animal ingredient -> chosen protein, equal mass (completed version: equal protein);
// - other animal ingredients -> reviewed rules (pipeline/substitutions.csv);
// - plant ingredients unchanged.
// Same page model as before (lib/compare/view.ts), one plant variant: the chosen protein.

import {
  adjustDish,
  dishTotals,
  mainAnimalIngredient,
  proteinFamily,
  rankCandidates,
  substituteDish,
  type AdjustRequest,
  type ComplementFood,
  type OtherRule,
  type RankedCandidate,
  type SubstituteChange,
} from "@/lib/scoring";
import proteinChoice from "@/data/protein_choice.json";
import scoreRules from "@/data/score_rules.json";
import { displayName } from "./food";
import { dishPriceFromFoods } from "./prices";
import { applySubstitutions, type RecipeFood, type SubstitutionContext, type SubstitutionRule } from "./recipe";
import {
  buildPairPage,
  COMPLETABLE,
  dishView,
  KIND_WEIGHT,
  roleNoteOf,
  scoringData,
  TOTALS_OPTIONS,
  type ComplementAddition,
  type CompletedVariantView,
  type DishPriceRow,
  type DishRow,
  type FoodRow,
  type ImpactRow,
  type IngredientRow,
  type PairPageModel,
  type RawPairData,
} from "./view";

export interface CandidateRow {
  code: string;
  name_fr: string;
  food_subgroup: string | null;
  protein_g: number;
  fat_g: number;
  energy_kcal: number;
}

export interface OfficialRecipeRow {
  dish_code: string;
  flow: string;
  food_code: string | null;
  ingredient_fr: string | null;
  kg_per_kg_dish: number;
}

export interface AutoInput {
  /** The animal dish and its ingredients only (vegetal and pairs are built here). */
  raw: RawPairData;
  candidates: CandidateRow[];
  rules: SubstitutionRule[];
  context: SubstitutionContext;
  recipe: { kind: "officielle" | "type"; officialCode?: string; officialName?: string; sidesNote?: string };
}

export interface RankedChoice extends RankedCandidate {
  family: string;
}

const VEGETAL_ID = "V";
const MIN_SHARE = proteinChoice.mainIngredientMinProteinEnergyShare;
// Prefix of an official recipe input without a Ciqual code: unknown to the engine, so its mass
// lowers the coverage (shown) instead of being dropped.
export const NO_CODE_PREFIX = "agb30:";

const fr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Official recipe in the grams of our dish: kg per kg of dish × mass of our main dish (our recipe
 * without its sides); the sides of our recipe are kept as they are.
 */
export function officialIngredients(dishId: string, official: OfficialRecipeRow[], ours: IngredientRow[], sides: string[]): IngredientRow[] {
  const kept = ours.filter((i) => sides.includes(i.food_code));
  const mainMass = ours.filter((i) => !sides.includes(i.food_code)).reduce((s, i) => s + Number(i.grams), 0);
  const merged = new Map<string, IngredientRow>();
  for (const r of official) {
    const code = r.food_code ?? `${NO_CODE_PREFIX}${r.flow}`;
    const label = r.ingredient_fr ? lowerFirst(r.ingredient_fr.trim()) : "eau";
    const note = `${label} (recette officielle${r.food_code ? "" : ", sans donnée"})`;
    const prev = merged.get(code);
    const grams = Number(r.kg_per_kg_dish) * mainMass;
    merged.set(code, prev ? { ...prev, grams: Number(prev.grams) + grams } : { dish_id: dishId, food_code: code, grams, note });
  }
  return [...merged.values(), ...kept];
}

export interface OfficialContribution {
  ingredient: string;
  indicator_id: string;
  value_per_kg: number;
  source_id: string;
}

// Name of the steps of the dish itself in the AGRIBALYSE 3.2 detail per ingredient.
export const OTHER_STEPS = "Autres étapes";
// Prefix of an ingredient of an official dish, standing for a Ciqual food with the 3.2 contribution as impact.
export const OFFICIAL_PREFIX = "agb:";

/**
 * Official AGRIBALYSE dish with its published impact kept (5 quater): each 3.2 ingredient of the
 * dish becomes an ingredient whose impact per kg is its published contribution (contribution per kg
 * of dish ÷ kg of the ingredient per kg of dish), its nutrients and animal factors those of the
 * Ciqual food it stands for; « Autres étapes » (processing, packaging, transport, cooking) become
 * the steps of the dish, identical on both sides. The animal dish then has exactly the published
 * impact, the plant version the published impact − the replaced contributions + the substitutes.
 */
export function officialRecipe(args: {
  dishId: string;
  dishCode: string;
  official: OfficialRecipeRow[];
  contributions: OfficialContribution[];
  ours: IngredientRow[];
  sides: string[];
  raw: Pick<RawPairData, "foods" | "foodPrices">;
  context: SubstitutionContext;
}): { ingredients: IngredientRow[]; foods: FoodRow[]; impacts: ImpactRow[]; foodPrices: RawPairData["foodPrices"]; fixed: NonNullable<DishRow["fixed_impacts"]>; context: SubstitutionContext } {
  const { dishId, dishCode, official, contributions, ours, sides, raw } = args;
  const kept = ours.filter((i) => sides.includes(i.food_code));
  const mainMass = ours.filter((i) => !sides.includes(i.food_code)).reduce((s, i) => s + Number(i.grams), 0);
  const byCode = new Map(raw.foods.map((f) => [f.code, f]));
  const fixed: NonNullable<DishRow["fixed_impacts"]> = {};
  for (const c of contributions.filter((x) => x.ingredient === OTHER_STEPS)) fixed[c.indicator_id] = { value: (Number(c.value_per_kg) * mainMass) / 1000, sourceId: c.source_id };
  const groups = new Map<string, OfficialRecipeRow[]>();
  for (const r of official) {
    const k = r.ingredient_fr?.trim() || "";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const ingredients: IngredientRow[] = [];
  const foods: FoodRow[] = [];
  const impacts: ImpactRow[] = [];
  const foodPrices: RawPairData["foodPrices"] = [];
  const context: SubstitutionContext = { fatPer100g: { ...args.context.fatPer100g }, cookingYieldPct: { ...args.context.cookingYieldPct } };
  for (const [name, rows] of groups) {
    const kg = rows.reduce((s, r) => s + Number(r.kg_per_kg_dish), 0);
    const grams = kg * mainMass;
    const contrib = contributions.filter((c) => c.ingredient.trim() === name);
    const baseCode = rows.find((r) => r.food_code)?.food_code ?? null;
    if (!name || contrib.length === 0 || !(kg > 0)) {
      // Added water, or no published contribution: the ingredient with its own data (or none).
      ingredients.push({ dish_id: dishId, food_code: baseCode ?? `${NO_CODE_PREFIX}${rows[0].flow}`, grams, note: `${name ? lowerFirst(name) : "eau"} (recette officielle${baseCode ? "" : ", sans donnée"})` });
      continue;
    }
    const code = `${OFFICIAL_PREFIX}${dishCode}:${name}`;
    const base = baseCode ? byCode.get(baseCode) : undefined;
    foods.push(
      base
        ? { ...base, code, ciqual_code: base.ciqual_code ?? base.code, factor_code: base.code }
        : { code, name_fr: name, is_animal: false, animal_category: null, ciqual_code: null },
    );
    for (const c of contrib) {
      impacts.push({ food_code: code, indicator_id: c.indicator_id, value_per_kg: Number(c.value_per_kg) / kg, low_per_kg: null, high_per_kg: null, dqr: null, source_id: c.source_id });
    }
    if (baseCode) {
      for (const p of raw.foodPrices.filter((x) => x.food_code === baseCode)) foodPrices.push({ ...p, food_code: code });
      context.fatPer100g[code] = context.fatPer100g[baseCode];
      context.cookingYieldPct[code] = context.cookingYieldPct[baseCode];
    }
    ingredients.push({ dish_id: dishId, food_code: code, grams, note: `${lowerFirst(name)} (recette officielle${base ? "" : ", sans donnée nutritionnelle"})` });
  }
  return { ingredients: [...ingredients, ...kept], foods, impacts, foodPrices, fixed, context };
}

function animalDish(input: AutoInput) {
  const a = input.raw.animal;
  return {
    servings: a.servings,
    ingredients: input.raw.ingredients.filter((i) => i.dish_id === a.id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })),
  };
}

/** Candidates ranked against the main animal ingredient (data only). */
export function rankedCandidates(input: AutoInput): RankedChoice[] {
  const data = scoringData(input.raw);
  const dish = animalDish(input);
  const main = mainAnimalIngredient(dish, data, MIN_SHARE);
  const n = main ? data.foods[main]?.nutrients : undefined;
  const label = main ? dishView(input.raw.animal, input.raw).ingredients.find((i) => i.code === main)?.label : undefined;
  const ranked = rankCandidates(
    { protein: n?.protein_g ?? null, fat: n?.fat_g ?? null, energy: n?.energy_eu_kcal ?? null, name: label ? lowerFirst(label.replace(/\s*\(.*\)$/, "")) : undefined },
    input.candidates.map((c) => ({ code: c.code, name: displayName(c.name_fr), protein: Number(c.protein_g), fat: Number(c.fat_g), energy: Number(c.energy_kcal) })),
  );
  return ranked.map((r) => ({ ...r, family: proteinFamily({ name: r.name, subgroup: input.candidates.find((c) => c.code === r.code)?.food_subgroup ?? null }) }));
}

function otherRule(input: AutoInput): OtherRule {
  const foods: Record<string, RecipeFood | undefined> = Object.fromEntries(
    input.raw.foods.map((f) => [f.code, { code: f.code, name_fr: f.name_fr, is_animal: f.is_animal, animal_category: f.animal_category, food_subgroup: f.food_subgroup ?? null, iarc_meat: f.iarc_meat ?? null }]),
  );
  return (code, grams) => {
    const r = applySubstitutions([{ code, grams }], foods, input.rules, input.context);
    const c = r.changes[0];
    return c ? { to: c.to, grams: c.newGrams, reason: c.justification } : null;
  };
}

/** Raw data of the pair for one protein: the animal dish and its plant version. */
function rawFor(input: AutoInput, code: string, ranked: RankedChoice[]) {
  const choice = ranked.find((c) => c.code === code);
  if (!choice) return null;
  const data = scoringData(input.raw);
  const sub = substituteDish(animalDish(input), data, code, otherRule(input), MIN_SHARE);
  if (!sub) return null;
  const a = input.raw.animal;
  const names = new Map(input.raw.foods.map((f) => [f.code, displayName(f.name_fr)]));
  const animalNotes = new Map(input.raw.ingredients.filter((i) => i.dish_id === a.id).map((i) => [i.food_code, i.note]));
  const replaced = new Set(sub.changes.map((c) => c.to));
  const vegetal: DishRow = {
    id: VEGETAL_ID,
    slug: `${a.slug}-${code}`,
    name_fr: `Version végétale : ${lowerFirst(choice.name)}`,
    kind: "vegetal",
    servings: a.servings,
    description: null,
    ...(a.fixed_impacts ? { fixed_impacts: a.fixed_impacts } : {}),
  };
  const plantRows: IngredientRow[] = sub.dish.ingredients.map((i) => ({
    dish_id: VEGETAL_ID,
    food_code: i.foodCode,
    grams: i.grams,
    // Substitutes are named from Ciqual (vegan claims removed, rule 10); kept ingredients keep their recipe note.
    note: replaced.has(i.foodCode) ? lowerFirst(names.get(i.foodCode) ?? i.foodCode) : (animalNotes.get(i.foodCode) ?? null),
  }));
  const animalRows = input.raw.ingredients.filter((i) => i.dish_id === a.id);
  const prices = [
    dishPriceFromFoods(a.id, a.servings, animalRows.map((i) => ({ code: i.food_code, grams: Number(i.grams) })), input.raw.foodPrices),
    dishPriceFromFoods(VEGETAL_ID, a.servings, plantRows.map((i) => ({ code: i.food_code, grams: Number(i.grams) })), input.raw.foodPrices),
  ].filter((p): p is DishPriceRow => p != null);
  const raw: RawPairData = {
    ...input.raw,
    vegetal: [vegetal],
    pairs: [{ vegan_dish_id: VEGETAL_ID, variant: code, rationale: choice.reason, boost_code: code }],
    ingredients: [...animalRows, ...plantRows],
    dishPrices: prices,
  };
  return { raw, unmatched: sub.unmatched, changes: sub.changes };
}

/** Page model for the protein `code`; choices = every candidate, ranked. null for an unknown code. */
export function buildAutoPage(
  input: AutoInput,
  code: string,
  options: { light?: boolean } = {},
): { model: PairPageModel; unmatched: string[]; changes: SubstituteChange[] } | null {
  const ranked = rankedCandidates(input);
  const r = rawFor(input, code, ranked);
  if (!r) return null;
  // light: base version only (no completed version), for lists and counts.
  // Step 3 quinquies: one plant version; its adjustment is built on demand (buildAdjusted).
  void options.light;
  const model = buildPairPage(r.raw, { withViews: false });
  model.choices = ranked.map((c) => ({
    id: c.code,
    label: c.name,
    reason: c.reason,
    detail: c.protein == null ? "protéines : donnée manquante" : `${fr.format(c.protein)} g de protéines pour 100 g`,
    family: c.family,
  }));
  return { model, unmatched: r.unmatched, changes: r.changes };
}

/** For how many proteins of the list the plant version wins on climate (CO2e per serving, ranges not overlapping). */
export function climateWins(input: AutoInput): { wins: number; total: number } {
  const ranked = rankedCandidates(input);
  let wins = 0;
  for (const c of ranked) {
    const r = rawFor(input, c.code, ranked);
    if (!r) continue;
    const v = buildPairPage(r.raw, { withViews: false }).variants[c.code];
    if (v?.rows.perServing.find((x) => x.id === "ghg_100y_kgco2e")?.winner === "vegetal") wins++;
  }
  return { wins, total: ranked.length };
}

// ---------------------------------------------------------------------------
// Step 3 quinquies: one plant version, adjusted by the visitor (?ajuste=, ?quantite=).

export const ADJUST_ALL = "tout";
const ADJUST_PROTEIN = "proteines";
const ADJUST_ENERGY = "calories";

/** ?ajuste=proteines,zn_mg (or calories, or tout) and ?quantite=<g per serving> -> request; null = base recipe. */
export function parseAdjust(ajuste: string | null, quantite: string | null): AdjustRequest | null {
  const tokens = (ajuste ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const qty = quantite != null && quantite !== "" && Number.isFinite(Number(quantite)) && Number(quantite) >= 0 ? Number(quantite) : null;
  if (tokens.length === 0 && qty == null) return null;
  if (tokens.includes(ADJUST_ALL)) return { equalize: "protein", close: "all", mainGramsPerServing: qty };
  return {
    equalize: tokens.includes(ADJUST_PROTEIN) ? "protein" : tokens.includes(ADJUST_ENERGY) ? "energy" : "none",
    close: tokens.filter((t) => t !== ADJUST_PROTEIN && t !== ADJUST_ENERGY),
    mainGramsPerServing: qty,
  };
}

/** Inverse of parseAdjust, for the URL. */
export function adjustParams(r: AdjustRequest | null): { ajuste: string | null; quantite: string | null } {
  if (!r) return { ajuste: null, quantite: null };
  const tokens = r.close === "all" ? [ADJUST_ALL] : [...(r.equalize === "protein" ? [ADJUST_PROTEIN] : r.equalize === "energy" ? [ADJUST_ENERGY] : []), ...r.close];
  return { ajuste: tokens.length ? tokens.join(",") : null, quantite: r.mainGramsPerServing != null ? String(Math.round(r.mainGramsPerServing)) : null };
}

/** Gaps the visitor can ask to close: « plus = mieux » nutrients where the base plant version has less. */
export function baseGaps(input: AutoInput, code: string): { id: string; label: string }[] {
  const ranked = rankedCandidates(input);
  const r = rawFor(input, code, ranked);
  if (!r) return [];
  const data = scoringData(r.raw);
  const dishOf = (id: string, d: DishRow) => ({ servings: d.servings, ingredients: r.raw.ingredients.filter((i) => i.dish_id === id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })) });
  const a = dishTotals(dishOf(r.raw.animal.id, r.raw.animal), data, TOTALS_OPTIONS);
  const v = dishTotals(dishOf(VEGETAL_ID, r.raw.vegetal[0]), data, TOTALS_OPTIONS);
  const rules = new Map(scoreRules.categories.flatMap((c) => c.indicators.map((i) => [i.id, i.label] as const)));
  const names = new Map(r.raw.nutrients.map((n) => [n.id, rules.get(n.id) ?? n.name_fr]));
  for (const [id, label] of rules) if (!names.has(id)) names.set(id, label);
  return [...COMPLETABLE]
    .filter((id) => id !== "protein_g")
    .filter((id) => {
      const ah = a.nutrients[id]?.highPerServing ?? a.nutrients[id]?.perServing;
      const vl = v.nutrients[id]?.lowPerServing ?? v.nutrients[id]?.perServing;
      return ah != null && vl != null && ah > vl;
    })
    .map((id) => ({ id, label: names.get(id) ?? id }));
}

/** The adjusted plant version for the protein `code` (same page model as the base version). */
export function buildAdjusted(input: AutoInput, code: string, request: AdjustRequest): CompletedVariantView | null {
  const ranked = rankedCandidates(input);
  const r = rawFor(input, code, ranked);
  if (!r) return null;
  const data = scoringData(r.raw);
  const a = r.raw.animal;
  const v = r.raw.vegetal[0];
  const rowsOf = (id: string) => r.raw.ingredients.filter((i) => i.dish_id === id);
  const plantDish = { servings: v.servings, ingredients: rowsOf(VEGETAL_ID).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })), ...(v.fixed_impacts ? { fixedImpacts: v.fixed_impacts } : {}) };
  const animalDish = { servings: a.servings, ingredients: rowsOf(a.id).map((i) => ({ foodCode: i.food_code, grams: Number(i.grams) })), ...(a.fixed_impacts ? { fixedImpacts: a.fixed_impacts } : {}) };
  const animalTotals = dishTotals(animalDish, data, TOTALS_OPTIONS);
  const specs = (r.raw.complements ?? []).filter((c) => data.foods[c.code]);
  const foods: ComplementFood[] = specs.map((c) => ({
    code: c.code,
    maxGrams: c.maxGramsPerServing,
    weight: KIND_WEIGHT[c.kind],
    per100g: Object.fromEntries(Object.entries(data.foods[c.code]!.nutrients).filter(([, x]) => x != null)) as Record<string, number>,
  }));
  const res = adjustDish({
    dish: plantDish,
    data,
    main: code,
    animal: animalTotals,
    request,
    complements: foods,
    limits: r.raw.complementLimits,
    maxBoostFactor: proteinChoice.maxBoostFactor,
    completable: [...COMPLETABLE],
    totalsOptions: TOTALS_OPTIONS,
  });
  const notes = new Map(rowsOf(VEGETAL_ID).map((i) => [i.food_code, i.note]));
  const additions: ComplementAddition[] = res.additions.map((x) => {
    const s = specs.find((c) => c.code === x.code)!;
    return { code: x.code, label: s.label, gramsPerServing: x.grams, nutrients: x.nutrients, justification: s.justification, kind: s.kind };
  });
  const plantRows: IngredientRow[] = res.dish.ingredients.map((i) => ({
    dish_id: VEGETAL_ID,
    food_code: i.foodCode,
    grams: i.grams,
    note: notes.get(i.foodCode) ?? additions.find((x) => x.code === i.foodCode)?.label ?? null,
  }));
  const prices = [
    dishPriceFromFoods(a.id, a.servings, rowsOf(a.id).map((i) => ({ code: i.food_code, grams: Number(i.grams) })), r.raw.foodPrices),
    dishPriceFromFoods(VEGETAL_ID, v.servings, plantRows.map((i) => ({ code: i.food_code, grams: Number(i.grams) })), r.raw.foodPrices),
  ].filter((p): p is DishPriceRow => p != null);
  const raw: RawPairData = { ...r.raw, ingredients: [...rowsOf(a.id), ...plantRows], dishPrices: prices };
  // Point 4 (decision of Matt, 19 h 50): the score compares the animal dish and the plant version
  // as displayed; filled indicators are marked « comblé » and counted.
  const page = buildPairPage(raw, { withViews: false });
  const view = page.variants[code];
  if (!view) return null;
  for (const rows of Object.values(view.rows)) for (const row of rows) if (res.filled.includes(row.id)) row.filled = true;
  const label = dishView(v, raw).ingredients.find((i) => i.code === code)?.label ?? code;
  return {
    view,
    boost: res.boost ? { code: res.boost.code, label, extraGrams: res.boost.extraGrams, capped: res.boost.capped } : null,
    additions,
    open: res.open,
    roleNote: roleNoteOf(raw, animalDish, data),
    scale: res.scale,
    filled: res.filled,
  };
}
