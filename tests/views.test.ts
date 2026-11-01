// Version selector texts (suite V1, S24d: « Version de base / Version complétée »). Fixture values are invented.
import { describe, expect, it } from "vitest";
import { additionLine, boostLine, co2Summary, completedSentence, ingredientsText, isVersionId, NUTRIENT_REASON, outsideLine } from "@/lib/compare/views";

const nb = (s: string | null) => (s ?? "").replace(/[  ]/g, " ");

describe("versions", () => {
  it("accepts only the two versions (?vue=complete)", () => {
    expect(isVersionId("base")).toBe(true);
    expect(isVersionId("complete")).toBe(true);
    expect(isVersionId("proteines")).toBe(false);
    expect(isVersionId(null)).toBe(false);
  });
  it("gives both CO2e results", () => {
    expect(nb(co2Summary(87.2, 81.6))).toBe("CO₂e : −87 % par portion, −82 % une fois ajustée");
    expect(nb(co2Summary(87.2, null))).toBe("CO₂e : −87 % par portion");
    expect(co2Summary(null, null)).toBeNull();
  });
  it("says what changes once the plant version is completed", () => {
    expect(nb(completedSentence(82.4))).toBe("Même ajustée, la version végétale émet 82 % de CO₂e en moins.");
    expect(nb(completedSentence(-5))).toBe("Ajustée, la version végétale émet 5 % de CO₂e en plus.");
  });
});

describe("completed recipe lines", () => {
  it("marks each addition with its reason", () => {
    expect(nb(additionLine({ label: "graines de sésame", gramsPerServing: 2.3, nutrients: ["ca_mg", "zn_mg"] }))).toBe("2,3 g de graines de sésame par portion : ajouté pour le calcium et le zinc");
    expect(NUTRIENT_REASON.i_ug).toBe("l’iode");
  });
  it("marks the increased protein", () => {
    expect(nb(boostLine(212.4, 4))).toBe("+212 g pour la recette (+53 g par portion) : quantité augmentée pour autant de protéines");
  });
  it("lists what remains to cover outside this dish, without a dose", () => {
    expect(nb(outsideLine(["vit_b12_ug", "fa_epa_dha_g"]))).toBe(
      "À couvrir hors de ce plat : vitamine B12, oméga-3 EPA + DHA (complément ou aliment enrichi, sans dose ici : demande conseil à un professionnel de santé).",
    );
    expect(outsideLine([])).toBeNull();
  });
  it("writes the ingredient list to copy", () => {
    expect(ingredientsText("Bourguignon complété", 4, [{ label: "protéines de soja", grams: 822.5 }, { label: "graines de lin", grams: 40 }])).toBe(
      "Bourguignon complété (4 portions)\n- 823 g protéines de soja\n- 40 g graines de lin",
    );
  });
});

describe("alignRecipes", () => {
  it("puts the same food on the same line, replaced ingredients first", async () => {
    const { alignRecipes } = await import("@/lib/compare/align");
    const a = [{ code: "beef", grams: 500 }, { code: "wine", grams: 250 }, { code: "carrot", grams: 250 }];
    const v = [{ code: "pst", grams: 610 }, { code: "carrot", grams: 250 }, { code: "wine", grams: 250 }, { code: "tofu", grams: 80 }];
    const lines = alignRecipes(a, v);
    expect(lines.map((l) => [l.animal?.code ?? null, l.vegetal?.code ?? null, l.same])).toEqual([
      ["beef", "pst", false],
      [null, "tofu", false],
      ["wine", "wine", true],
      ["carrot", "carrot", true],
    ]);
  });
});
