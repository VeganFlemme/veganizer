// Simple render test of each component of components/ui (docs/DESIGN.md § 3).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimalBetterBox } from "@/components/ui/AnimalBetterBox";
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
import { VariantSwitch } from "@/components/ui/VariantSwitch";
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
    expect(h).toMatch(/<h1[^>]*>.*Bœuf bourguignon<\/h1>/);
    expect(h).toContain("bg-plant-on-dark");
  });

  it("VariantSwitch: aria-pressed buttons, hidden with a single variant", () => {
    expect(html(<VariantSwitch value="maison" available={["maison", "commerce"]} onChange={noop} />)).toContain('aria-pressed="true"');
    expect(html(<VariantSwitch value="maison" available={["maison"]} onChange={noop} />)).toBe("");
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
    const h = html(<DataTable caption="Nutrition" unitLabel="Par portion" rows={[{ id: "p", name: "Protéines, g", animal: "48,6", vegetal: "35,4", note: "Avantage au plat animal" }]} />);
    expect(h).toContain("<table");
    expect(h).toContain('<th scope="row"');
    expect(h).toContain("Avantage au plat animal");
  });

  it("UnitSwitch: three units", () => {
    const h = html(<UnitSwitch value="per100kcal" onChange={noop} />);
    expect(h.match(/aria-pressed/g)).toHaveLength(3);
    expect(h).toContain("10 g prot.");
  });

  it("AnimalBetterBox: advice and sources, or nothing to report", () => {
    const h = html(
      <AnimalBetterBox items={[{ criterion: "vit_b12_ug", name: "Vitamine B12", partial: false, conseil: { id: "b12", criteria: [], titre: "B12", texte: "Complément.", sources: [{ sourceId: "anses", publisher: "ANSES", title: "t", url: "https://example.org", accessedOn: "2026-11-01" }] } }]} />,
    );
    expect(h).toContain("Vitamine B12.");
    expect(h).toContain("https://example.org");
    expect(html(<AnimalBetterBox items={[]} />)).toContain("ne fait mieux sur aucun point");
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
    const amount = (v: number): Amount => ({ perServing: v, lowPerServing: v, highPerServing: v, per100kcal: null, per10gProtein: null, massCoverage: 1, worstDqr: null, sourceIds: [] });
    const t = (co2: number): DishTotals => ({ totalGrams: 400, servings: 1, kcalPerServing: null, proteinPerServing: null, nutrients: {}, impacts: { ghg_100y_kgco2e: amount(co2) }, animalImpacts: {} });
    const h = html(<Simulator sim={{ animal: t(5), vegetal: t(1) }} dishName="A" plantName="V" factors={[]} rules={[]} animalsCounted={false} />);
    expect(h).toContain("1×/mois");
    expect(h).toContain("10 ans");
    expect(h).toContain(">208,00<"); // (5 − 1) × 52 servings, kg CO2e with 2 decimals
    expect(h).toContain("donnée manquante");
  });

  it("Simulator: animals spared written as a low estimate", () => {
    const amount = (v: number): Amount => ({ perServing: v, lowPerServing: v, highPerServing: v, per100kcal: null, per10gProtein: null, massCoverage: 1, worstDqr: null, sourceIds: [] });
    const t = (co2: number, animals: number): DishTotals => ({ totalGrams: 400, servings: 1, kcalPerServing: null, proteinPerServing: null, nutrients: {}, impacts: { ghg_100y_kgco2e: amount(co2) }, animalImpacts: { animals_killed_land: amount(animals) } });
    const h = html(<Simulator sim={{ animal: t(5, 0.000593), vegetal: t(1, 0) }} dishName="A" plantName="V" factors={[]} rules={[]} animalsCounted />);
    expect(h).toContain("au moins 0,03"); // 0.000593 × 52 = 0.0308
    expect(h).toContain("animal épargné");
    expect(h).not.toContain("abattages");
  });
});
