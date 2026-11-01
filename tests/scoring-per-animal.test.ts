// Per-animal factors (pain hours, days of life) converted to per kg with the
// animals_killed_land factor of the same category. FICTITIOUS fixture values.
import { describe, expect, it } from "vitest";
import { dishTotals, type FoodData, type ScoringData } from "@/lib/scoring";

const food = (f: Partial<FoodData>): FoodData => ({ nutrients: {}, impacts: {}, isAnimal: false, animalCategory: null, ...f });

const data: ScoringData = {
  foods: {
    CHICKEN: food({ isAnimal: true, animalCategory: "poulet de chair" }),
    EGG: food({ isAnimal: true, animalCategory: "poule pondeuse" }),
    MILK: food({ isAnimal: true, animalCategory: "vache laitière" }),
    BEAN: food({}),
  },
  categoryFactors: {
    "poulet de chair": {
      animals_killed_land: { value: 0.5, low: 0.4, high: 0.6, sourceId: "kill-src" },
      pain_hours_excruciating: { value: 0.01, low: null, high: null, sourceId: "pain-src", per: "animal" },
      life_days_farmed: { value: 40, low: null, high: null, sourceId: "age-src", per: "animal" },
    },
    // No animals_killed_land for laying hens: per-animal values cannot be converted.
    "poule pondeuse": {
      pain_hours_annoying: { value: 2000, low: 2000, high: 6000, sourceId: "pain-src", per: "animal" },
    },
    // Already per kg (days of lactation per kg of milk).
    "vache laitière": { life_days_farmed: { value: 0.05, low: null, high: null, sourceId: "milk-src", per: "kg" } },
  },
};

describe("per-animal category factors", () => {
  it("multiplies the per-animal value by the animals killed per kg of the same category", () => {
    const t = dishTotals({ servings: 2, ingredients: [{ foodCode: "CHICKEN", grams: 400 }] }, data);
    // 0.4 kg × 0.5 animal/kg × 40 days / 2 servings = 4 days
    expect(t.animalImpacts.life_days_farmed.perServing).toBeCloseTo(4);
    // bounds: the per-animal value has no range, the kill factor has one
    expect(t.animalImpacts.life_days_farmed.lowPerServing).toBeCloseTo(0.4 * 0.4 * 40 / 2);
    expect(t.animalImpacts.life_days_farmed.highPerServing).toBeCloseTo(0.4 * 0.6 * 40 / 2);
    expect(t.animalImpacts.pain_hours_excruciating.perServing).toBeCloseTo(0.4 * 0.5 * 0.01 / 2);
    expect(t.animalImpacts.life_days_farmed.sourceIds).toEqual(["age-src", "kill-src"]);
  });

  it("leaves per-animal values without a kill factor as missing data, never 0", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "EGG", grams: 100 }, { foodCode: "BEAN", grams: 100 }] }, data);
    expect(t.animalImpacts.pain_hours_annoying.perServing).toBe(0); // only the bean is covered (real 0)
    expect(t.animalImpacts.pain_hours_annoying.massCoverage).toBeCloseTo(0.5);
  });

  it("uses per-kg factors as they are", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "MILK", grams: 1000 }] }, data);
    expect(t.animalImpacts.life_days_farmed.perServing).toBeCloseTo(0.05);
  });

  it("never adds pain intensities together", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "CHICKEN", grams: 1000 }] }, data);
    expect(t.animalImpacts.pain_hours_excruciating.perServing).toBeCloseTo(0.5 * 0.01);
    // The chicken has no "annoying" factor: that line is missing, not merged into another one.
    expect(t.animalImpacts).not.toHaveProperty("pain_hours_annoying");
    expect(t.animalImpacts).not.toHaveProperty("pain_hours_total");
  });
});

describe("factors restricted to some foods of a category", () => {
  const scoped: ScoringData = {
    foods: {
      MILK: food({ isAnimal: true, animalCategory: "vache laitière" }),
      CHEESE: food({ isAnimal: true, animalCategory: "vache laitière" }),
    },
    categoryFactors: {
      "vache laitière": { life_days_farmed: { value: 0.05, low: null, high: null, sourceId: "milk-src", per: "kg", foodCodes: ["MILK"] } },
    },
  };
  it("applies the factor to the listed foods only; other foods of the category are missing data", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "MILK", grams: 1000 }, { foodCode: "CHEESE", grams: 1000 }] }, scoped);
    expect(t.animalImpacts.life_days_farmed.perServing).toBeCloseTo(0.05);
    expect(t.animalImpacts.life_days_farmed.massCoverage).toBeCloseTo(0.5);
  });
});
