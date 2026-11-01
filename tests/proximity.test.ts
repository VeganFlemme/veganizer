// Choice of the plant protein by the visitor (suite V1, step 3 ter, decision of Matt 17 h 25):
// candidates ranked by proximity, from the data only. FICTITIOUS nutrient values.
import { describe, expect, it } from "vitest";
import { proteinFamily, rankCandidates, type ProteinCandidate } from "@/lib/scoring";

const BEEF = { protein: 28, fat: 10, energy: 200 };
const c = (code: string, protein: number | null, fat: number | null = 5, energy: number | null = 150, name = code): ProteinCandidate => ({ code, name, protein, fat, energy });

describe("rankCandidates", () => {
  it("ranks by closest protein per 100 g first", () => {
    const r = rankCandidates(BEEF, [c("LENTIL", 9), c("SEITAN", 25), c("TOFU", 13)]);
    expect(r.map((x) => x.code)).toEqual(["SEITAN", "TOFU", "LENTIL"]);
  });

  it("breaks a protein tie (same whole gram of gap) by lipids, then energy", () => {
    const r = rankCandidates(BEEF, [c("A", 20.2, 1, 150), c("B", 19.9, 9, 150), c("C", 20.1, 9, 199)]);
    // all 8 g away from 28 g once rounded; B and C are 1 g away in lipids, A 9 g; C closer in energy
    expect(r.map((x) => x.code)).toEqual(["C", "B", "A"]);
  });

  it("never uses CO2e, price or score: only protein, lipids and energy are read", () => {
    const withExtra = [{ ...c("X", 10), co2: 0.1, price: 1 }, { ...c("Y", 27), co2: 9, price: 30 }] as unknown as ProteinCandidate[];
    expect(rankCandidates(BEEF, withExtra)[0].code).toBe("Y");
  });

  it("puts a candidate with unknown protein last (never counted as 0)", () => {
    const r = rankCandidates(BEEF, [c("UNKNOWN", null), c("LOW", 2)]);
    expect(r.map((x) => x.code)).toEqual(["LOW", "UNKNOWN"]);
    expect(r[1].reason).toMatch(/protéines : donnée manquante/);
  });

  it("gives the reason of the rank in words", () => {
    const r = rankCandidates({ ...BEEF, name: "bœuf" }, [c("SEITAN", 25), c("TOFU", 13)]);
    expect(r[0].reason).toBe("la plus proche en protéines : 25 g pour 100 g (bœuf : 28 g)");
    expect(r[1].reason).toBe("13 g de protéines pour 100 g (bœuf : 28 g)");
    expect(r.map((x) => x.rank)).toEqual([1, 2]);
  });

  it("is stable: equal candidates keep the order of their codes", () => {
    const r = rankCandidates(BEEF, [c("B2", 20), c("A1", 20)]);
    expect(r.map((x) => x.code)).toEqual(["A1", "B2"]);
  });
});

describe("proteinFamily", () => {
  it("groups the candidates by family from their names and Ciqual subgroup", () => {
    expect(proteinFamily({ name: "Tofu nature", subgroup: "plats composés" })).toBe("soja");
    expect(proteinFamily({ name: "Protéines de soja texturées, réhydratées", subgroup: null })).toBe("soja");
    expect(proteinFamily({ name: "Seitan, préemballé", subgroup: null })).toBe("blé");
    expect(proteinFamily({ name: "Lentille verte, bouillie/cuite à l'eau", subgroup: "légumineuses" })).toBe("légumineuses");
    expect(proteinFamily({ name: "Galette de céréales aux légumes", subgroup: "plats végétariens" })).toBe("autres");
  });
});

describe("proteinFamily: wheat named « blé »", () => {
  it("recognises « blé » followed by a space (accented word boundary)", () => {
    expect(proteinFamily({ name: "Nuggets de blé panés", subgroup: null })).toBe("blé");
    expect(proteinFamily({ name: "Emblé", subgroup: null })).toBe("autres");
  });
});
