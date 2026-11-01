import { describe, expect, it } from "vitest";
import rulesFile from "@/data/score_rules.json";
import {
  roundSignificant,
  type CategoryScore,
  scoreCategory,
  scoreIndicator,
  verdict,
  type ScoreCategoryRule,
  type ScoreOptions,
} from "@/lib/scoring";

const OPTS: ScoreOptions = { significantDigits: 3 };

const NUT: ScoreCategoryRule = {
  id: "nutrition",
  indicators: [
    { id: "protein_g", direction: "higher_is_better" },
    { id: "fiber_g", direction: "higher_is_better" },
    { id: "salt_g", direction: "lower_is_better" },
    { id: "fa_sat_g", direction: "lower_is_better" },
  ],
};

describe("roundSignificant", () => {
  it("rounds to the display precision", () => {
    expect(roundSignificant(48.64, 3)).toBe(48.6);
    expect(roundSignificant(0.0012345, 3)).toBe(0.00123);
    expect(roundSignificant(0, 3)).toBe(0);
    expect(roundSignificant(-1.2345, 3)).toBe(-1.23);
  });
});

describe("scoreIndicator", () => {
  it("gives the point to the dish that does strictly better", () => {
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, { animal: 5, vegetal: 0.6 }, OPTS).outcome).toBe("vegetal");
    expect(scoreIndicator({ id: "x", direction: "higher_is_better" }, { animal: 48.6, vegetal: 35.4 }, OPTS).outcome).toBe("animal");
  });

  it("is a tie when the values are equal after display rounding", () => {
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, { animal: 1.2341, vegetal: 1.2339 }, OPTS).outcome).toBe("egal");
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, { animal: 0, vegetal: 0 }, OPTS).outcome).toBe("egal");
  });

  it("never counts a missing value (never 0)", () => {
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, { animal: null, vegetal: 0 }, OPTS).outcome).toBe("manquant");
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, { animal: 3, vegetal: undefined }, OPTS).outcome).toBe("manquant");
    expect(scoreIndicator({ id: "x", direction: "lower_is_better" }, undefined, OPTS).outcome).toBe("manquant");
  });

  it("does not count partial data (coverage below the threshold)", () => {
    expect(scoreIndicator({ id: "x", direction: "higher_is_better" }, { animal: 1, vegetal: 9, partial: true }, OPTS).outcome).toBe("partiel");
  });

  it("handles negative values as published (lower is still better)", () => {
    expect(scoreIndicator({ id: "land", direction: "lower_is_better" }, { animal: 2, vegetal: -0.5 }, OPTS).outcome).toBe("vegetal");
  });
});

describe("scoreCategory", () => {
  it("counts points and designates the winner", () => {
    const c = scoreCategory(
      NUT,
      {
        protein_g: { animal: 48.6, vegetal: 35.4 },
        fiber_g: { animal: 2, vegetal: 9 },
        salt_g: { animal: 1.5, vegetal: 1.2 },
        fa_sat_g: { animal: 8, vegetal: 2 },
      },
      OPTS,
    );
    expect([c.animalPoints, c.vegetalPoints, c.compared, c.total]).toEqual([1, 3, 4, 4]);
    expect(c.winner).toBe("vegetal");
    expect(c.provisional).toBe(false);
  });

  it("is a tie with as many points on each side", () => {
    const c = scoreCategory(NUT, { protein_g: { animal: 2, vegetal: 1 }, fiber_g: { animal: 1, vegetal: 2 }, salt_g: { animal: 1, vegetal: 1 } }, OPTS);
    expect(c.winner).toBe("egal");
    expect([c.animalPoints, c.vegetalPoints, c.compared]).toEqual([1, 1, 3]);
  });

  it("does not count a missing value and says how many were compared", () => {
    const c = scoreCategory(NUT, { protein_g: { animal: 2, vegetal: 1 }, fiber_g: { animal: 1, vegetal: null }, salt_g: { animal: null, vegetal: 1 } }, OPTS);
    expect([c.compared, c.total]).toEqual([1, 4]);
    expect(c.winner).toBe("animal");
    expect(c.provisional).toBe(true);
    expect(c.indicators.map((i) => i.outcome)).toEqual(["animal", "manquant", "manquant", "manquant"]);
  });

  it("gives 'insufficient data' when nothing can be compared", () => {
    const c = scoreCategory(NUT, {}, OPTS);
    expect(c.winner).toBe("insuffisant");
    expect([c.animalPoints, c.vegetalPoints, c.compared, c.total]).toEqual([0, 0, 0, 4]);
    expect(c.provisional).toBe(true);
  });

  describe("'provisoire' only when the missing data could change the winner (decision of Matt, 17 h 40)", () => {
    it("is provisional when the indicators not counted could reach a tie", () => {
      // 2-0 for the plant dish, 2 indicators missing: both could go to the animal dish.
      const c = scoreCategory(NUT, { protein_g: { animal: 1, vegetal: 2 }, fiber_g: { animal: 1, vegetal: 2 } }, OPTS);
      expect([c.winner, c.provisional]).toEqual(["vegetal", true]);
    });
    it("is not provisional when the lead is larger than the indicators not counted, whatever their share", () => {
      // 3-0, 1 missing: the animal dish could reach 1 at most.
      const c = scoreCategory(NUT, { protein_g: { animal: 1, vegetal: 2 }, fiber_g: { animal: 1, vegetal: 2 }, salt_g: { animal: 2, vegetal: 1 } }, OPTS);
      expect([c.winner, c.provisional]).toEqual(["vegetal", false]);
      // 1-0 out of 1 compared, 3 missing: provisional although the rule used to be "half compared".
      const few = scoreCategory(NUT, { protein_g: { animal: 1, vegetal: 2 } }, OPTS);
      expect(few.provisional).toBe(true);
    });
    it("counts 'partiel' indicators as not counted too", () => {
      const c = scoreCategory(NUT, { protein_g: { animal: 1, vegetal: 2 }, fiber_g: { animal: 1, vegetal: 2 }, salt_g: { animal: 2, vegetal: 1 }, fa_sat_g: { animal: 1, vegetal: 9, partial: true } }, OPTS);
      expect([c.compared, c.provisional]).toEqual([3, false]);
    });
    it("a tie is provisional as soon as one indicator is not counted, final when all are", () => {
      const tie = { protein_g: { animal: 2, vegetal: 1 }, fiber_g: { animal: 1, vegetal: 2 } };
      expect(scoreCategory(NUT, tie, OPTS).provisional).toBe(true);
      const all = { ...tie, salt_g: { animal: 1, vegetal: 1 }, fa_sat_g: { animal: 1, vegetal: 1 } };
      expect(scoreCategory(NUT, all, OPTS).provisional).toBe(false);
    });
    it("is never provisional when every indicator is compared", () => {
      const c = scoreCategory(NUT, { protein_g: { animal: 2, vegetal: 1 }, fiber_g: { animal: 1, vegetal: 2 }, salt_g: { animal: 1, vegetal: 2 }, fa_sat_g: { animal: 1, vegetal: 1 } }, OPTS);
      expect([c.winner, c.provisional]).toEqual(["animal", false]);
    });
  });

  describe("plant dish without any identified animal ingredient (animal welfare, decision of Matt, 17 h 40)", () => {
    const ANI: ScoreCategoryRule = {
      id: "animaux",
      vegetalCannotBeWorse: true,
      indicators: [
        { id: "killed", direction: "lower_is_better" },
        { id: "days", direction: "lower_is_better" },
        { id: "pain", direction: "lower_is_better" },
      ],
    };
    it("is won by the plant dish without 'provisoire', even with values missing on the animal side", () => {
      const c = scoreCategory(ANI, { killed: { animal: 0.01, vegetal: 0 }, days: { animal: null, vegetal: 0 }, pain: { animal: null, vegetal: 0 } }, OPTS);
      expect([c.winner, c.provisional]).toEqual(["vegetal", false]);
      // Missing values stay missing: nothing invented, the count of compared indicators is unchanged.
      expect([c.compared, c.total, c.vegetalPoints, c.animalPoints]).toEqual([1, 3, 1, 0]);
      expect(c.indicators.map((i) => i.outcome)).toEqual(["vegetal", "manquant", "manquant"]);
      expect(c.vegetalCannotBeWorse).toBe(true);
    });
    it("holds when no indicator can be compared", () => {
      const c = scoreCategory(ANI, { killed: { animal: null, vegetal: 0 } }, OPTS);
      expect([c.winner, c.provisional, c.compared]).toEqual(["vegetal", false, 0]);
    });
    it("falls back to the general rule if the data contradicts it (an animal point)", () => {
      const c = scoreCategory(ANI, { killed: { animal: 0, vegetal: 1 } }, OPTS);
      expect(c.winner).toBe("animal");
      expect(c.vegetalCannotBeWorse).toBeFalsy();
    });
  });

  it("a tie on every compared indicator is 'Égalité', not 'insufficient'", () => {
    const c = scoreCategory(NUT, { protein_g: { animal: 1, vegetal: 1 }, fiber_g: { animal: 2, vegetal: 2 } }, OPTS);
    expect(c.winner).toBe("egal");
    expect(c.compared).toBe(2);
  });

  it("a unit conversion applied to both sides does not change the result", () => {
    const g = scoreCategory(NUT, { salt_g: { animal: 1.5, vegetal: 1.2 } }, OPTS);
    const mg = scoreCategory(NUT, { salt_g: { animal: 1500, vegetal: 1200 } }, OPTS);
    expect(mg.winner).toBe(g.winner);
    expect(mg.vegetalPoints).toBe(g.vegetalPoints);
  });

  it("the comparison basis can change the winner (per serving vs per 10 g of protein)", () => {
    // Per serving the plant dish emits less; per 10 g of protein it can emit more.
    const env: ScoreCategoryRule = { id: "env", indicators: [{ id: "ghg", direction: "lower_is_better" }] };
    const perServing = scoreCategory(env, { ghg: { animal: 1.0, vegetal: 0.6 } }, OPTS);
    const per10g = scoreCategory(env, { ghg: { animal: 1.0 / 40 * 10, vegetal: 0.6 / 10 * 10 } }, OPTS);
    expect(perServing.winner).toBe("vegetal");
    expect(per10g.winner).toBe("animal");
  });

  it("scores the home-made and store-bought variants independently", () => {
    const animal = { protein_g: 30, fiber_g: 2, salt_g: 1, fa_sat_g: 5 };
    const maison = { protein_g: 25, fiber_g: 8, salt_g: 0.8, fa_sat_g: 1 };
    const commerce = { protein_g: 32, fiber_g: 1, salt_g: 2, fa_sat_g: 6 };
    const values = (v: Record<string, number>) =>
      Object.fromEntries(Object.keys(animal).map((k) => [k, { animal: animal[k as keyof typeof animal], vegetal: v[k] }]));
    const m = scoreCategory(NUT, values(maison), OPTS);
    const c = scoreCategory(NUT, values(commerce), OPTS);
    expect([m.animalPoints, m.vegetalPoints, m.winner]).toEqual([1, 3, "vegetal"]);
    expect([c.animalPoints, c.vegetalPoints, c.winner]).toEqual([3, 1, "animal"]);
  });
});

describe("verdict", () => {
  it("counts the categories won by each dish", () => {
    const won = (w: CategoryScore["winner"]): CategoryScore => ({
      id: w, animalPoints: 0, vegetalPoints: 0, compared: 1, total: 1, winner: w, provisional: false, indicators: [],
    });
    const v = verdict([won("vegetal"), won("vegetal"), won("animal"), won("egal"), won("insuffisant")]);
    expect([v.vegetalWins, v.animalWins, v.total]).toEqual([2, 1, 5]);
  });
});

describe("data/score_rules.json", () => {
  it("has the five categories in the order of the tabs", () => {
    expect(rulesFile.categories.map((c) => c.id)).toEqual(["nutrition", "sante", "environnement", "animaux", "economie"]);
  });

  it("gives every indicator a direction, a justification and a source", () => {
    for (const c of rulesFile.categories) {
      for (const i of c.indicators) {
        expect(["lower_is_better", "higher_is_better"]).toContain(i.direction);
        expect(i.justification.length).toBeGreaterThan(10);
        expect(i.source.publisher.length).toBeGreaterThan(2);
      }
    }
  });

  it("counts the 16 Agribalyse indicators, not the single score", () => {
    const env = rulesFile.categories.find((c) => c.id === "environnement")!;
    expect(env.indicators).toHaveLength(16);
    expect(env.indicators.map((i) => i.id)).not.toContain("ef_single_score");
  });

  it("never counts energy", () => {
    const nut = rulesFile.categories.find((c) => c.id === "nutrition")!;
    expect(nut.indicators.map((i) => i.id)).not.toContain("energy_eu_kcal");
  });

  it("cites a page or a quote for each nutrition source (pages opened)", () => {
    const nut = rulesFile.categories.find((c) => c.id === "nutrition")!;
    for (const i of nut.indicators) expect("quote" in i.source && i.source.url).toBeTruthy();
  });
});
