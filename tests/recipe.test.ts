// Fixture values are invented for the test only.
import { describe, expect, it } from "vitest";
import { applySubstitutions, dishPriceFromFoods, type RecipeFood, type SubstitutionRule } from "@/lib/compare/recipe";

const foods: Record<string, RecipeFood> = {
  beef: { code: "beef", name_fr: "Boeuf, steak haché 15% MG cuit", is_animal: true, animal_category: "bovin", food_subgroup: "viandes cuites", iarc_meat: "rouge" },
  bacon: { code: "bacon", name_fr: "Lardon fumé, cuit", is_animal: true, animal_category: "porc", food_subgroup: "charcuteries et alternatives végétales", iarc_meat: "transformée" },
  egg: { code: "egg", name_fr: "Oeuf cru", is_animal: true, animal_category: "poule pondeuse", food_subgroup: "oeufs", iarc_meat: null },
  honey: { code: "honey", name_fr: "Miel", is_animal: true, animal_category: "abeille", food_subgroup: "sucres, miels et assimilés", iarc_meat: null },
  pasta: { code: "pasta", name_fr: "Pâtes cuites", is_animal: false, animal_category: null, food_subgroup: "pâtes, riz et céréales", iarc_meat: null },
};
const rules: SubstitutionRule[] = [
  { priority: 10, match_type: "iarc", match_value: "transformée", to_code: "tofu-fume", ratio: 1, justification: "charcuterie" },
  { priority: 20, match_type: "name_regex", match_value: "\\bhach", to_code: "lentils", ratio: 1, justification: "haché" },
  { priority: 30, match_type: "subgroup", match_value: "viandes cuites", to_code: "seitan", ratio: 1, justification: "viande" },
  { priority: 50, match_type: "subgroup", match_value: "oeufs", to_code: "tofu", ratio: 0.5, justification: "œuf" },
];

describe("applySubstitutions", () => {
  const r = applySubstitutions(
    [
      { code: "beef", grams: 400 },
      { code: "bacon", grams: 100 },
      { code: "egg", grams: 100 },
      { code: "honey", grams: 20 },
      { code: "pasta", grams: 300 },
    ],
    foods,
    rules,
  );
  it("uses the first matching rule by priority", () => {
    expect(r.changes.find((c) => c.from === "beef")?.to).toBe("lentils"); // name rule (20) before subgroup (30)
    expect(r.changes.find((c) => c.from === "bacon")?.to).toBe("tofu-fume");
  });
  it("applies the ratio and keeps plant ingredients", () => {
    expect(r.ingredients).toContainEqual({ code: "tofu", grams: 50 });
    expect(r.ingredients).toContainEqual({ code: "pasta", grams: 300 });
  });
  it("lists animal ingredients without a rule, kept as they are", () => {
    expect(r.unmatched).toEqual(["honey"]);
    expect(r.ingredients).toContainEqual({ code: "honey", grams: 20 });
  });
  it("merges quantities when two ingredients become the same food", () => {
    const m = applySubstitutions([{ code: "beef", grams: 100 }, { code: "lentils", grams: 50 }], { ...foods, lentils: { ...foods.pasta, code: "lentils" } }, rules);
    expect(m.ingredients).toEqual([{ code: "lentils", grams: 150 }]);
  });
});

describe("dishPriceFromFoods", () => {
  it("prices covered grams and reports coverage; nothing priced = no row", () => {
    const p = dishPriceFromFoods("D", 2, [{ code: "a", grams: 500 }, { code: "b", grams: 500 }], [
      { food_code: "a", source_id: "rnm", median_eur_per_kg: 4, observations: 12, first_observed_on: "2025-11-15", last_observed_on: "2026-10-15", place: "GMS" },
    ]);
    expect(p?.per_serving).toBeCloseTo(1); // 0.5 kg × 4 € / 2
    expect(p?.mass_coverage).toBeCloseTo(0.5);
    expect(dishPriceFromFoods("D", 1, [{ code: "b", grams: 100 }], [])).toBeNull();
  });
});
