// One plant version that the visitor adjusts (suite V1, step 3 quinquies): equalise protein or
// calories, set the main protein, close gaps with the whitelist, back to base. FICTITIOUS values.
import { describe, expect, it } from "vitest";
import { adjustDish, dishTotals, type ComplementFood, type ScoringData } from "@/lib/scoring";

const food = (n: Record<string, number>, isAnimal = false) => ({ nutrients: n, impacts: {}, isAnimal, animalCategory: isAnimal ? "bovin" : null });
const DATA: ScoringData = {
  foods: {
    BEEF: food({ protein_g: 30, energy_eu_kcal: 200, zn_mg: 6, ca_mg: 10 }, true),
    SOY: food({ protein_g: 15, energy_eu_kcal: 150, zn_mg: 1, ca_mg: 50 }),
    RICE: food({ protein_g: 3, energy_eu_kcal: 130, zn_mg: 0.5, ca_mg: 5 }),
    SEEDS: food({ protein_g: 20, energy_eu_kcal: 550, zn_mg: 50, ca_mg: 900 }),
    LENTIL: food({ protein_g: 10, energy_eu_kcal: 120, zn_mg: 1, ca_mg: 20 }),
  },
  categoryFactors: {},
};
const ANIMAL = { servings: 1, ingredients: [{ foodCode: "BEEF", grams: 100 }, { foodCode: "RICE", grams: 100 }] };
const PLANT = { servings: 1, ingredients: [{ foodCode: "SOY", grams: 100 }, { foodCode: "RICE", grams: 100 }] };
const LIST: ComplementFood[] = [
  { code: "SEEDS", maxGrams: 10, weight: 1, per100g: DATA.foods.SEEDS!.nutrients as Record<string, number> },
  { code: "LENTIL", maxGrams: 150, weight: 1, per100g: DATA.foods.LENTIL!.nutrients as Record<string, number> },
];
const base = { dish: PLANT, data: DATA, main: "SOY", animal: dishTotals(ANIMAL, DATA), complements: LIST, maxBoostFactor: 2, completable: ["protein_g", "zn_mg", "ca_mg"] };
const protein = (d: { servings: number; ingredients: { foodCode: string; grams: number }[] }) => dishTotals(d, DATA).proteinPerServing!;

describe("adjustDish", () => {
  it("does nothing without a request: the base recipe is the reference", () => {
    const r = adjustDish({ ...base, request: { equalize: "none", close: [] } });
    expect(r.dish).toEqual(PLANT);
    expect(r.filled).toEqual([]);
    expect(r.constraints).toEqual([]);
  });

  it("equalises protein with the main protein, at most doubled, the rest from the whitelist", () => {
    // animal 33 g; plant 18 g -> needs +100 g of soy to reach 33 g: allowed (200 g = 2 × 100 g)
    const r = adjustDish({ ...base, request: { equalize: "protein", close: [] } });
    expect(r.dish.ingredients.find((i) => i.foodCode === "SOY")!.grams).toBeCloseTo(200);
    expect(protein(r.dish)).toBeCloseTo(33);
    expect(r.filled).toEqual(["protein_g"]);
    expect(r.constraints).toEqual([{ indicator: "protein_g", sense: "=", target: 33 }]);
    // a richer animal dish (42 g): the cap is hit at 33 g, the whitelist brings the rest
    const rich = adjustDish({ ...base, animal: dishTotals({ servings: 1, ingredients: [{ foodCode: "BEEF", grams: 130 }, { foodCode: "RICE", grams: 100 }] }, DATA), request: { equalize: "protein", close: [] } });
    expect(rich.boost?.capped).toBe(true);
    expect(rich.additions.length).toBeGreaterThan(0);
    expect(protein(rich.dish)).toBeGreaterThanOrEqual(42 - 1e-6);
    expect(rich.filled).toEqual(["protein_g"]);
  });

  it("can lower the main protein when the plant version has more", () => {
    const r = adjustDish({ ...base, animal: dishTotals({ servings: 1, ingredients: [{ foodCode: "RICE", grams: 100 }, { foodCode: "BEEF", grams: 30 }] }, DATA), request: { equalize: "protein", close: [] } });
    expect(protein(r.dish)).toBeCloseTo(12);
  });

  it("equalises calories by scaling the whole plant serving, and says by how much", () => {
    const r = adjustDish({ ...base, request: { equalize: "energy", close: [] } });
    expect(dishTotals(r.dish, DATA).kcalPerServing).toBeCloseTo(330);
    expect(r.scale).toBeCloseTo(330 / 280);
    expect(r.filled).toEqual([]); // energy is not scored; protein not equalised
  });

  it("sets the main protein by hand (grams per serving)", () => {
    const r = adjustDish({ ...base, request: { equalize: "none", close: [], mainGramsPerServing: 150 } });
    expect(r.dish.ingredients.find((i) => i.foodCode === "SOY")!.grams).toBe(150);
  });

  it("closes only the gaps asked, after the equalisation, and marks them filled", () => {
    const r = adjustDish({ ...base, request: { equalize: "none", close: ["zn_mg"] } });
    expect(r.closed).toEqual(["zn_mg"]);
    expect(r.filled).toEqual(["zn_mg"]);
    expect(dishTotals(r.dish, DATA).nutrients.zn_mg.perServing!).toBeGreaterThanOrEqual(6.5 - 1e-6);
  });

  it("« Tout combler » = equalise protein and close every gap the list can", () => {
    const r = adjustDish({ ...base, request: { equalize: "protein", close: "all" } });
    expect(r.filled.sort()).toEqual(["protein_g", "zn_mg"]);
  });

  it("leaves a gap no food closes open, never filled", () => {
    const r = adjustDish({ ...base, complements: [], request: { equalize: "none", close: ["zn_mg"] } });
    expect(r.open).toEqual(["zn_mg"]);
    expect(r.filled).toEqual([]);
  });
});
