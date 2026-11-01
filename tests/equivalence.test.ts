// Carte d'équivalence (suite V1, step 3 quinquies, point 4 bis). FICTITIOUS values.
import { describe, expect, it } from "vitest";
import { equivalence } from "@/lib/compare/views";

const base = {
  animal: { name: "Dorade", servings: 1, gramsPerServing: 100 },
  plant: [{ label: "tofu ferme", grams: 120 }, { label: "cerneaux de noix", grams: 10 }],
  servings: 1,
  filled: ["protein_g", "zn_mg"],
  scale: null,
  indicators: [{ id: "protein_g", outcome: "egal" }, { id: "zn_mg", outcome: "vegetal" }, { id: "vit_b12_ug", outcome: "animal" }],
  open: ["vit_b12_ug"],
  names: {},
};

describe("equivalence", () => {
  it("food page: one line « 100 g de dorade ≈ 120 g de tofu ferme + 10 g de cerneaux de noix »", () => {
    const e = equivalence(base);
    expect(e.headline?.replace(/ /g, " ")).toBe("100 g de dorade ≈ 120 g de tofu ferme + 10 g de cerneaux de noix");
  });

  it("says what the equivalence covers and what remains, without a dose", () => {
    const e = equivalence(base);
    expect(e.on).toBe("Équivalent sur : mêmes protéines ; zinc comblé");
    expect(e.outside).toBe("Sauf vitamine B12 : complément ou aliment enrichi, à voir avec un professionnel de santé.");
    expect(e.everyPoint).toBe(false);
    expect(e.notYet).toEqual([]); // B12 is said once, in « Sauf »
    expect(e.text).not.toMatch(/\d+\s*(µg|mg)\b/);
  });

  it("« en tout point » only when no counted indicator is won by the animal dish and nothing remains", () => {
    const e = equivalence({ ...base, indicators: [{ id: "protein_g", outcome: "egal" }, { id: "zn_mg", outcome: "vegetal" }], open: [] });
    expect(e.everyPoint).toBe(true);
    expect(e.on).toMatch(/^Équivalent en tout point/);
    const f = equivalence({ ...base, indicators: [{ id: "salt_g", outcome: "animal" }], open: [], names: { salt_g: "Sel chlorure de sodium" } });
    expect(f.everyPoint).toBe(false);
    expect(f.notYet).toEqual(["sel"]);
  });

  it("dish: the whole plant list, for the recipe and per serving; calories equalised are said", () => {
    const e = equivalence({ ...base, animal: { name: "Bœuf bourguignon", servings: 4, gramsPerServing: 400 }, servings: 4, plant: [{ label: "seitan", grams: 600 }], filled: [], scale: 1.4 });
    expect(e.headline).toBeNull();
    expect(e.items).toEqual([{ label: "seitan", grams: 600, gramsPerServing: 150 }]);
    expect(e.on).toBe("Équivalent sur : mêmes calories");
    expect(e.text).toContain("- 600 g seitan (150 g par portion)");
  });
});
