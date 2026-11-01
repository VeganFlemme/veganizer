// Single replacement rule (suite V1, decision of Matt 17 h 25). Pure: no network.
// - the main animal ingredient (the animal ingredient that brings the most protein) is replaced by
//   the protein chosen by the visitor, at equal mass (base version; the completed version then
//   raises it to equal protein, see boostMainProtein);
// - the other animal ingredients are replaced by the reviewed rules (pipeline/substitutions.csv),
//   given here as a function so that this file stays free of data;
// - plant ingredients do not change.

import type { Dish, ScoringData } from "./types";

export interface SubstituteChange {
  from: string;
  to: string;
  grams: number;
  newGrams: number;
  kind: "main" | "rule";
  reason: string | null;
}

/** Rule for an animal ingredient other than the main one: substitute and its grams, or null. */
export type OtherRule = (code: string, grams: number) => { to: string; grams: number; reason: string } | null;

// Energy of protein: 4 kcal per g (unit conversion, Regulation (EU) No 1169/2011, annex XIV).
const KCAL_PER_G_PROTEIN = 4;

/**
 * Main animal ingredient: the animal ingredient that brings the most protein, among the « sources
 * of protein » when `minProteinEnergyShare` is given (data/protein_choice.json: butter or cream never are).
 */
export function mainAnimalIngredient(dish: Dish, data: Pick<ScoringData, "foods">, minProteinEnergyShare?: number): string | null {
  let best: { code: string; protein: number } | null = null;
  for (const i of dish.ingredients) {
    const f = data.foods[i.foodCode];
    const p = f?.nutrients.protein_g;
    if (!f?.isAnimal || p == null) continue;
    const kcal = f.nutrients.energy_eu_kcal;
    if (minProteinEnergyShare != null && kcal != null && kcal > 0 && p * KCAL_PER_G_PROTEIN < minProteinEnergyShare * kcal) continue;
    const protein = (i.grams * p) / 100;
    if (!best || protein > best.protein) best = { code: i.foodCode, protein };
  }
  return best?.code ?? null;
}

export function substituteDish(
  dish: Dish,
  data: Pick<ScoringData, "foods">,
  protein: string,
  others: OtherRule,
  minProteinEnergyShare?: number,
): { dish: Dish; main: string; changes: SubstituteChange[]; unmatched: string[] } | null {
  const main = mainAnimalIngredient(dish, data, minProteinEnergyShare);
  if (!main) return null;
  const out = new Map<string, number>();
  const changes: SubstituteChange[] = [];
  const unmatched: string[] = [];
  const add = (code: string, grams: number) => out.set(code, (out.get(code) ?? 0) + grams);
  for (const i of dish.ingredients) {
    if (i.foodCode === main) {
      changes.push({ from: main, to: protein, grams: i.grams, newGrams: i.grams, kind: "main", reason: null });
      add(protein, i.grams);
      continue;
    }
    if (data.foods[i.foodCode]?.isAnimal) {
      const r = others(i.foodCode, i.grams);
      if (r) {
        changes.push({ from: i.foodCode, to: r.to, grams: i.grams, newGrams: r.grams, kind: "rule", reason: r.reason });
        add(r.to, r.grams);
        continue;
      }
      unmatched.push(i.foodCode);
    }
    add(i.foodCode, i.grams);
  }
  return { dish: { servings: dish.servings, ingredients: [...out].map(([foodCode, grams]) => ({ foodCode, grams })) }, main, changes, unmatched };
}
