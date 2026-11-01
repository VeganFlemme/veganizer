// Scores on the page model: values gathered from the rows, sentences of the basis.
import { describe, expect, it } from "vitest";
import { categorySentence, scorePair, type ScoreInput } from "@/lib/compare/scores";
import type { CriterionRow, SideValue } from "@/lib/compare/view";
import { scoreCategory } from "@/lib/scoring";

const side = (value: number | null, coverage = 1): SideValue => ({ value, low: value, high: value, rangePublished: false, coverage });
const row = (id: string, group: CriterionRow["group"], a: number | null, v: number | null, lowCoverage = false): CriterionRow => ({
  id, name: id, sourceName: id, unit: "", group, direction: "down",
  animal: a == null ? null : side(a), vegetal: v == null ? null : side(v),
  reductionPercent: null, winner: null, indicativeWinner: null, sourceIds: [], worstDqr: null, lowCoverage,
});

function input(over: Partial<ScoreInput> = {}): ScoreInput {
  const rows = [
    row("protein_g", "nutrients", 40, 30),
    row("fiber_g", "nutrients", 2, 9),
    row("i_ug", "nutrients", 20, 5, true),
    row("ghg_100y_kgco2e", "impacts", 5, 0.6),
    row("land_use_pt", "impacts", 200, -3),
    row("animals_killed_land", "animalImpacts", 0.001, 0),
    row("life_days_farmed", "animalImpacts", null, 0, true),
  ];
  return {
    rows: { perServing: rows, per100kcal: rows, per10gProtein: rows.map((r) => (r.id === "protein_g" ? row("protein_g", "nutrients", 10, 10) : r)) },
    iarc: [{ entry: { id: "rouge" } as never, animalGrams: 125, vegetalGrams: 0 }],
    price: { animal: null, vegetal: null, sourceIds: [], animalIngredients: [], vegetalIngredients: [] },
    climateCost: [{ year: 2025, animalEur: 1.29, vegetalEur: 0.17, eurPerKg: 0.256, derived: false, sourceId: "vac-2025" }],
    ...over,
  };
}

describe("scorePair", () => {
  const s = scorePair(input());
  const cat = (id: string) => s.verdict.categories.find((c) => c.id === id)!;

  it("scores the five categories in the order of the tabs", () => {
    expect(s.verdict.categories.map((c) => c.id)).toEqual(["nutrition", "sante", "environnement", "animaux", "economie"]);
  });

  it("does not count partial nutrients (coverage < 95 %)", () => {
    const n = cat("nutrition");
    expect(n.indicators.find((i) => i.id === "i_ug")?.outcome).toBe("partiel");
    expect([n.animalPoints, n.vegetalPoints, n.winner]).toEqual([1, 1, "egal"]);
  });

  it("uses IARC grams per serving for health (real 0 for the plant dish)", () => {
    expect(cat("sante").winner).toBe("vegetal");
    expect(cat("sante").indicators.find((i) => i.id === "iarc_1_g")?.outcome).toBe("manquant");
  });

  it("counts negative Agribalyse values as published", () => {
    expect(cat("environnement").indicators.find((i) => i.id === "land_use_pt")?.outcome).toBe("vegetal");
    expect(cat("environnement").provisional).toBe(true);
  });

  it("never counts a missing price, and counts the climate cost", () => {
    const e = cat("economie");
    expect(e.indicators.find((i) => i.id === "price_eur")?.outcome).toBe("manquant");
    expect(e.winner).toBe("vegetal");
    expect(e.compared).toBe(1);
  });

  it("does not count a price that covers less than 95 % of the mass", () => {
    const p = scorePair(input({
      price: {
        animal: { value: 3, low: null, high: null, coverage: 0.5, per100kcal: null, per10gProtein: null, firstObservedOn: null, lastObservedOn: null },
        vegetal: { value: 1, low: null, high: null, coverage: 1, per100kcal: null, per10gProtein: null, firstObservedOn: null, lastObservedOn: null },
        sourceIds: [], animalIngredients: [], vegetalIngredients: [],
      },
    }));
    expect(p.verdict.categories[4].indicators[0].outcome).toBe("partiel");
  });

  it("counts the categories won (verdict 'X sur 5')", () => {
    expect([s.verdict.vegetalWins, s.verdict.animalWins, s.verdict.total]).toEqual([4, 0, 5]);
    expect(s.verdict.sentence).toContain("Égalité en nutrition");
  });

  it("follows the unit of the Nutrition tab", () => {
    expect(s.nutritionByBasis.perServing.animalPoints).toBe(1);
    expect(s.nutritionByBasis.per10gProtein.animalPoints).toBe(0);
    expect(s.nutritionByBasis.per10gProtein.winner).toBe("vegetal");
  });
});

describe("categorySentence", () => {
  it("says what each dish wins and what is not counted", () => {
    const c = scoreCategory(
      { id: "x", indicators: [{ id: "a", direction: "lower_is_better" }, { id: "b", direction: "lower_is_better" }, { id: "c", direction: "lower_is_better" }] },
      { a: { animal: 2, vegetal: 1 }, b: { animal: 1, vegetal: 2 }, c: { animal: null, vegetal: 1 } },
      { significantDigits: 3, provisionalBelowShare: 0.5 },
    );
    expect(categorySentence(c, { a: "Gaz", b: "Eau", c: "Sols" })).toBe(
      "2 indicateurs comparés sur 3. Mieux pour la version végétale : gaz. Mieux pour le plat animal : eau. Non comptés (données manquantes ou partielles) : sols.",
    );
  });

  it("explains when nothing is comparable", () => {
    const c = scoreCategory({ id: "x", indicators: [{ id: "a", direction: "lower_is_better" }] }, {}, { significantDigits: 3, provisionalBelowShare: 0.5 });
    expect(categorySentence(c, { a: "Prix" })).toMatch(/^Aucun indicateur comparable : prix/);
  });
});
