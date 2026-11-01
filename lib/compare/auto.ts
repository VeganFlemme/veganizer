// Pure: automatic comparison (suite V1, decision of Matt 17 h 25). The animal recipe (official
// AGRIBALYSE recipe when one is retained, else the recipe type written by Veganizer) and the plant
// version derived by the single rule for the protein chosen by the visitor:
// - main animal ingredient -> chosen protein, equal mass (completed version: equal protein);
// - other animal ingredients -> reviewed rules (pipeline/substitutions.csv);
// - plant ingredients unchanged.
// Same page model as before (lib/compare/view.ts), one plant variant: the chosen protein.

import { mainAnimalIngredient, proteinFamily, rankCandidates, substituteDish, type OtherRule, type RankedCandidate, type SubstituteChange } from "@/lib/scoring";
import proteinChoice from "@/data/protein_choice.json";
import { displayName } from "./food";
import { dishPriceFromFoods } from "./prices";
import { applySubstitutions, type RecipeFood, type SubstitutionContext, type SubstitutionRule } from "./recipe";
import { buildPairPage, dishView, scoringData, type DishPriceRow, type DishRow, type IngredientRow, type PairPageModel, type RawPairData } from "./view";

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
  const model = buildPairPage(r.raw, { withViews: !options.light });
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
