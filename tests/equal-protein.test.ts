// Protein scaling (suite V1): equal-protein factor and main-protein boost of the completed version. Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { boostMainProtein, equalProteinFactor, scaleDish, dishTotals, type ScoringData } from "@/lib/scoring";

describe("equalProteinFactor and scaleDish", () => {
  const data: ScoringData = {
    foods: { M: { nutrients: { protein_g: 20 }, impacts: {}, isAnimal: true, animalCategory: null }, B: { nutrients: { protein_g: 10 }, impacts: {}, isAnimal: false, animalCategory: null } },
    categoryFactors: {},
  };
  const a = dishTotals({ servings: 2, ingredients: [{ foodCode: "M", grams: 400 }] }, data); // 40 g per serving
  const v = dishTotals({ servings: 2, ingredients: [{ foodCode: "B", grams: 500 }] }, data); // 25 g per serving
  it("is animal protein / plant protein, from the data", () => {
    expect(equalProteinFactor(a, v)).toBeCloseTo(1.6);
  });
  it("is null when a protein total is missing or zero (no invented scale)", () => {
    const none = dishTotals({ servings: 1, ingredients: [{ foodCode: "B", grams: 100 }] }, { ...data, foods: { B: { ...data.foods.B!, nutrients: {} } } });
    expect(equalProteinFactor(a, none)).toBeNull();
    expect(equalProteinFactor(a, dishTotals({ servings: 1, ingredients: [{ foodCode: "B", grams: 100 }] }, { ...data, foods: { B: { ...data.foods.B!, nutrients: { protein_g: 0 } } } }))).toBeNull();
  });
  it("scales every ingredient, servings unchanged", () => {
    expect(scaleDish({ servings: 2, ingredients: [{ foodCode: "B", grams: 500 }] }, 1.6)).toEqual({ servings: 2, ingredients: [{ foodCode: "B", grams: 800 }] });
  });
});

describe("boostMainProtein (suite V1, S24d: completed version)", () => {
  const data: ScoringData = {
    foods: {
      PST: { nutrients: { protein_g: 20 }, impacts: {}, isAnimal: false, animalCategory: null },
      RICE: { nutrients: { protein_g: 2 }, impacts: {}, isAnimal: false, animalCategory: null },
      NONE: { nutrients: {}, impacts: {}, isAnimal: false, animalCategory: null },
    },
    categoryFactors: {},
  };
  const dish = { servings: 2, ingredients: [{ foodCode: "PST", grams: 300 }, { foodCode: "RICE", grams: 400 }] };

  it("increases only the main protein (largest protein among the ingredients that differ) to reach the target", () => {
    // plant protein per serving: (60 + 8) / 2 = 34 g; target 44 g -> +10 g per serving -> +20 g per recipe -> +100 g of PST
    const r = boostMainProtein(dish, data, 44, ["RICE"])!;
    expect(r.code).toBe("PST");
    expect(r.extraGrams).toBeCloseTo(100);
    expect(r.dish.ingredients).toEqual([{ foodCode: "PST", grams: 400 }, { foodCode: "RICE", grams: 400 }]);
  });
  it("never touches an ingredient identical to the animal dish", () => {
    expect(boostMainProtein({ servings: 1, ingredients: [{ foodCode: "RICE", grams: 100 }] }, data, 10, ["RICE"])).toBeNull();
  });
  it("does nothing when the plant version already has as much protein, or when protein is unknown", () => {
    expect(boostMainProtein(dish, data, 30, [])).toBeNull();
    expect(boostMainProtein({ servings: 1, ingredients: [{ foodCode: "NONE", grams: 100 }] }, data, 10, [])).toBeNull();
  });
});
