// Several factors for one category and indicator, each limited to its foods (milk vs cheese,
// suite V1 S23). FICTITIOUS values.
import { describe, expect, it } from "vitest";
import { dishTotals, type ScoringData } from "@/lib/scoring";

const data: ScoringData = {
  foods: {
    MILK: { nutrients: {}, impacts: {}, isAnimal: true, animalCategory: "vache laitière" },
    CHEESE: { nutrients: {}, impacts: {}, isAnimal: true, animalCategory: "vache laitière" },
    BUTTER: { nutrients: {}, impacts: {}, isAnimal: true, animalCategory: "vache laitière" },
  },
  categoryFactors: {
    "vache laitière": {
      life_days_farmed: [
        { value: 0.05, low: null, high: null, sourceId: "faostat", foodCodes: ["MILK"] },
        { value: 0.4, low: null, high: null, sourceId: "fao-tcf", foodCodes: ["CHEESE"] },
      ],
    },
  },
};

describe("dishTotals with several factors per indicator", () => {
  it("uses, for each food, the factor whose scope contains it", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "MILK", grams: 1000 }, { foodCode: "CHEESE", grams: 100 }] }, data);
    expect(t.animalImpacts.life_days_farmed.perServing).toBeCloseTo(0.05 + 0.04);
    expect(t.animalImpacts.life_days_farmed.sourceIds).toEqual(["fao-tcf", "faostat"]);
  });
  it("leaves a food outside every scope as missing data (never 0)", () => {
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "BUTTER", grams: 100 }, { foodCode: "MILK", grams: 100 }] }, data);
    expect(t.animalImpacts.life_days_farmed.massCoverage).toBe(0.5);
  });
});
