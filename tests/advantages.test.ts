// « Là où le plat animal fait mieux » by category (suite V1, step 1, point 4).
import { describe, expect, it } from "vitest";
import { advantagesByCategory, animalBetterTitle, categoryOf } from "@/lib/compare/config";
import type { AdvantageView } from "@/lib/compare/view";

const adv = (criterion: string, category: AdvantageView["category"]): AdvantageView => ({ criterion, name: criterion, partial: false, conseil: null, category });

describe("categoryOf", () => {
  it("reads the category of an indicator from data/score_rules.json", () => {
    expect(categoryOf("vit_b12_ug")).toBe("nutrition");
    expect(categoryOf("fa_epa_dha_g")).toBe("nutrition");
    expect(categoryOf("land_use_pt")).toBe("environnement");
    expect(categoryOf("life_days_farmed")).toBe("animaux");
    expect(categoryOf("price_eur")).toBe("economie");
    expect(categoryOf("iarc_2a_g")).toBe("sante");
    expect(categoryOf("energy_eu_kcal")).toBeNull();
  });
});

describe("advantagesByCategory and titles", () => {
  it("groups in the order of the tabs and drops empty categories", () => {
    const g = advantagesByCategory([adv("price_eur", "economie"), adv("vit_b12_ug", "nutrition"), adv("ca_mg", "nutrition")]);
    expect(g.map((x) => x.category)).toEqual(["nutrition", "economie"]);
    expect(g[0].items.map((x) => x.criterion)).toEqual(["vit_b12_ug", "ca_mg"]);
  });
  it("names the category in the title", () => {
    expect(animalBetterTitle("nutrition")).toBe("Là où le plat animal fait mieux en nutrition");
    expect(animalBetterTitle("environnement")).toBe("Là où le plat animal fait mieux en environnement");
    expect(animalBetterTitle("animaux")).toBe("Là où le plat animal fait mieux en protection animale");
    expect(animalBetterTitle("nutrition", "l’aliment d’origine")).toBe("Là où l’aliment d’origine fait mieux en nutrition");
  });
});
