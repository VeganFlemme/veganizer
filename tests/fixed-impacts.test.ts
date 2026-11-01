// Steps of an AGRIBALYSE dish itself (« Autres étapes »: processing, packaging, transport, cooking),
// kept identical on both sides (suite V1, step 3 ter, 5 quater). FICTITIOUS values.
import { describe, expect, it } from "vitest";
import { dishTotals, verdictTotals, withoutSharedIngredients, type ScoringData } from "@/lib/scoring";

const data: ScoringData = {
  foods: {
    BEEF: { nutrients: { protein_g: 20 }, impacts: { ghg: { value: 30, low: null, high: null, dqr: null, sourceId: "agb" } }, isAnimal: true, animalCategory: null },
    SOY: { nutrients: { protein_g: 20 }, impacts: { ghg: { value: 2, low: null, high: null, dqr: null, sourceId: "agb" } }, isAnimal: false, animalCategory: null },
  },
  categoryFactors: {},
};
const STEPS = { ghg: { value: 0.5, sourceId: "agb" } };

describe("fixedImpacts", () => {
  it("adds the steps of the dish to the impacts, without mass (coverage unchanged)", () => {
    const t = dishTotals({ servings: 2, ingredients: [{ foodCode: "BEEF", grams: 200 }], fixedImpacts: STEPS }, data);
    expect(t.impacts.ghg.perServing).toBeCloseTo((0.2 * 30 + 0.5) / 2);
    expect(t.impacts.ghg.massCoverage).toBe(1);
    expect(t.nutrients.protein_g.massCoverage).toBe(1);
  });
  it("cancels out in the verdict when identical on both sides, like a shared ingredient", () => {
    const a = { servings: 2, ingredients: [{ foodCode: "BEEF", grams: 200 }], fixedImpacts: STEPS };
    const v = { servings: 2, ingredients: [{ foodCode: "SOY", grams: 200 }], fixedImpacts: STEPS };
    const r = withoutSharedIngredients(a, v);
    expect(r.animal?.fixedImpacts).toBeUndefined();
    expect(r.vegetal?.fixedImpacts).toBeUndefined();
    const t = verdictTotals(a, v, data);
    expect(t.animal.impacts.ghg.perServing).toBeCloseTo(3);
    expect(t.vegetal.impacts.ghg.perServing).toBeCloseTo(0.2);
  });
});

describe("factorCode (official recipe ingredient standing for a Ciqual food)", () => {
  it("reads a factor restricted to some food codes through the food it stands for", () => {
    const d: ScoringData = {
      foods: { "agb:milk": { nutrients: {}, impacts: {}, isAnimal: true, animalCategory: "vache", factorCode: "MILK" } },
      categoryFactors: { vache: { days: [{ value: 1, low: 1, high: 1, sourceId: "fao", foodCodes: ["MILK"] }] } },
    };
    const t = dishTotals({ servings: 1, ingredients: [{ foodCode: "agb:milk", grams: 1000 }] }, d);
    expect(t.animalImpacts.days.perServing).toBe(1);
  });
});
