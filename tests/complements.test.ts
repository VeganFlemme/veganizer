// « Avec compléments » (suite V1, S24): smallest additions from a whitelist that close the gaps.
// FICTITIOUS nutrient values.
import { describe, expect, it } from "vitest";
import { solveComplements, solveLinearProgram, type ComplementFood } from "@/lib/scoring";

const SESAME: ComplementFood = { code: "SES", maxGrams: 10, weight: 1, per100g: { ca_mg: 960, fe_mg: 14, fiber_g: 12 } };
const SOY: ComplementFood = { code: "SOY", maxGrams: 250, weight: 10, per100g: { ca_mg: 98, vit_d_ug: 1.2 } };
const FLAX: ComplementFood = { code: "FLAX", maxGrams: 10, weight: 1, per100g: { ala_g: 20, fiber_g: 25 } };
const SALT: ComplementFood = { code: "SALT", maxGrams: 1, weight: 10, per100g: { i_ug: 1860 } };

describe("solveLinearProgram", () => {
  it("minimises c·x under ≥ and ≤ constraints with bounds", () => {
    // min x + y, x + y ≥ 3, x ≤ 2, y ≤ 2
    const r = solveLinearProgram([1, 1], [{ coef: [1, 1], op: ">=", rhs: 3 }], [2, 2])!;
    expect(r.x[0] + r.x[1]).toBeCloseTo(3);
  });
  it("returns null when infeasible", () => {
    expect(solveLinearProgram([1], [{ coef: [1], op: ">=", rhs: 5 }], [2])).toBeNull();
  });
});

describe("solveComplements", () => {
  it("returns nothing when there is no gap", () => {
    expect(solveComplements({}, [SESAME, SOY])).toEqual({ additions: [], closed: [], open: [] });
  });

  it("closes a gap with the smallest additions, everyday foods before fortified ones", () => {
    const r = solveComplements({ ca_mg: 100 }, [SESAME, SOY]);
    expect(r.closed).toEqual(["ca_mg"]);
    const ses = r.additions.find((a) => a.code === "SES")!;
    const soy = r.additions.find((a) => a.code === "SOY")!;
    expect(ses.grams).toBe(10); // the everyday food first, up to its maximum
    expect(soy.grams).toBe(4.1); // then the fortified one, rounded up to 0.1 g (4 mg ÷ 0.98 mg/g)
    expect((ses.grams * 960 + soy.grams * 98) / 100).toBeGreaterThanOrEqual(100);
  });

  it("solves all the gaps together: one addition can close several", () => {
    const r = solveComplements({ ala_g: 1, fiber_g: 1 }, [FLAX, SESAME]);
    expect(r.additions).toEqual([{ code: "FLAX", grams: 5, nutrients: ["ala_g", "fiber_g"] }]);
    expect(r.closed.sort()).toEqual(["ala_g", "fiber_g"]);
  });

  it("leaves a gap no whitelisted food can close open (advice only, nothing added for it)", () => {
    const r = solveComplements({ vit_b12_ug: 1, ca_mg: 50 }, [SESAME, SOY]);
    expect(r.open).toEqual(["vit_b12_ug"]);
    expect(r.closed).toEqual(["ca_mg"]);
  });

  it("never goes above an upper safety limit (total of the serving)", () => {
    const r = solveComplements({ i_ug: 50 }, [SALT], { limits: { i_ug: 600 }, base: { i_ug: 590 } });
    expect(r.additions).toEqual([]);
    expect(r.open).toEqual(["i_ug"]);
    const ok = solveComplements({ i_ug: 5 }, [SALT], { limits: { i_ug: 600 }, base: { i_ug: 590 } });
    expect(ok.closed).toEqual(["i_ug"]);
  });
});
