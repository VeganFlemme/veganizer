// Scores on the page model: values gathered from the rows, sentences of the basis.
import { describe, expect, it } from "vitest";
import { categorySentence, categorySummary, healthSummary, scorePair, type ScoreInput } from "@/lib/compare/scores";
import type { CriterionRow, SideValue } from "@/lib/compare/view";
import { scoreCategory } from "@/lib/scoring";

const side = (value: number | null, coverage = 1): SideValue => ({ value, low: value, high: value, rangePublished: false, censored: false, coverage, dqr: null });
const point = (x: number | null) => (x == null ? null : { low: x, high: x });
const row = (id: string, group: CriterionRow["group"], a: number | null, v: number | null, lowCoverage = false, verdictPartial = lowCoverage): CriterionRow => ({
  id, name: id, sourceName: id, unit: "", group, direction: "down",
  animal: a == null ? null : side(a), vegetal: v == null ? null : side(v),
  reductionPercent: null, winner: null, indicativeWinner: null, sourceIds: [], worstDqr: null, lowCoverage,
  verdictCoverage: verdictPartial ? 0.5 : 1, verdictPartial, verdictRanges: { animal: point(a), vegetal: point(v) }, featured: false,
});
const ROUGE = { id: "rouge", groupe: "2A", libelle: "Viande rouge", classement: "probablement cancérogène", definition: "…", source: { sourceId: "iarc-114", publisher: "CIRC", title: "t", url: "https://example.org", accessedOn: "2026-11-01" } };
const TRANSFORMEE = { ...ROUGE, id: "transformée", groupe: "1", libelle: "Viande transformée", classement: "cancérogène" };

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
    rows: { perServing: rows, per100g: rows.map((r) => (r.id === "protein_g" ? row("protein_g", "nutrients", 10, 10) : r)) },
    iarc: [{ entry: ROUGE, animalGrams: 125, vegetalGrams: 0, animalFoods: ["bœuf"], vegetalFoods: [], animalItems: [{ name: "bœuf", grams: 125 }], vegetalItems: [] }],
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
        animal: { value: 3, low: null, high: null, coverage: 0.5, per100g: null, firstObservedOn: null, lastObservedOn: null },
        vegetal: { value: 1, low: null, high: null, coverage: 1, per100g: null, firstObservedOn: null, lastObservedOn: null },
        sourceIds: [], animalIngredients: [], vegetalIngredients: [],
      },
    }));
    expect(p.verdict.categories[4].indicators[0].outcome).toBe("partiel");
  });

  it("counts the categories won (verdict 'X sur 5')", () => {
    expect([s.verdict.vegetalWins, s.verdict.animalWins, s.verdict.total]).toEqual([4, 0, 5]);
    expect(s.verdict.sentence).toContain("Égalité en nutrition");
  });

  it("counts a verdict on the ingredients that differ even when the displayed coverage is low", () => {
    const rows = [row("fiber_g", "nutrients", 2, 9, true, false)];
    const p = scorePair(input({ rows: { perServing: rows, per100g: rows } }));
    expect(p.verdict.categories[0].indicators.find((i) => i.id === "fiber_g")?.outcome).toBe("vegetal");
  });

  it("gives no point when the ranges overlap (« < x » values)", () => {
    const r = { ...row("salt_g", "nutrients", null, 0.4), verdictRanges: { animal: { low: 0.2, high: 1.5 }, vegetal: { low: 0.4, high: 0.4 } } };
    const p = scorePair(input({ rows: { perServing: [r], per100g: [r] } }));
    expect(p.verdict.categories[0].indicators.find((i) => i.id === "salt_g")?.outcome).toBe("egal");
  });

  it("follows the unit of the Nutrition tab", () => {
    expect(s.nutritionByBasis.perServing.animalPoints).toBe(1);
    expect(s.nutritionByBasis.per100g.animalPoints).toBe(0);
    expect(s.nutritionByBasis.per100g.winner).toBe("vegetal");
  });
});

describe("animal welfare when the plant dish has no identified animal ingredient (decision of Matt, 17 h 40)", () => {
  const PHRASE = "La version végétale ne contient aucun ingrédient animal identifié : elle ne peut pas faire moins bien sur la protection animale.";
  it("is won by the plant dish, not provisional, with the sentence, missing values still missing", () => {
    const a = scorePair(input({ vegetalAnimalFree: true })).verdict.categories.find((c) => c.id === "animaux")!;
    expect([a.winner, a.provisional]).toEqual(["vegetal", false]);
    expect(a.sentence.startsWith(PHRASE)).toBe(true);
    expect(a.summary.startsWith(PHRASE)).toBe(true);
    expect(a.sentence).not.toMatch(/vegan|végétalien/i);
    expect(a.indicators.find((i) => i.id === "life_days_farmed")?.outcome).not.toBe("vegetal");
    expect(a.compared).toBe(scorePair(input()).verdict.categories.find((c) => c.id === "animaux")!.compared);
  });
  it("is not applied otherwise", () => {
    const a = scorePair(input()).verdict.categories.find((c) => c.id === "animaux")!;
    expect(a.sentence).not.toContain(PHRASE);
  });
});

describe("categorySentence", () => {
  it("says what each dish wins and what is not counted", () => {
    const c = scoreCategory(
      { id: "x", indicators: [{ id: "a", direction: "lower_is_better" }, { id: "b", direction: "lower_is_better" }, { id: "c", direction: "lower_is_better" }] },
      { a: { animal: 2, vegetal: 1 }, b: { animal: 1, vegetal: 2 }, c: { animal: null, vegetal: 1 } },
      { significantDigits: 3 },
    );
    expect(categorySentence(c, { a: "Gaz", b: "Eau", c: "Sols" })).toBe(
      "2 indicateurs comparés sur 3. Mieux pour la version végétale : gaz. Mieux pour le plat animal : eau. Non comptés (données manquantes ou partielles) : sols.",
    );
  });

  it("explains when nothing is comparable", () => {
    const c = scoreCategory({ id: "x", indicators: [{ id: "a", direction: "lower_is_better" }] }, {}, { significantDigits: 3 });
    expect(categorySentence(c, { a: "Prix" })).toMatch(/^Aucun indicateur comparable : prix/);
  });
});

describe("categorySummary", () => {
  const opts = { significantDigits: 3 };
  const rule = { id: "x", indicators: ["a", "b", "c", "d"].map((id) => ({ id, direction: "lower_is_better" as const })) };
  it("names the compared indicators when there are few", () => {
    const c = scoreCategory(rule, { a: { animal: 2, vegetal: 1 } }, opts);
    expect(categorySummary(c, { a: "Gaz à effet de serre" })).toBe(
      "Gaz à effet de serre. Les 3 autres indicateurs : données manquantes ou partielles, non comptés.",
    );
  });
  it("gives counts when many are compared", () => {
    const v = { animal: 2, vegetal: 1 };
    const c = scoreCategory(rule, { a: v, b: v, c: v, d: { animal: 1, vegetal: 2 } }, opts);
    expect(categorySummary(c, {})).toBe("4 indicateurs comparés : végétal mieux sur 3, plat animal sur 1.");
  });
});

describe("healthSummary", () => {
  it("writes the real grams with the food names, group by group", () => {
    const iarc = [
      { entry: TRANSFORMEE, animalGrams: 20, vegetalGrams: 0, animalFoods: ["lardons fumés cuits"], vegetalFoods: [], animalItems: [{ name: "lardon fumé", grams: 20 }], vegetalItems: [] },
      { entry: ROUGE, animalGrams: 125, vegetalGrams: 0, animalFoods: ["bœuf cuit (environ 750 g cru)"], vegetalFoods: [], animalItems: [{ name: "bœuf", grams: 125 }], vegetalItems: [] },
    ];
    expect(healthSummary(iarc)).toBe(
      "Plat animal : 20\u00a0g de lardon fumé (viande transformée, groupe 1) et 125\u00a0g de bœuf (viande rouge, groupe 2A) par portion. Version végétale : aucun ingrédient classé.",
    );
  });
  it("says when nothing is classified", () => {
    expect(healthSummary([{ entry: ROUGE, animalGrams: 0, vegetalGrams: 0, animalFoods: [], vegetalFoods: [], animalItems: [], vegetalItems: [] }])).toMatch(/^Plat animal : aucun ingrédient classé/);
  });
});
