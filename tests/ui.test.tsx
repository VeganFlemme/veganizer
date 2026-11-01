// Simple render test of each component of components/ui (docs/DESIGN.md § 3).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimalBetterBox, AnimalBetterSummary } from "@/components/ui/AnimalBetterBox";
import { CategoryBanner } from "@/components/ui/CategoryBanner";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { DataTable } from "@/components/ui/DataTable";
import { DishTitle } from "@/components/ui/DishTitle";
import { FaceToFaceBar } from "@/components/ui/FaceToFaceBar";
import { Logo } from "@/components/ui/Logo";
import { MedicalNote } from "@/components/ui/MedicalNote";
import { MissingValue } from "@/components/ui/MissingValue";
import { ScorePill } from "@/components/ui/ScorePill";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Simulator } from "@/components/ui/Simulator";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { TabBar } from "@/components/ui/TabBar";
import { UnitSwitch } from "@/components/ui/UnitSwitch";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { VerdictPanel } from "@/components/ui/VerdictPanel";
import { WinnerBadge } from "@/components/ui/WinnerBadge";
import type { CategoryScoreView, VerdictView } from "@/lib/compare/scores";
import type { Amount, DishTotals } from "@/lib/scoring";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const noop = () => {};

const score = (over: Partial<CategoryScoreView> = {}): CategoryScoreView => ({
  id: "environnement", label: "Environnement", short: "Environnement", animalPoints: 0, vegetalPoints: 1, compared: 1, total: 16,
  winner: "vegetal", provisional: true, indicators: [], sentence: "1 indicateur comparé sur 16.", summary: "Gaz à effet de serre.", ...over,
});

describe("components/ui", () => {
  it("Logo: split circle and lower-case word", () => {
    const h = html(<Logo />);
    expect(h).toContain("M13 1.04A13 13 0 0 0 13 26.96z");
    expect(h).toContain("#D9662B");
    expect(h).toContain(">veganizer<");
  });

  it("SiteHeader: skip link, search and 44 px icon buttons with labels", () => {
    const h = html(<SiteHeader />);
    expect(h).toContain("Aller au contenu");
    expect(h).toContain('role="search"');
    expect(h).toContain('aria-label="Rechercher un plat"');
    expect(h).toContain('aria-label="Partager cette page"');
    expect(h).toContain("h-11 w-11");
  });

  it("DishTitle: animal dish in h1, plant alternative below", () => {
    const h = html(<DishTitle animal="Bœuf bourguignon" vegetal="Bourguignon de tempeh" />);
    expect(h).toMatch(/<h1[^>]*>.*Bœuf bourguignon<\/span><\/h1>/);
    expect(h).toContain("bg-plant-on-dark");
  });

  it("DishTitle: a long name is smaller on large screens, balanced, dot on the first line", () => {
    const h = html(<DishTitle animal="Poulet, cuisse, viande et peau rôtie/cuite au four" vegetal="Seitan, préemballé" />);
    expect(h).toContain("md:text-[34px]");
    expect(h).toContain("[text-wrap:balance]");
    expect(h).toContain("items-start");
  });

  it("ChipGroup: aria-pressed buttons as wide as their text", () => {
    const h = html(<ChipGroup tone="dark" label="Alternative" options={[{ id: "a", label: "Fait maison" }, { id: "b", label: "Du commerce" }]} value="a" onChange={noop} />);
    expect(h).toContain('aria-pressed="true"');
    expect(h).toContain("whitespace-nowrap");
    expect(h).not.toContain("flex-1");
  });

  it("TabBar: tablist, tabs with aria-selected and roving tabindex", () => {
    const h = html(<TabBar base="p" label="Impacts" tabs={[{ id: "a", label: "Vue d’ensemble" }, { id: "b", label: "Nutrition" }]} active="b" onChange={noop} />);
    expect(h).toContain('role="tablist"');
    expect(h).toMatch(/aria-selected="true"[^>]*aria-controls="p-panneau-b"[^>]*tabindex="0"/);
    expect(h).toContain('tabindex="-1"');
    expect(h).toContain("sticky top-0");
  });

  it("WinnerBadge: label and 'provisoire'", () => {
    expect(html(<WinnerBadge winner="vegetal" provisional />)).toContain("Version végétale, provisoire");
    expect(html(<WinnerBadge winner="insuffisant" provisional />)).toContain("Données insuffisantes<");
  });

  it("ScorePill: accessible label", () => {
    expect(html(<ScorePill animal={1} vegetal={3} />)).toContain('aria-label="Indicateurs gagnés : plat animal 1, version végétale 3"');
  });

  it("VerdictPanel: X sur 5, segments and method", () => {
    const verdict: VerdictView = {
      vegetalWins: 4, animalWins: 1, total: 5, sentence: "catégories gagnées par la version végétale.",
      categories: [score({ id: "nutrition", winner: "animal", short: "Nutrition" }), score(), score(), score(), score({ winner: "insuffisant" })],
    };
    const h = html(<VerdictPanel verdict={verdict} />);
    expect(h).toContain("4 sur 5");
    expect(h).toContain("bg-animal");
    expect(h).toContain("bg-line");
    expect(h).toContain("Une donnée manquante n’est jamais comptée");
  });

  it("CategoryCard: whole card is a button with the winner and the basis", () => {
    const h = html(<CategoryCard score={score()} title="Environnement" onOpen={noop} />);
    expect(h).toMatch(/^<button/);
    expect(h).toContain("Version végétale, provisoire");
    expect(h).toContain("Gaz à effet de serre.");
  });

  it("CategoryBanner: winner of the tab and the sentence it rests on", () => {
    const h = html(<CategoryBanner score={score()} />);
    expect(h).toContain("Vainqueur en environnement");
    expect(h).toContain("1 indicateur comparé sur 16.");
  });

  it("FaceToFaceBar: values at the ends, no bar for a missing value", () => {
    const h = html(<FaceToFaceBar rows={[{ id: "co2", label: "CO₂e", animal: 5, vegetal: null, format: (x) => `${x} kg` }]} />);
    expect(h).toContain("5 kg");
    expect(h).toContain("donnée manquante");
    expect(h).toContain("width:0%");
  });

  it("DataTable: real table with a caption and header dots", () => {
    const h = html(<DataTable caption="Nutrition" unitLabel="Par portion" rows={[{ id: "p", name: "Protéines, g", animal: "48,6", vegetal: "35,4", note: "Données partielles" }]} />);
    expect(h).toContain("<table");
    expect(h).toContain('<th scope="row"');
    expect(h).toContain("Données partielles");
  });

  it("DataTable: the better value of an established verdict in bold with ✓, on either side; the direction under the name (step 4, point 0)", () => {
    const rows = [
      { id: "p", name: "Protéines, g", animal: "48,6", vegetal: "35,4", winner: "animal" as const, direction: "up" as const },
      { id: "s", name: "Sel, g", animal: "2,1", vegetal: "1,2", winner: "vegetal" as const, direction: "down" as const },
      { id: "e", name: "Énergie, kcal", animal: "483", vegetal: "474", winner: null, direction: "none" as const },
    ];
    const h = html(<DataTable caption="Nutrition" unitLabel="Par portion" rows={rows} />);
    expect((h.match(/✓/g) ?? []).length).toBe(2);
    expect(h).toMatch(/✓[^<]*<\/span>48,6/);
    expect(h).toMatch(/✓[^<]*<\/span>1,2/);
    expect(h).toContain("↑ plus = mieux");
    expect(h).toContain("↓ moins = mieux");
    expect(h).not.toContain("Avantage au plat animal");
  });

  it("UnitSwitch: per serving and per 100 g only", () => {
    const h = html(<UnitSwitch value="per100g" onChange={noop} />);
    expect(h.match(/aria-pressed/g)).toHaveLength(2);
    expect(h).toContain("100 g");
    expect(h).not.toContain("kcal");
  });

  it("AnimalBetterBox: advice and sources, or nothing to report", () => {
    const h = html(
      <AnimalBetterBox items={[{ criterion: "vit_b12_ug", name: "Vitamine B12", partial: false, category: "nutrition", conseil: { id: "b12", criteria: [], titre: "B12", texte: "Complément.", sources: [{ sourceId: "anses", publisher: "ANSES", title: "t", url: "https://example.org", accessedOn: "2026-11-01" }] } }]} />,
    );
    expect(h).toContain("Vitamine B12.");
    expect(h).toContain("https://example.org");
    expect(html(<AnimalBetterBox items={[]} />)).toBe(""); // nothing to report: no box, no sentence
  });

  it("AnimalBetterSummary: grouped by category, nothing when empty", () => {
    const item = (criterion: string, category: "nutrition" | "economie") => ({ criterion, name: criterion, partial: false, category, conseil: null });
    const h = html(<AnimalBetterSummary items={[item("price_eur", "economie"), item("vit_b12_ug", "nutrition")]} />);
    expect(h.indexOf("En nutrition")).toBeLessThan(h.indexOf("En économie"));
    expect(h).toContain("Ce qui reste à couvrir");
    expect(h).not.toContain("fait mieux");
    expect(html(<AnimalBetterSummary items={[]} />)).toBe("");
  });

  it("« Ce qui reste à couvrir »: both values, « moins = mieux » apart with its main ingredients, never « Pas encore de conseil sourcé »", () => {
    const side = (value: number) => ({ value, low: value, high: value, rangePublished: false, censored: false, coverage: 1, dqr: null });
    const h = html(
      <AnimalBetterBox
        items={[
          { criterion: "zn_mg", name: "Zinc", partial: false, category: "nutrition", conseil: null, animal: side(12.7), vegetal: side(5.3), unit: "mg", direction: "up" },
          { criterion: "sugars_g", name: "dont sucres", partial: false, category: "nutrition", conseil: null, animal: side(5.5), vegetal: side(11.1), unit: "g", direction: "down", contributors: ["carottes", "vin rouge"] },
        ]}
      />,
    );
    expect(h).toContain("Plat animal : 12,7\u00a0mg par portion ; version végétale : 5,3\u00a0mg.");
    expect(h).toContain("À surveiller (moins = mieux)");
    expect(h).toContain("Surtout : carottes et vin rouge.");
    expect(h.indexOf("Zinc")).toBeLessThan(h.indexOf("À surveiller"));
    expect(h).not.toContain("Pas encore de conseil");
  });

  it("MissingValue and MedicalNote", () => {
    expect(html(<MissingValue />)).toContain("donnée manquante");
    expect(html(<MedicalNote />)).toContain("pas un conseil médical");
  });

  it("SourcesFooter: sources with licence and the three links", () => {
    const h = html(<SourcesFooter sources={[{ id: "ciqual-2025", name: "Ciqual", publisher: "ANSES", version: "2025", license: "Licence Ouverte 2.0", commercial_use: true, url: null }]} dataHref="/x.json" />);
    expect(h).toContain("Ciqual 2025");
    expect(h).toContain("Méthodologie");
    expect(h).toContain("Signaler une erreur");
    expect(h).toContain("Télécharger les données");
  });

  it("Simulator: frequency and duration, missing data written out", () => {
    const amount = (v: number): Amount => ({ perServing: v, lowPerServing: v, highPerServing: v, per100g: null, massCoverage: 1, worstDqr: null, sourceIds: [] });
    const t = (co2: number): DishTotals => ({ totalGrams: 400, servings: 1, kcalPerServing: null, proteinPerServing: null, nutrients: {}, impacts: { ghg_100y_kgco2e: amount(co2) }, animalImpacts: {} });
    const h = html(<Simulator sim={{ animal: t(5), vegetal: t(1) }} dishName="A" plantName="V" factors={[]} rules={[]} animalsCounted={false} />);
    expect(h).toContain("1×/mois");
    expect(h).toContain("10 ans");
    expect(h).toContain(">208,00<"); // (5 − 1) × 52 servings, kg CO2e with 2 decimals
    expect(h).toContain("donnée manquante");
  });

  it("Simulator: animals spared written as a low estimate", () => {
    const amount = (v: number): Amount => ({ perServing: v, lowPerServing: v, highPerServing: v, per100g: null, massCoverage: 1, worstDqr: null, sourceIds: [] });
    const t = (co2: number, animals: number): DishTotals => ({ totalGrams: 400, servings: 1, kcalPerServing: null, proteinPerServing: null, nutrients: {}, impacts: { ghg_100y_kgco2e: amount(co2) }, animalImpacts: { animals_killed_land: amount(animals) } });
    const h = html(<Simulator sim={{ animal: t(5, 0.000593), vegetal: t(1, 0) }} dishName="A" plantName="V" factors={[]} rules={[]} animalsCounted />);
    expect(h).toContain("au moins 0,03"); // 0.000593 × 52 = 0.0308
    expect(h).toContain("animal épargné");
    expect(h).not.toContain("abattages");
  });
});
