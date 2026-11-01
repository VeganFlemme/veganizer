// Single replacement rule (suite V1, decision of Matt 17 h 25): the main animal ingredient is
// replaced by the chosen protein at equal mass; other animal ingredients by the reviewed rules;
// plant ingredients unchanged. FICTITIOUS nutrient values.
import { describe, expect, it } from "vitest";
import { mainAnimalIngredient, substituteDish, type ScoringData } from "@/lib/scoring";

const food = (protein: number | null, isAnimal: boolean) => ({ nutrients: { protein_g: protein }, impacts: {}, isAnimal, animalCategory: isAnimal ? "bovin" : null });
const DATA: ScoringData = {
  foods: {
    BEEF: food(28, true),
    BACON: food(14, true),
    BUTTER: food(1, true),
    CARROT: food(1, false),
    SOY: food(17, false),
    TOFU_SMOKED: food(16, false),
    OIL: food(0, false),
  },
  categoryFactors: {},
};
const DISH = { servings: 4, ingredients: [{ foodCode: "BEEF", grams: 500 }, { foodCode: "BACON", grams: 80 }, { foodCode: "BUTTER", grams: 30 }, { foodCode: "CARROT", grams: 250 }] };

describe("mainAnimalIngredient", () => {
  it("is the animal ingredient that brings the most protein", () => {
    expect(mainAnimalIngredient(DISH, DATA)).toBe("BEEF");
  });
  it("is never a food that is not a source of protein (< 12 % of energy, Regulation (EC) No 1924/2006): butter alone has no main ingredient", () => {
    const data = { foods: { BUTTER: { nutrients: { protein_g: 0.7, energy_eu_kcal: 745 }, impacts: {}, isAnimal: true, animalCategory: "vache laitière" }, CARROT: food(1, false) } };
    expect(mainAnimalIngredient({ servings: 1, ingredients: [{ foodCode: "BUTTER", grams: 50 }, { foodCode: "CARROT", grams: 200 }] }, data, 0.12)).toBeNull();
    expect(mainAnimalIngredient({ servings: 1, ingredients: [{ foodCode: "BUTTER", grams: 50 }] }, data)).toBe("BUTTER"); // no threshold given
  });
  it("is null without an animal ingredient with known protein", () => {
    expect(mainAnimalIngredient({ servings: 1, ingredients: [{ foodCode: "CARROT", grams: 100 }] }, DATA)).toBeNull();
  });
});

describe("substituteDish", () => {
  const rules = (code: string) => (code === "BACON" ? { to: "TOFU_SMOKED", grams: 80, reason: "charcuterie → tofu fumé" } : code === "BUTTER" ? { to: "OIL", grams: 24, reason: "beurre → huile" } : null);

  it("replaces the main ingredient by the chosen protein at equal mass, the others by the rules, keeps plant ingredients", () => {
    const r = substituteDish(DISH, DATA, "SOY", rules)!;
    expect(r.dish.ingredients).toEqual([{ foodCode: "SOY", grams: 500 }, { foodCode: "TOFU_SMOKED", grams: 80 }, { foodCode: "OIL", grams: 24 }, { foodCode: "CARROT", grams: 250 }]);
    expect(r.dish.servings).toBe(4);
    expect(r.changes.map((x) => [x.from, x.to, x.kind])).toEqual([["BEEF", "SOY", "main"], ["BACON", "TOFU_SMOKED", "rule"], ["BUTTER", "OIL", "rule"]]);
    expect(r.unmatched).toEqual([]);
  });

  it("merges a substitute already present in the recipe", () => {
    const r = substituteDish({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 100 }, { foodCode: "SOY", grams: 20 }] }, DATA, "SOY", () => null)!;
    expect(r.dish.ingredients).toEqual([{ foodCode: "SOY", grams: 120 }]);
  });

  it("lists an animal ingredient without a rule as unmatched and leaves it (never dropped silently)", () => {
    const r = substituteDish(DISH, DATA, "SOY", () => null)!;
    expect(r.unmatched).toEqual(["BACON", "BUTTER"]);
    expect(r.dish.ingredients.map((i) => i.foodCode)).toContain("BACON");
  });

  it("returns null when the dish has no main animal ingredient", () => {
    expect(substituteDish({ servings: 1, ingredients: [{ foodCode: "CARROT", grams: 100 }] }, DATA, "SOY", rules)).toBeNull();
  });
});
