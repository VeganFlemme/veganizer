"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import sante from "@/data/sante.json";
import { AnimalBetterBox, AnimalBetterSummary, REMAINING_TITLE } from "@/components/ui/AnimalBetterBox";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ProteinPicker } from "@/components/ui/ProteinPicker";
import { DirectionHint, WinnerValue } from "@/components/ui/RowWinner";
import { displayName } from "@/lib/compare/food";
import { CategoryBanner } from "@/components/ui/CategoryBanner";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { DataTable, type DataTableRow } from "@/components/ui/DataTable";
import { CategoryNav } from "@/components/ui/CategoryNav";
import { DishTitle } from "@/components/ui/DishTitle";
import { Dot } from "@/components/ui/Dot";
import { FaceToFaceBar, type FaceToFaceRow } from "@/components/ui/FaceToFaceBar";
import { MedicalNote } from "@/components/ui/MedicalNote";
import { MissingValue } from "@/components/ui/MissingValue";
import { MiniBars } from "@/components/ui/MiniBars";
import { Simulator } from "@/components/ui/Simulator";
import { panelId, TabBar, tabId, type TabDef } from "@/components/ui/TabBar";
import { UNIT_OPTIONS, UnitSwitch } from "@/components/ui/UnitSwitch";
import { VerdictPanel } from "@/components/ui/VerdictPanel";
import { animalBetterTitle, CLIMATE_MAIN, COVERAGE_WARNING } from "@/lib/compare/config";
import { alignRecipes } from "@/lib/compare/align";
import { NUTRIENT_REASON } from "@/lib/compare/views";
import { additionLine, adjustSummary, boostLine, boostReason, co2Summary, ingredientsText, openLine, scaleLine } from "@/lib/compare/views";
import type { AdjustRequest } from "@/lib/scoring";
import type { CategoryId, CategoryScoreView } from "@/lib/compare/scores";
import type { CompletedVariantView, CriterionRow, DishView, IngredientPrice, PairPageModel, PriceSide, SideValue, VariantView } from "@/lib/compare/view";
import type { Basis } from "@/lib/scoring";
import { formatEur, formatForUnit, formatInt, formatPerServing, formatPercent, formatValue, MISSING, NBSP, signedGap } from "@/lib/format";
import { useQueryParam } from "./useQueryParam";

type TabIdT = "apercu" | CategoryId;
export const TABS: TabDef<TabIdT>[] = [
  { id: "apercu", label: "Vue d’ensemble" },
  { id: "nutrition", label: "Nutrition" },
  { id: "sante", label: "Santé" },
  { id: "environnement", label: "Environnement" },
  { id: "animaux", label: "Protection animale" },
  { id: "economie", label: "Économie" },
];
const isTab = (x: string | null): x is TabIdT => TABS.some((t) => t.id === x);

// Citation required by the CC BY 4.0 licence of the pain estimates.
const WELFARE_CITATION = "Welfare Footprint Institute — Schuck-Paim & Alonso, CC BY 4.0";
const ANIMALS = "animals_killed_land";

const find = (rows: CriterionRow[], id: string) => rows.find((r) => r.id === id);
const unitOf = (r: CriterionRow) => (r.unit ? `, ${r.unit}` : "");
const pct = (x: number) => formatPercent(x * 100);

/** "Au moins 1 animal tué pour N portions (estimation basse)" — imposed wording (DESIGN.md). */
export function animalsSentence(perServing: number | null): string | null {
  if (perServing == null || !(perServing > 0)) return null;
  return `Au moins 1 animal tué pour ${formatInt(1 / perServing)} portions (estimation basse)`;
}

const CO2_UNIT = "kg CO2e";
const kg = (x: number) => `${formatForUnit(x, CO2_UNIT)}${NBSP}kg`;

function Cell({ v, unit, range = true, servings = false, compact = false }: { v: SideValue | null; unit: string; range?: boolean; servings?: boolean; compact?: boolean }) {
  const fmt = (x: number | null) => (servings ? formatPerServing(x, unit) : formatForUnit(x, unit));
  // « 0,593 pour 1 000 portions »: the number never wraps, the wording may.
  const show = (x: number | null) => {
    const t = fmt(x);
    const k = t.indexOf(" pour ");
    return k < 0 ? (
      <span className="whitespace-nowrap">{t}</span>
    ) : (
      <>
        <span className="whitespace-nowrap">{t.slice(0, k)}</span> <span className="block text-[12px] text-ink-2">{t.slice(k + 1)}</span>
      </>
    );
  };
  if (!v) return <MissingValue />;
  // Only a range is known when an ingredient is published « < x » by Ciqual (never x/2, never 0).
  // Bounds equal once rounded: one value, no « fourchette » (review of 2026-11-01).
  const same = v.low != null && v.high != null && fmt(v.low) === fmt(v.high);
  if (v.value == null) {
    if (v.low == null || v.high == null) return <MissingValue />;
    if (same) return <span className="whitespace-nowrap">{fmt(v.low)}</span>;
    // Compact tables (three bases side by side): « 14,9–15,5 » on one line.
    if (compact)
      return (
        <span title="fourchette">
          <span className="whitespace-nowrap">{fmt(v.low)}–</span>
          <wbr />
          <span className="whitespace-nowrap">{fmt(v.high)}</span>
        </span>
      );
    return (
      <>
        <span className="whitespace-nowrap">{fmt(v.low)}</span> <span className="whitespace-nowrap">à {fmt(v.high)}</span>
        <span className="block text-[12px] text-ink-3">fourchette</span>
      </>
    );
  }
  return (
    <>
      {show(v.value)}
      {range && !compact && v.rangePublished && !same && fmt(v.low) + fmt(v.high) !== fmt(v.value) + fmt(v.value) && (
        <span className="block text-[12px] text-ink-3">
          {/* Numbers only: the « pour 1 000 portions » wording is already on the value line. */}
          <span className="whitespace-nowrap">{fmt(v.low).split(" pour ")[0]} à</span> <span className="whitespace-nowrap">{fmt(v.high).split(" pour ")[0]}</span>
        </span>
      )}
    </>
  );
}

/** Note under a table row: partial data, advantage to the animal dish (rule 3), negative values. */
function rowNote(r: CriterionRow): ReactNode {
  const notes: string[] = [];
  // Step 3 quinquies: reached by an adjustment of the plant version, not scored.
  if (r.filled) notes.push("Comblé par l’ajustement, non compté dans le score");
  const known = (s: SideValue | null) => !!s && (s.value != null || s.low != null);
  const partial = (s: SideValue | null) => known(s) && s!.coverage < COVERAGE_WARNING;
  const coverage = `${r.animal ? pct(r.animal.coverage) : MISSING} et ${r.vegetal ? pct(r.vegetal.coverage) : MISSING} de la masse`;
  if (partial(r.animal) || partial(r.vegetal)) {
    // Identical ingredients on both sides cancel out: the verdict may rest on what differs only.
    if (r.direction !== "none" && !r.verdictPartial) notes.push(`Données connues pour ${coverage} ; verdict établi sur les ingrédients qui diffèrent`);
    else notes.push(`Données partielles : ${coverage}${r.direction === "none" ? "" : ", pas de verdict"}`);
  }
  if (r.winner === "egal" && (r.animal?.rangePublished || r.vegetal?.rangePublished)) notes.push("Fourchettes qui se chevauchent : égalité");
  if ((r.animal?.value ?? 0) < 0 || (r.vegetal?.value ?? 0) < 0) notes.push("Valeur négative publiée telle quelle");
  return notes.length ? notes.join(". ") : undefined;
}

/** Table rows; `servings`: values are per serving (small animal counts « pour 1 000 portions »). */
const SOURCE_LABEL: Record<string, string> = {
  "ciqual-2025": "Ciqual 2025",
  "agribalyse-3.2": "Agribalyse 3.2",
  "faostat-qcl": "FAOSTAT",
  "agreste-saa": "Agreste",
  "welfare-footprint": "Welfare Footprint",
  "fao-tcf": "FAO",
  "mood-2023-farmed": "Mood et al. 2023",
  "mood-2024-wild": "Mood et al. 2024",
  "agri-bien-etre-porcs": "Min. de l’Agriculture",
  "agri-bien-etre-poules": "Min. de l’Agriculture",
  "label-rouge-la-07-85": "Label rouge LA 07/85",
  "label-rouge-la-13-97": "Label rouge LA 13/97",
};
const sourceLabel = (id: string) => SOURCE_LABEL[id] ?? id;

/** Reliability column: mass covered by the data on each side, worst Agribalyse DQR when published. */
function reliability(r: CriterionRow): string {
  const cov = (s: SideValue | null) => (s ? pct(s.coverage) : "—");
  const full = (r.animal?.coverage ?? 0) >= 1 && (r.vegetal?.coverage ?? 0) >= 1;
  const parts = full ? [] : [`${cov(r.animal)} · ${cov(r.vegetal)}`];
  if (r.worstDqr != null) parts.push(`DQR ${formatValue(r.worstDqr)}`);
  return parts.join(" · ") || "données complètes";
}

export function tableRows(rows: CriterionRow[], servings = false): DataTableRow[] {
  return rows.map((r) => ({
    id: r.id,
    name: (
      <span title={r.sourceName !== r.name ? r.sourceName : undefined}>
        {r.name}
        {unitOf(r)}
      </span>
    ),
    animal: <Cell v={r.animal} unit={r.unit} servings={servings} />,
    vegetal: <Cell v={r.vegetal} unit={r.unit} servings={servings} />,
    note: rowNote(r),
    strong: r.direction !== "none",
    // Step 4, point 0: ✓ on the better value of an established verdict, either side.
    winner: r.direction !== "none" ? r.winner : null,
    direction: r.direction,
    gap: r.reductionPercent == null ? <MissingValue label="—" /> : signedGap(r.reductionPercent),
    bar: <MiniBars animal={r.animal?.value ?? r.animal?.high ?? null} vegetal={r.vegetal?.value ?? r.vegetal?.high ?? null} />,
    reliability: reliability(r),
    source: [...new Set(r.sourceIds.map(sourceLabel))].join(", ") || "—",
  }));
}

/** The chosen protein in the plant version (its label and grams for the recipe). */
function mainOf(v: VariantView, code: string) {
  return v.dish.ingredients.find((i) => i.code === code) ?? null;
}

/** Outcome of a scored indicator as the winner of a table row (✓), or none. */
function winnerOf(outcome: string | undefined): "animal" | "vegetal" | null {
  return outcome === "animal" || outcome === "vegetal" ? outcome : null;
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-panel bg-surface p-5 md:p-6 ${className}`}>
      {title && <h2 className="m-0 text-[16px] font-extrabold md:text-[19px]">{title}</h2>}
      {children}
    </section>
  );
}

function Legend() {
  return (
    <span className="flex flex-wrap gap-4 text-[13px] text-ink-2">
      <span className="inline-flex items-center gap-[6px]">
        <Dot series="animal" /> Plat animal
      </span>
      <span className="inline-flex items-center gap-[6px]">
        <Dot series="plant" /> Version végétale
      </span>
    </span>
  );
}

function Recipe({ dish, title, series }: { dish: DishView; title: string; series: "animal" | "plant" }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 flex items-center gap-2 text-[15px] font-extrabold">
        <Dot series={series} /> {title}
      </h3>
      <p className="m-0 text-[13px] text-ink-2">
        Pour {dish.servings} portion{dish.servings > 1 ? "s" : ""}, environ {formatInt(dish.gramsPerServing)}
        {NBSP}g par portion
      </p>
      <ul className="m-0 flex list-none flex-col p-0 text-[14px]">
        {dish.ingredients.map((i) => (
          <li key={i.code} className="flex gap-3 border-t border-line-soft py-[7px]">
            <span className="num w-[64px] flex-none text-right">
              {formatInt(i.grams)}
              {NBSP}g
            </span>
            <span>
              {i.label} <span className="text-[12px] text-ink-3" title={i.officialName ?? undefined}>(code {i.code})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Desktop: both recipes in one table, the same food on the same line, replacements highlighted. */
function AlignedRecipes({ animal, vegetal }: { animal: DishView; vegetal: DishView }) {
  const lines = alignRecipes(animal.ingredients, vegetal.ingredients, animal.servings, vegetal.servings);
  const cell = (i: DishView["ingredients"][number] | null, suffix: ReactNode = null) =>
    i ? (
      <span className="grid grid-cols-[64px_minmax(0,1fr)] items-baseline">
        <span className="num pr-3 text-right whitespace-nowrap">
          {formatInt(i.grams)}
          {NBSP}g
        </span>
        <span>
          <span title={`code Ciqual / Agribalyse ${i.code}`}>{i.label}</span>
          {suffix}
        </span>
      </span>
    ) : (
      <span className="text-ink-3">—</span>
    );
  const head = (d: DishView, series: "animal" | "plant") => (
    <th scope="col" className="w-1/2 pb-2 text-left align-bottom">
      <span className="flex items-center gap-2 text-[15px] font-extrabold">
        <Dot series={series} /> {d.name}
      </span>
      <span className="block text-[13px] font-normal text-ink-2">
        Pour {d.servings} portion{d.servings > 1 ? "s" : ""}, environ {formatInt(d.gramsPerServing)}
        {NBSP}g par portion
      </span>
    </th>
  );
  return (
    <table className="hidden w-full border-collapse text-[14px] lg:table">
      <caption className="sr-only">Recettes alignées ligne par ligne</caption>
      <thead>
        <tr>
          {head(animal, "animal")}
          {head(vegetal, "plant")}
        </tr>
      </thead>
      <tbody>
        {lines.map((l, k) => (
          <tr key={k} className={`border-t border-line-soft ${l.same ? "" : "bg-win-animal/40"}`}>
            <td className="py-[6px] pr-3">{cell(l.animal)}</td>
            <td className="py-[6px] pr-3">
              {cell(l.vegetal, !l.same && l.animal && l.vegetal ? <span className="ml-2 text-[12px] font-semibold text-animal-note">remplacé</span> : null)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const dateFr = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const period = (from: string | null, to: string | null) => (from && to ? `${dateFr.format(new Date(from))} à ${dateFr.format(new Date(to))}` : "période inconnue");

function IngredientPrices({ title, items, series }: { title: string; items: IngredientPrice[]; series: "animal" | "plant" }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="m-0 flex items-center gap-2 text-[14px] font-bold">
        <Dot series={series} /> {title}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((i) => (
          <li key={i.code}>
            {i.label} :{" "}
            {i.eurPerKg == null ? (
              <MissingValue />
            ) : (
              <>
                {formatEur(i.eurPerKg)}/kg ({i.place ?? i.sourceId}, {formatInt(i.observations)} {i.sourceId === "rnm" ? "moyennes mensuelles" : "relevés"}, {period(i.firstObservedOn, i.lastObservedOn)}
                {i.yieldPct != null && `, prix du produit cru ÷ rendement de cuisson ${formatInt(i.yieldPct)}${NBSP}% (USDA)`})
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Overview({ model, v, open, base, completed }: { model: PairPageModel; v: VariantView; open: (t: TabIdT) => void; base: string; completed?: CompletedVariantView }) {
  const cats = Object.fromEntries(v.scores.verdict.categories.map((c) => [c.id, c])) as Record<CategoryId, CategoryScoreView>;
  const rows = v.rows.perServing;
  const protein = find(rows, "protein_g");
  const energy = find(rows, "energy_eu_kcal");
  const co2 = find(rows, CLIMATE_MAIN);
  const animals = find(rows, ANIMALS);
  const cost = v.climateCost[0];
  const priceOk = v.price.animal && v.price.vegetal && v.price.animal.coverage >= COVERAGE_WARNING && v.price.vegetal.coverage >= COVERAGE_WARNING;
  const card = (id: CategoryId, title: string, children: ReactNode) => (
    <CategoryCard key={id} score={cats[id]} title={title} onOpen={() => open(id)} controls={panelId(base, id)}>
      {children}
    </CategoryCard>
  );
  const line = (label: string, value: ReactNode) => (
    <span className="flex justify-between gap-2 text-[14px]">
      <span className="font-semibold">{label}</span>
      <span className="num text-right">{value}</span>
    </span>
  );
  // Desktop (from 1 024 px): 3 or 4 main indicators of the category as face-to-face bars.
  const bar = (id: string, label: string): FaceToFaceRow | null => {
    const r = find(rows, id);
    if (!r) return null;
    const val = (x: SideValue | null) => x?.value ?? x?.high ?? null;
    return { id, label, aside: r.reductionPercent == null ? undefined : signedGap(r.reductionPercent), animal: val(r.animal), vegetal: val(r.vegetal), format: (x: number) => `${formatPerServing(x, r.unit)}${r.unit && !["animaux", "poissons"].includes(r.unit) ? `${NBSP}${r.unit.replace("CO2e", "CO₂e")}` : ""}` };
  };
  const bars = (list: (FaceToFaceRow | null)[]) => (
    <span className="hidden lg:block">
      <FaceToFaceBar dense thickness="sm" rows={list.filter((x): x is FaceToFaceRow => x != null)} valueWidth="64px" />
    </span>
  );
  const phone = (children: ReactNode) => <span className="lg:hidden">{children}</span>;
  const pair = (a: number | null | undefined, b: number | null | undefined, unit: string, f: (x: number) => string = (x) => formatForUnit(x, unit)) => (
    <>
      {a == null ? MISSING : f(a)} · {b == null ? MISSING : f(b)}
      {unit ? `${NBSP}${unit}` : ""}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <VerdictPanel verdict={v.scores.verdict} className="md:hidden" />
      <p className="m-0 mt-[6px] text-[15px] leading-normal text-ink-2 xl:hidden">Touche une catégorie pour voir toutes ses données.</p>
      <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] md:gap-[18px] xl:grid-cols-3 xl:gap-4">
        {card(
          "nutrition",
          "Nutrition",
          <>
            {phone(
              <span className="flex flex-col gap-[6px]">
                {line("Protéines", pair(protein?.animal?.value, protein?.vegetal?.value, "g"))}
                <FaceToFaceBar rows={[{ id: "p", label: "", animal: protein?.animal?.value ?? null, vegetal: protein?.vegetal?.value ?? null, format: () => "" }]} valueWidth="0px" />
                {line("Énergie", pair(energy?.animal?.value, energy?.vegetal?.value, "kcal", formatInt))}
              </span>,
            )}
            {bars([bar("protein_g", "Protéines"), bar("fiber_g", "Fibres"), bar("fe_mg", "Fer"), bar("ca_mg", "Calcium")])}
          </>,
        )}
        {card(
          "sante",
          "Santé",
          bars(
            v.iarc.map((x) => ({
              id: x.entry.id,
              label: `${x.entry.libelle} (groupe ${x.entry.groupe})`,
              animal: x.animalGrams,
              vegetal: x.vegetalGrams,
              format: (g: number) => `${formatInt(g)}${NBSP}g`,
            })),
          ),
        )}
        {card(
          "environnement",
          "Environnement",
          <>
          {bars([bar(CLIMATE_MAIN, "Gaz à effet de serre"), bar("land_use_pt", "Utilisation des sols"), bar("water_scarcity_m3", "Eau"), bar("eutro_marine_kgn", "Eutrophisation marine")])}
          {phone(
          <span className="flex flex-col gap-[6px]">
            <span className="flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-none tracking-[-0.04em]">{signedGap(co2?.reductionPercent ?? null)}</span>
              <span className="text-[15px] text-ink-2">de CO₂e par portion</span>
            </span>
            <FaceToFaceBar rows={[{ id: "co2", label: "", animal: co2?.animal?.value ?? null, vegetal: co2?.vegetal?.value ?? null, format: kg }]} />
          </span>,
          )}
          </>,
        )}
        {card(
          "animaux",
          "Protection animale",
          <span className="flex flex-col gap-1">
            <span className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] [text-wrap:balance] lg:text-[16px] lg:font-bold lg:tracking-normal">
              {animalsSentence(animals?.animal?.value ?? null) ?? <MissingValue label="Animaux tués : donnée manquante" />}
            </span>
            {bars([bar(ANIMALS, "Animaux tués"), bar("life_days_farmed", "Jours de vie en élevage"), bar("pain_hours_hurtful", "Heures de douleur pénible"), bar("fish_killed", "Poissons tués")])}
            <span className="text-[13px] text-ink-3">Version végétale : {animals?.vegetal?.value === 0 ? "aucun ingrédient animal identifié" : MISSING}. D’après FAOSTAT et Agreste.</span>
          </span>,
        )}
        {card(
          "economie",
          "Économie",
          <>
            {phone(
              <span className="flex flex-col gap-[6px]">
                {line(`Coût climat pour la société (${cost?.year ?? ""})`, pair(cost?.animalEur, cost?.vegetalEur, "", formatEur))}
                {line("Prix en magasin", priceOk ? pair(v.price.animal?.value, v.price.vegetal?.value, "", formatEur) : <MissingValue />)}
              </span>,
            )}
            {bars([
              { id: "cost", label: `Coût climat (valeur ${cost?.year ?? ""})`, animal: cost?.animalEur ?? null, vegetal: cost?.vegetalEur ?? null, format: (x: number) => formatEur(x) },
              { id: "price", label: "Prix en magasin", animal: priceOk ? (v.price.animal?.value ?? null) : null, vegetal: priceOk ? (v.price.vegetal?.value ?? null) : null, format: (x: number) => formatEur(x) },
            ])}
          </>,
        )}
        <Simulator
          sim={v.sim}
          dishName={model.animal.name}
          plantName={v.dish.name}
          factors={model.monetizationFactors}
          rules={model.monetizationRules}
          animalsCounted={animals?.animal != null}
        />
      </div>
      <AnimalBetterSummary items={completed ? v.animalBetter.filter((x) => x.category !== "nutrition") : v.animalBetter} collapsible per={model.animal.servings === 1 ? "pour 100 g" : "par portion"} />
      <Panel title="Les recettes comparées" className="mt-3">
        {v.rationale && (
          <p className="m-0 text-[14px] leading-normal text-ink-2">
            <strong className="text-ink">Pourquoi c’est comparable :</strong> {v.rationale}
          </p>
        )}
        {completed ? (
          <CompletedRecipe c={completed} animal={model.animal} />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:hidden">
              <Recipe dish={model.animal} title={model.animal.name} series="animal" />
              <Recipe dish={v.dish} title={v.dish.name} series="plant" />
            </div>
            <AlignedRecipes animal={model.animal} vegetal={v.dish} />
          </>
        )}
      </Panel>
    </div>
  );
}

/**
 * Desktop (from 1 280 px): the three bases side by side, one table (review of 2026-11-01).
 * Each basis has its own animal / plant columns; the score follows the serving.
 */
function ThreeBasisTable({ v, ids, caption }: { v: VariantView; ids: string[]; caption: string }) {
  const by = (b: Basis) => new Map(v.rows[b].map((r) => [r.id, r]));
  const maps = BASIS_ORDER.map((b) => by(b));
  return (
    <table className="w-full table-fixed border-collapse text-[13px] [&_.missing]:text-[12px]">
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        <col className="w-[22%]" />
        {BASIS_ORDER.map((b) => (
          <Fragment key={b}>
            <col />
            <col />
          </Fragment>
        ))}
        <col className="hidden w-[140px] min-[1440px]:table-column" />
      </colgroup>
      <thead>
        <tr className="text-[12px] font-bold text-ink-2">
          <th scope="col" className="pb-1 text-left font-bold" rowSpan={2}>
            Nutriment
          </th>
          {BASIS_ORDER.map((b) => (
            <th key={b} scope="colgroup" colSpan={2} className="border-l border-line-soft pb-1 pl-3 text-center font-bold">
              {UNIT_OPTIONS.find((u) => u.id === b)!.long}
            </th>
          ))}
          <th scope="col" className="hidden pb-1 pl-3 text-left font-bold min-[1440px]:table-cell" rowSpan={2}>
            Fiabilité
          </th>
        </tr>
        <tr className="border-b border-line text-[12px] font-bold text-ink-2">
          {BASIS_ORDER.map((b) => (
            <Fragment key={b}>
              <th scope="col" className="border-l border-line-soft py-1 pl-3 text-right font-bold">
                <span className="inline-flex items-center gap-[5px]">
                  <Dot series="animal" /> Animal
                </span>
              </th>
              <th scope="col" className="py-1 pl-2 text-right font-bold">
                <span className="inline-flex items-center gap-[5px]">
                  <Dot series="plant" /> Végétal
                </span>
              </th>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {ids.map((id) => {
          const r0 = maps[0].get(id);
          if (!r0) return null;
          return (
            <tr key={id} className="border-b border-line-soft align-top">
              <th scope="row" className="py-[6px] pr-2 text-left font-normal">
                <span className={r0.direction !== "none" ? "font-semibold" : ""} title={r0.sourceName !== r0.name ? r0.sourceName : undefined}>
                  {r0.name}
                  {unitOf(r0)}
                </span>
                <DirectionHint direction={r0.direction} />
                {rowNote(r0) && <span className="mt-[2px] block text-[12px] leading-snug text-animal-note">{rowNote(r0)}</span>}
              </th>
              {maps.map((m, i) => {
                const r = m.get(id);
                return (
                  <Fragment key={BASIS_ORDER[i]}>
                    <td className="num border-l border-line-soft py-[6px] pl-3 text-right">
                      {r ? (
                        <WinnerValue side="animal" winner={r.direction !== "none" ? r.winner : null}>
                          <Cell v={r.animal} unit={r.unit} compact />
                        </WinnerValue>
                      ) : (
                        <MissingValue />
                      )}
                    </td>
                    <td className="num py-[6px] pl-2 text-right">
                      {r ? (
                        <WinnerValue side="vegetal" winner={r.direction !== "none" ? r.winner : null}>
                          <Cell v={r.vegetal} unit={r.unit} compact />
                        </WinnerValue>
                      ) : (
                        <MissingValue />
                      )}
                    </td>
                  </Fragment>
                );
              })}
              <td className="hidden py-[6px] pl-3 text-[12px] leading-snug text-ink-2 min-[1440px]:table-cell">{reliability(r0)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const BASIS_ORDER: Basis[] = ["perServing", "per100g"];

function NutritionTab({ v, basis, setBasis, servingLabel }: { v: VariantView; basis: Basis; setBasis: (b: Basis) => void; servingLabel: string }) {
  const all = v.rows[basis].filter((r) => r.group === "nutrients");
  const featured = all.filter((r) => r.featured);
  // Every Ciqual constituent (the derived EPA + DHA sum is not one of them).
  const ciqual = all.filter((r) => !r.id.startsWith("fa_epa_dha"));
  const unit = UNIT_OPTIONS.find((u) => u.id === basis)!;
  const unitLabel = basis === "perServing" ? servingLabel : unit.long;
  const footer = (
    <>
      Ciqual 2025 (ANSES). En gras : indicateurs comptés dans le score. Une valeur publiée « &lt; x » par Ciqual est comptée comme une fourchette de 0 à x ;
      une valeur absente ou « traces » n’est jamais remplacée par 0. Un point n’est donné que si les fourchettes des deux plats ne se chevauchent pas.
    </>
  );
  const ids = (rows: CriterionRow[]) => rows.map((r) => r.id);
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[16px] font-extrabold md:text-[19px]">Composition nutritionnelle</h2>
        <div className="w-full md:w-auto xl:hidden">
          <UnitSwitch value={basis} onChange={setBasis} servingLabel={servingLabel === "Par portion" ? "Portion" : "100 g"} />
        </div>
      </div>
      <div className="xl:hidden">
        <DataTable caption={`Composition nutritionnelle, nutriments principaux, ${unitLabel.toLowerCase()}`} unitLabel={unitLabel} rows={tableRows(featured)} footer={footer} />
      </div>
      <div className="hidden xl:block">
        <ThreeBasisTable v={v} ids={ids(v.rows.perServing.filter((r) => r.group === "nutrients" && r.featured))} caption="Composition nutritionnelle, nutriments principaux, deux bases" />
        <div className="pt-3 text-[13px] leading-normal text-ink-3">{footer}</div>
      </div>
      <details className="flex flex-col gap-2">
        <summary className="cursor-pointer py-2 text-[15px] font-bold text-action underline">Tous les constituants Ciqual ({ciqual.length})</summary>
        <div className="xl:hidden">
          <DataTable caption={`Tous les constituants Ciqual, ${unitLabel.toLowerCase()}`} unitLabel={unitLabel} rows={tableRows(ciqual)} />
        </div>
        <div className="hidden xl:block">
          <ThreeBasisTable v={v} ids={ids(v.rows.perServing.filter((r) => r.group === "nutrients" && !r.id.startsWith("fa_epa_dha")))} caption="Tous les constituants Ciqual, deux bases" />
        </div>
      </details>
    </Panel>
  );
}

/** Soy in the plant version: ANSES opinion on isoflavones (2022-SA-0221, 8 January 2025, published 24 March 2025). No figure, no advice (rule 6). */
function SoyNote({ names }: { names: string[] }) {
  return (
    <Panel title="Soja et isoflavones">
      <p className="m-0 text-[14px] leading-normal md:text-[15px]">
        Cette version végétale contient du soja ({names.map((n) => displayName(n).toLowerCase()).join(", ")}). Dans un avis rendu public le 24 mars 2025, l’Anses relève que
        les isoflavones « sont principalement contenues dans le soja » et constate, chez les consommateurs de soja, des dépassements de la valeur de référence
        qu’elle a établie ; elle ne recommande pas de servir des aliments à base de soja en restauration collective et conseille de diversifier les aliments
        d’origine végétale. Varier les protéines (lentilles, pois chiches, haricots, seitan…) est possible dans la liste ci-dessus.
      </p>
      <p className="m-0 text-[13px] leading-normal text-ink-2">
        Information générale, pas un conseil médical : parlez-en à un professionnel de santé. Source :{" "}
        <a href="https://www.anses.fr/fr/actualite/eviter-isoflavones-menus-restaurations-collectives" rel="noopener noreferrer">
          Anses, « Éviter les isoflavones dans les menus des restaurations collectives », 24 mars 2025
        </a>{" "}
        ; <a href="https://www.anses.fr/sites/default/files/NUT2022SA0221.pdf" rel="noopener noreferrer">avis, saisine n° 2022-SA-0221, 8 janvier 2025, p. 40-41</a>.
      </p>
    </Panel>
  );
}

function SanteTab({ v }: { v: VariantView }) {
  const guide = (x: (typeof v.pnns)[number], per: string): DataTableRow => {
    const cell = (g: number, p: number | null) => (
      <>
        {formatInt(g)}
        {NBSP}g{p != null && <span className="block text-[12px] text-ink-3 [hyphens:manual]">{formatPercent(p)} du repère {per}</span>}
      </>
    );
    return { id: x.entry.id, name: <>{x.entry.libelle} <span className="block text-[12px] text-ink-3">Repère : {x.entry.repere}</span></>, animal: cell(x.animalGrams, x.animalPercent), vegetal: cell(x.vegetalGrams, x.vegetalPercent) };
  };
  return (
    <>
      <Panel title="Classement du CIRC (OMS)">
        <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {v.iarc
            .filter((x) => x.animalGrams > 0)
            .map((x) => (
              <div key={x.entry.id} className="flex flex-col gap-1 rounded-select bg-win-animal p-[14px] md:p-4">
                <span className="text-[13px] font-bold text-animal-note">
                  Groupe {x.entry.groupe}, {x.entry.classement}
                </span>
                <span className="text-[16px] font-bold md:text-[17px]">
                  {x.animalItems.map((i) => `${formatInt(i.grams)}${NBSP}g de ${i.name}`).join(" et ")} ({x.entry.libelle.toLowerCase()}) par portion
                </span>
              </div>
            ))}
          {v.iarc.some((x) => x.vegetalGrams > 0) ? (
            v.iarc
              .filter((x) => x.vegetalGrams > 0)
              .map((x) => (
                <div key={`v-${x.entry.id}`} className="flex flex-col gap-1 rounded-select bg-win-animal p-[14px]">
                  <span className="text-[13px] font-bold text-animal-note">Version végétale, groupe {x.entry.groupe}</span>
                  <span className="text-[16px] font-bold">{x.vegetalItems.map((i) => `${formatInt(i.grams)}${NBSP}g de ${i.name}`).join(" et ")} par portion</span>
                </div>
              ))
          ) : (
            <div className="flex flex-col gap-1 rounded-select bg-win-plant p-[14px] md:p-4">
              <span className="text-[13px] font-bold text-action">Version végétale</span>
              <span className="text-[16px] font-bold md:text-[17px]">Aucun ingrédient classé</span>
            </div>
          )}
          {v.iarc.every((x) => x.animalGrams === 0) && (
            <div className="flex flex-col gap-1 rounded-select bg-track p-[14px] md:p-4">
              <span className="text-[13px] font-bold text-ink-2">Plat animal</span>
              <span className="text-[16px] font-bold md:text-[17px]">Aucun ingrédient classé (viande rouge ou transformée)</span>
            </div>
          )}
        </div>
        <p className="m-0 text-[13px] leading-normal text-ink-2 md:text-[14px]">
          {sante.lecture}{" "}
          {v.iarc[0] && (
            <a href={v.iarc[0].entry.source.url} rel="noopener noreferrer">
              Source : {v.iarc[0].entry.source.publisher}, monographies, volume 114
            </a>
          )}
          .
        </p>
      </Panel>
      {v.soyIngredients.length > 0 && <SoyNote names={v.soyIngredients} />}
      <Panel title="Repères de consommation pour les adultes (PNNS)">
        <DataTable caption="Repères PNNS" unitLabel="Par portion" rows={v.pnns.map((x) => guide(x, "par semaine"))} footer={v.pnns[0] && <>Santé publique France, recommandations pour les adultes, {[...new Set(v.pnns.map((x) => x.entry.source.pages))].join(" ; ")}. Affiché, non compté dans le score (mêmes grammes que le CIRC).</>} />
      </Panel>
      <Panel title="Régime de référence EAT-Lancet 2025 (source provisoire)">
        <DataTable caption="Repères EAT-Lancet" unitLabel="Par portion" rows={v.eatLancet.map((x) => guide(x, "par jour"))} footer={<>{sante.eatLancetLecture} {v.eatLancet[0] && <>EAT Forum, Summary Report 2025, {v.eatLancet[0].entry.source.pages}.</>} Non compté.</>} />
      </Panel>
      <Panel>
        <span className="flex justify-between gap-3 text-[14px] md:text-[15px]">
          <span>Minutes de vie en bonne santé (HENI)</span>
          <MissingValue label="non intégré (licence)" />
        </span>
      </Panel>
    </>
  );
}

/** ADEME reports that Agribalyse 3.2 underestimates the impacts of eggs (notice of the food spreadsheet, 21/08/2025). */
export function eggNoteText(egg: VariantView["eggImpactsUnderestimated"]): string | null {
  if (!egg.animal && !egg.vegetal) return null;
  const who = egg.animal && egg.vegetal ? "des deux plats" : egg.animal ? "du plat animal" : "de la version végétale";
  return `Œufs : l’ADEME signale que les impacts environnementaux des œufs, et de tous les produits qui en contiennent, sont sous-évalués dans Agribalyse 3.2 (mise à jour en cours). Les valeurs ${who} sont donc probablement trop basses.`;
}

function EggNote({ v }: { v: VariantView }) {
  const text = eggNoteText(v.eggImpactsUnderestimated);
  if (!text) return null;
  return (
    <p role="note" className="m-0 rounded-select bg-win-animal px-4 py-3 text-[14px] leading-normal text-ink">
      {text} <Link href="/methodologie#oeufs-agribalyse">Source et détails</Link>.
    </p>
  );
}

function EnvironmentTab({ v }: { v: VariantView }) {
  const rows = v.rows.perServing.filter((r) => r.group === "impacts");
  const co2 = find(v.rows.perServing, CLIMATE_MAIN);
  const norm = (["perServing", "per100g"] as Basis[]).map((b) => {
    const r = find(v.rows[b], CLIMATE_MAIN);
    return { id: b, label: UNIT_OPTIONS.find((u) => u.id === b)!.long, aside: signedGap(r?.reductionPercent ?? null), animal: r?.animal?.value ?? null, vegetal: r?.vegetal?.value ?? null, format: (x: number) => formatForUnit(x, CO2_UNIT) };
  });
  const range = co2?.animal?.rangePublished || co2?.vegetal?.rangePublished;
  return (
    <>
      <div className="grid gap-[14px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[18px]">
        <Panel>
          <span className="text-[15px] font-bold text-ink-2">Gaz à effet de serre, par portion</span>
          <span className="text-[64px] font-extrabold leading-[0.95] tracking-[-0.05em] md:text-[72px]">{signedGap(co2?.reductionPercent ?? null)}</span>
          <FaceToFaceBar thickness="lg" rows={[{ id: "co2", label: "", animal: co2?.animal?.value ?? null, vegetal: co2?.vegetal?.value ?? null, format: kg }]} />
          <span className="text-[13px] leading-normal text-ink-3">
            {range ? "Fourchette publiée affichée dans le tableau." : "Fourchette non publiée par la source."} Masse couverte par des données :{" "}
            {co2?.animal ? pct(co2.animal.coverage) : MISSING} (plat animal), {co2?.vegetal ? pct(co2.vegetal.coverage) : MISSING} (végétal).
          </span>
        </Panel>
        <Panel title="Selon l’unité de comparaison, kg CO₂e">
          <FaceToFaceBar rows={norm} />
        </Panel>
      </div>
      <EggNote v={v} />
      <Panel title={`Les ${rows.length} indicateurs Agribalyse`}>
        <DataTable
          rich
         
          caption="Indicateurs environnementaux Agribalyse, par portion"
          unitLabel="Par portion"
          rows={tableRows(rows)}
          footer={
            <>
              Agribalyse 3.2 (ADEME). En gras : les 16 indicateurs comptés dans le score ; le score unique EF (qui les agrège) et les sous-parties du
              changement climatique sont affichés sans être comptés. Qualité des données (DQR, de 1 à 5, plus bas = plus fiable) pour le CO₂e :{" "}
              {formatValue(co2?.animal?.dqr)} (plat animal) et {formatValue(co2?.vegetal?.dqr)} (végétal). Les valeurs négatives publiées par Agribalyse sont
              affichées telles quelles : <Link href="/methodologie#valeurs-negatives">pourquoi</Link>.
            </>
          }
        />
      </Panel>
    </>
  );
}

function AnimalsTab({ v }: { v: VariantView }) {
  const rows = v.rows.perServing.filter((r) => r.group === "animalImpacts");
  const animals = find(rows, ANIMALS);
  const sentence = animalsSentence(animals?.animal?.value ?? null);
  return (
    <>
      <Panel>
        <span className="text-[15px] font-bold text-ink-2">Animaux tués pour ce plat</span>
        <span className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] [text-wrap:balance] md:text-[44px]">
          {sentence ? (
            <>
              {sentence.replace(" (estimation basse)", "")}{" "}
              <span className="text-[18px] font-bold tracking-normal text-ink-2 md:text-[20px]">(estimation basse)</span>
            </>
          ) : (
            <MissingValue />
          )}
        </span>
        <span className="text-[15px] text-ink-2 md:text-[16px]">
          Version végétale : {animals?.vegetal?.value === 0 ? "aucun ingrédient animal identifié" : MISSING}.
        </span>
        <span className="text-[13px] leading-normal text-ink-3">
          Estimation basse : animaux abattus par kg de carcasse en France (FAOSTAT, Agreste), appliqués aux grammes de viande cuite de la recette ; un kg de viande cuite et
          désossée vient de plus d’un kg de carcasse.
        </span>
      </Panel>
      <Panel>
        {rows.length > 0 ? (
          <DataTable rich caption="Protection animale, par portion" unitLabel="Par portion" rows={tableRows(rows, true)} />
        ) : (
          <p className="m-0 text-[14px]">
            <MissingValue label="Aucun facteur animal sourcé pour les ingrédients de ce plat (donnée manquante, jamais 0)." />
          </p>
        )}
        <div className="flex flex-col gap-2 text-[13px] leading-normal text-ink-3">
          {rows.some((r) => r.id.startsWith("pain_hours")) && <p className="m-0">Douleur : estimation minimale, une ligne par intensité, jamais additionnées. Source : {WELFARE_CITATION}.</p>}
          {rows.some((r) => r.id === "life_days_farmed") && (
            <p className="m-0">Jours de vie en élevage : âge d’abattage du produit courant × animaux par kg ; pour le lait, jours de lactation par kg (élevage des génisses et des veaux non compté). Estimation basse.</p>
          )}
          {v.animalWithoutFactor.length > 0 && <p className="m-0">Pas encore de donnée pour : {[...new Set(v.animalWithoutFactor)].join(", ")} (donnée manquante, jamais 0).</p>}
          {v.animalFactorNotes.length > 0 && (
            <details>
              <summary className="cursor-pointer text-action underline">Facteurs utilisés et hypothèses</summary>
              <ul className="mt-1 list-disc pl-5">
                {v.animalFactorNotes.map((n) => (
                  <li key={`${n.category}-${n.indicatorId}`}>
                    <strong>{n.category}</strong> ({n.unitBasis ?? "base non précisée"}) : {n.notes ?? "pas de remarque"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </Panel>
    </>
  );
}

function EconomyTab({ v, animalName }: { v: VariantView; animalName: string }) {
  const { animal, vegetal } = v.price;
  const complete = animal && vegetal && animal.coverage >= COVERAGE_WARNING && vegetal.coverage >= COVERAGE_WARNING;
  const price = (p: PriceSide | null, f: (p: PriceSide) => number | null) => (complete && p ? formatEur(f(p)) : <MissingValue />);
  return (
    <>
      <Panel title="Coût climat payé par la société, par portion">
        <FaceToFaceBar
          rows={v.climateCost.map((c) => ({ id: String(c.year), label: `Valeur carbone ${c.year}`, animal: c.animalEur, vegetal: c.vegetalEur, format: (x: number) => formatEur(x) }))}
          valueWidth="64px"
        />
        <span className="text-[13px] leading-normal text-ink-3">
          Émissions par portion × valeur de l’action pour le climat (France Stratégie) de l’année de référence, la même partout sur le site :{" "}
          {v.climateCost.map((c) => `${formatEur(c.eurPerKg)} par kg CO₂e en ${c.year}${c.derived ? " (règle de croissance de la source)" : ""}`).join(" ; ")}.
        </span>
      </Panel>
      <Panel title="Ton porte-monnaie">
        <DataTable
          caption="Prix en magasin"
          unitLabel="Prix des ingrédients"
          rows={[
            {
              id: "s",
              name: "Par portion",
              animal: price(animal, (p) => p.value),
              vegetal: price(vegetal, (p) => p.value),
              strong: true,
              direction: "down",
              winner: winnerOf(v.scores.verdict.categories.find((c) => c.id === "economie")?.indicators.find((i) => i.id === "price_eur")?.outcome),
            },
            { id: "k", name: "Pour 100 g", animal: price(animal, (p) => p.per100g), vegetal: price(vegetal, (p) => p.per100g) },
          ]}
          footer={
            complete ? (
              <>Relevés de {period(animal.firstObservedOn, animal.lastObservedOn)} (RNM FranceAgriMer, Open Prices sous ODbL).</>
            ) : (
              <>
                Les relevés de prix publics ne couvrent que {pct(animal?.coverage ?? 0)} de la masse du plat animal et {pct(vegetal?.coverage ?? 0)} de la version végétale :
                pas de prix total tant que ce n’est pas au moins 95{NBSP}%. Aucun chiffre plutôt qu’un chiffre faux.
              </>
            )
          }
        />
        <details className="text-[13px] text-ink-2">
          <summary className="cursor-pointer text-action underline">Prix au kg utilisés, ingrédient par ingrédient</summary>
          <div className="mt-2 flex flex-col gap-3">
            <IngredientPrices title={animalName} items={v.price.animalIngredients} series="animal" />
            <IngredientPrices title="Version végétale" items={v.price.vegetalIngredients} series="plant" />
          </div>
        </details>
      </Panel>
    </>
  );
}


/**
 * Version complétée: the additions, as an example (never a recommendation, rule 6), with the
 * energy of both dishes in view.
 */
/**
 * Step 3 quinquies: « Ajuster la version végétale » (Nutrition tab). One plant version, adjusted by
 * the visitor: equalise protein or calories, set the main protein, close a gap. Everything is
 * recomputed in the browser; the animal dish never changes; filled indicators are not scored.
 */
function AdjustPanel({
  c,
  animal,
  per,
  request,
  onAdjust,
  gaps,
  mainLabel,
  mainGrams,
  servings,
}: {
  c: CompletedVariantView | undefined;
  animal: DishView;
  per: string;
  request: AdjustRequest | null;
  onAdjust: (r: AdjustRequest | null) => void;
  gaps: { id: string; label: string }[];
  mainLabel: string | null;
  mainGrams: number | null;
  servings: number;
}) {
  const r: AdjustRequest = request ?? { equalize: "none", close: [] };
  const closeList = r.close === "all" ? gaps.map((g) => g.id) : r.close;
  const set = (next: Partial<AdjustRequest>) => {
    const merged: AdjustRequest = { ...r, ...next };
    const empty = merged.equalize === "none" && (merged.close === "all" ? false : merged.close.length === 0) && merged.mainGramsPerServing == null;
    onAdjust(empty ? null : merged);
  };
  const toggle = (id: string) => set({ close: closeList.includes(id) ? closeList.filter((x) => x !== id) : [...closeList, id] });
  const step = (delta: number) => mainGrams != null && set({ equalize: r.equalize === "protein" ? "none" : r.equalize, mainGramsPerServing: Math.max(0, Math.round(mainGrams + delta)) });
  const energy = c?.view.rows.perServing.find((x) => x.id === "energy_eu_kcal");
  const kcal = (x: SideValue | null | undefined) => (x?.value == null ? MISSING : `${formatInt(x.value)}${NBSP}kcal`);
  const chip = (on: boolean) => `min-h-11 cursor-pointer rounded-full border px-[14px] text-[14px] font-bold lg:min-h-9 lg:px-3 lg:text-[13px] ${on ? "border-ink bg-ink text-white" : "border-[#C9D5D0] bg-surface text-ink hover:border-ink-3"}`;
  return (
    <Panel title="Ajuster la version végétale" className="mt-3">
      <p className="m-0 text-[14px] leading-normal text-ink-2">
        Le plat animal ne change pas. Vous ajustez la version végétale : tous les chiffres se recalculent. Un indicateur comblé par un ajustement n’est plus compté
        dans le score Nutrition. C’est un exemple, pas un conseil. <Link href="/methodologie#version-complete">Pourquoi ?</Link>
      </p>
      <div role="group" aria-label="Égaliser avec le plat animal" className="flex flex-wrap items-center gap-[6px]">
        <span className="mr-1 text-[14px] font-semibold">Égaliser avec le plat animal :</span>
        {(
          [
            ["none", "aucun"],
            ["protein", "les protéines"],
            ["energy", "les calories"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={r.equalize === id && r.mainGramsPerServing == null} onClick={() => set({ equalize: id, mainGramsPerServing: null })} className={chip(r.equalize === id && r.mainGramsPerServing == null)}>
            {label}
          </button>
        ))}
      </div>
      {mainLabel && mainGrams != null && (
        <div role="group" aria-label="Quantité de la protéine principale" className="flex flex-wrap items-center gap-[6px]">
          <span className="mr-1 text-[14px] font-semibold">
            {mainLabel} : <span className="num">{formatInt(mainGrams)}{NBSP}g</span> {per}
          </span>
          <button type="button" onClick={() => step(-10)} className={chip(false)} aria-label="10 g de moins">
            −{NBSP}10{NBSP}g
          </button>
          <button type="button" onClick={() => step(10)} className={chip(false)} aria-label="10 g de plus">
            +{NBSP}10{NBSP}g
          </button>
        </div>
      )}
      {gaps.length > 0 && (
        <div role="group" aria-label="Combler un manque" className="flex flex-wrap items-center gap-[6px]">
          <span className="mr-1 text-[14px] font-semibold">Combler :</span>
          {gaps.map((g) => (
            <button key={g.id} type="button" aria-pressed={closeList.includes(g.id)} onClick={() => toggle(g.id)} className={chip(closeList.includes(g.id))}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-[6px]">
        <button type="button" onClick={() => onAdjust({ equalize: "protein", close: "all" })} className="min-h-11 cursor-pointer rounded-btn bg-action px-[16px] text-[14px] font-bold text-white hover:bg-action-hover">
          Tout combler
        </button>
        <button type="button" onClick={() => onAdjust(null)} disabled={!request} className="min-h-11 cursor-pointer rounded-btn border border-ink-3 bg-surface px-[16px] text-[14px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50">
          Revenir à la recette de base
        </button>
      </div>
      {c && (
        <>
          {c.roleNote && <p className="m-0 text-[14px] font-semibold leading-normal">{c.roleNote}</p>}
          <p className="m-0 flex flex-wrap gap-x-6 gap-y-1 text-[15px] font-bold">
            <span className="inline-flex items-center gap-2">
              <Dot series="animal" /> {animal.name} : {kcal(energy?.animal)} {per}
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot series="plant" /> Version ajustée : {kcal(energy?.vegetal)} {per}
            </span>
          </p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[14px]">
            {c.scale != null && <li>{scaleLine(c.scale)}</li>}
            {c.boost && (
              <li>
                {c.boost.label} : {boostLine(c.boost.extraGrams, servings, c.boost.capped)}.
              </li>
            )}
            {c.additions.map((a) => (
              <li key={a.code}>
                {additionLine(a)}
                {a.kind === "enrichi" && " (aliment enrichi)"}. <span className="text-[13px] text-ink-3">{a.justification}</span>
              </li>
            ))}
            {c.open.length > 0 && <li className="text-animal-note">{openLine(c.open)}</li>}
          </ul>
          <AnimalBetterBox items={c.view.animalBetter.filter((x) => x.category === "nutrition")} title={REMAINING_TITLE} collapsible per={per} />
          <p className="m-0 text-[13px] text-ink-3">
            Valeurs Ciqual et Agribalyse des aliments ajoutés ; limites de sécurité de l’ANSES (<Link href="/methodologie#version-complete">méthode</Link>).
          </p>
        </>
      )}
    </Panel>
  );
}

/** Completed version: the whole plant recipe, ready to cook, next to the animal dish line by line. */
function CompletedRecipe({ c, animal }: { c: CompletedVariantView; animal: DishView }) {
  const dish = c.view.dish;
  const added = new Map(c.additions.map((a) => [a.code, a]));
  const lines = alignRecipes(animal.ingredients, dish.ingredients, animal.servings, dish.servings);
  const why = (code: string) =>
    c.boost?.code === code ? boostReason(c.boost.capped) : added.has(code) ? `ajouté pour ${added.get(code)!.nutrients.map((n) => NUTRIENT_REASON[n] ?? n).join(", ")}` : null;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ingredientsText(dish.name, dish.servings, dish.ingredients.map((i) => ({ label: i.label, grams: i.grams }))));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const ing = (i: DishView["ingredients"][number] | null, servings: number, mark: string | null) =>
    i ? (
      // Grid: a long name wraps under itself, not under the grams (designer review, 2nd pass).
      <span className="grid grid-cols-[64px_64px_minmax(0,1fr)] items-baseline">
        <span className="num pr-2 text-right whitespace-nowrap">
          {formatInt(i.grams)}
          {NBSP}g
        </span>
        <span className="num pr-3 text-right text-[12px] whitespace-nowrap text-ink-2">
          {formatInt(i.grams / servings)}
          {NBSP}g/port.
        </span>
        <span>
          {i.label}
          {mark && <span className="ml-2 text-[12px] font-semibold text-action">{mark}</span>}
        </span>
      </span>
    ) : (
      <span className="text-ink-3">—</span>
    );
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full border-collapse text-[14px]">
        <caption className="sr-only">Recette végétale complétée, à côté du plat animal</caption>
        <thead>
          <tr>
            {[
              [animal, "animal"],
              [dish, "plant"],
            ].map(([d, series]) => (
              <th key={series as string} scope="col" className="w-1/2 pb-2 text-left align-bottom">
                <span className="flex items-center gap-2 text-[15px] font-extrabold">
                  <Dot series={series as "animal" | "plant"} /> {(d as DishView).name}
                  {series === "plant" && " (complétée)"}
                </span>
                <span className="block text-[13px] font-normal text-ink-2">
                  Pour {(d as DishView).servings} portion{(d as DishView).servings > 1 ? "s" : ""}, environ {formatInt((d as DishView).gramsPerServing)}
                  {NBSP}g par portion
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, k) => (
            <tr key={k} className={`border-t border-line-soft align-top ${l.same ? "" : "bg-win-plant/50"}`}>
              <td className="py-[6px] pr-3">{ing(l.animal, animal.servings, null)}</td>
              <td className="py-[6px] pr-3">{ing(l.vegetal, dish.servings, l.vegetal ? why(l.vegetal.code) : null)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className="min-h-11 cursor-pointer rounded-btn border border-action bg-surface px-4 text-[14px] font-bold text-action">
          Copier la liste des ingrédients
        </button>
        <span role="status" className="text-[13px] text-ink-2">
          {copied ? "Liste copiée." : ""}
        </span>
        <span className="text-[13px] text-ink-3">Pas d’étapes de préparation : nous n’avons pas de source pour les écrire.</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function PairView({
  model,
  badge,
  headingAs = "h1",
  useUrl = true,
  viewInUrl = useUrl,
  base = "comparaison",
  variant: controlledVariant,
  onVariantChange,
  choiceSentence,
  notice,
  adjusted,
  adjustRequest = null,
  onAdjust,
  gaps = [],
}: {
  model: PairPageModel;
  badge: ReactNode;
  headingAs?: "h1" | "h2";
  useUrl?: boolean;
  /** Keep the view (?vue=) in the URL, even when the tab is not (/recette). */
  viewInUrl?: boolean;
  base?: string;
  /** Controlled choice (protein chosen by the visitor, kept in the URL by the parent). */
  variant?: string;
  onVariantChange?: (id: string) => void;
  /** One sentence under the list of proteins (« avec 12 protéines sur 12 »). */
  choiceSentence?: string;
  /** Warning shown under the toolbar (animal ingredient without a replacement rule…). */
  notice?: ReactNode;
  /** Step 3 quinquies: the adjusted plant version (null = base recipe), its request and setter. */
  adjusted?: CompletedVariantView | null;
  adjustRequest?: AdjustRequest | null;
  onAdjust?: (r: AdjustRequest | null) => void;
  /** Gaps of the base plant version the visitor can ask to close. */
  gaps?: { id: string; label: string }[];
}) {
  const choices = model.choices;
  const [localVariant, setLocalVariant] = useState<string>(choices[0]?.id ?? "maison");
  const variant = controlledVariant ?? localVariant;
  const setVariant = onVariantChange ?? setLocalVariant;
  const choice = choices.find((c) => c.id === variant);
  const [basis, setBasis] = useState<Basis>("perServing");
  const [urlTab, setUrlTab] = useQueryParam("onglet", useUrl);
  const [localTab, setLocalTab] = useState<TabIdT>("apercu");
  void viewInUrl;
  const tab: TabIdT = useUrl ? (isTab(urlTab) ? urlTab : "apercu") : localTab;
  const setTab = (t: TabIdT) => (useUrl ? setUrlTab(t === "apercu" ? null : t) : setLocalTab(t));
  const open = (t: TabIdT) => {
    setTab(t);
    document.getElementById(tabId(base, t))?.scrollIntoView({ block: "nearest" });
    document.getElementById(tabId(base, t))?.focus({ preventScroll: true });
  };
  const realistic = model.variants[variant];
  // Food pages and AGRIBALYSE dishes: one « serving » of 100 g.
  const per = model.animal.servings === 1 ? "pour 100 g" : "par portion";
  // Step 3 quinquies: one plant version; once adjusted, the whole page (tabs, scores, simulator) uses it.
  const completed = adjusted ?? undefined;
  const isComplete = !!completed;
  const v = isComplete ? completed!.view : realistic;
  if (!v || !realistic) return <p className="px-5">Alternative indisponible.</p>;
  const co2Of = (x: VariantView | undefined) => x?.rows.perServing.find((r) => r.id === CLIMATE_MAIN)?.reductionPercent ?? null;
  const co2Line = co2Summary(co2Of(realistic), co2Of(completed?.view), per);
  const score = v.scores.verdict.categories.find((c) => c.id === tab);
  const banner = score && (tab === "nutrition" ? v.scores.nutritionByBasis[basis] : score);
  const bannerUnit = tab === "nutrition" ? UNIT_OPTIONS.find((u) => u.id === basis)?.long.toLowerCase() : "par portion";

  return (
    <>
      <section className="on-dark bg-ink text-white">
        <div className={`mx-auto grid max-w-[1440px] items-end gap-10 px-5 pb-[22px] md:grid-cols-[repeat(auto-fit,minmax(460px,1fr))] md:px-8 md:pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-start lg:gap-8 lg:pb-4 ${headingAs === "h2" ? "pt-6 md:pt-8" : "pt-1 md:pt-7 lg:pt-2"} min-[1440px]:px-12`}>
          <div className="flex flex-col gap-4 lg:gap-3">
            <span className="inline-flex items-start gap-[6px] self-start text-[13px] font-semibold text-on-dark-3 md:text-[14px]">
              <span>{badge}</span>
            </span>
            <DishTitle animal={model.animal.name} vegetal={v.dish.name} as={headingAs} />
            {v.keyCoverage != null && v.keyCoverage < COVERAGE_WARNING && (
              <p role="note" className="m-0 rounded-btn bg-white/8 px-3 py-2 text-[14px] text-on-dark-1">
                Attention : l’énergie, les protéines ou les émissions ne sont connues que pour {pct(v.keyCoverage)} de la masse d’un des plats. À lire avec prudence.
              </p>
            )}
            {/* Toolbar: alternative and view on one line on large screens. */}
            <div className="flex flex-col gap-2 md:self-start lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5 lg:self-stretch">
              {choices.length > 3 ? (
                <ProteinPicker choices={choices} value={variant} onChange={setVariant} />
              ) : (
                choices.length > 1 && <ChipGroup tone="dark" wrap caption="Alternative" label="Alternative végétale" options={choices.map((c) => ({ id: c.id, label: c.label }))} value={variant} onChange={setVariant} />
              )}
              {onAdjust && (
                <button type="button" onClick={() => open("nutrition")} className="min-h-11 cursor-pointer rounded-full border border-white/30 bg-transparent px-[14px] text-[14px] font-bold text-white hover:border-white/60 lg:min-h-9 lg:px-3 lg:text-[13px]">
                  {isComplete ? "Version ajustée · modifier" : "Ajuster la version végétale"}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {choice?.reason && (
                <p className="m-0 text-[14px] leading-normal text-on-dark-2">
                  <strong className="text-on-dark-1">{choices.length > 3 ? "Pourquoi cette protéine :" : "Pourquoi cette alternative :"}</strong> {choice.reason}
                </p>
              )}
              {choiceSentence && <p className="m-0 text-[14px] leading-normal text-on-dark-2">{choiceSentence}</p>}
              {notice && <div className="m-0 text-[14px] leading-normal text-on-dark-1">{notice}</div>}
              {co2Line && <p className="m-0 text-[14px] font-semibold text-on-dark-1">{co2Line}</p>}
            </div>
          </div>
          <VerdictPanel verdict={v.scores.verdict} className="hidden md:flex" />
        </div>
      </section>
      <div className="xl:hidden">
        <TabBar tabs={TABS} active={tab} onChange={setTab} base={base} label="Catégories de la comparaison" />
      </div>
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-5 md:px-8 md:pt-7 xl:grid xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-6 xl:pt-3 min-[1440px]:px-12">
        <CategoryNav
          items={TABS}
          active={tab}
          onChange={setTab}
          scores={Object.fromEntries(v.scores.verdict.categories.map((c) => [c.id, c]))}
          className="sticky top-4 hidden self-start xl:block"
        />
        <div className="min-w-0">
        <Legend />
        {/* Step 3 quinquies: the panel in Nutrition; elsewhere one line, linking to it. */}
        {onAdjust && tab === "nutrition" && (
          <AdjustPanel
            c={completed}
            animal={model.animal}
            per={per}
            request={adjustRequest}
            onAdjust={onAdjust}
            gaps={gaps}
            mainLabel={mainOf(v, variant)?.label ?? null}
            mainGrams={mainOf(v, variant) ? mainOf(v, variant)!.grams / v.dish.servings : null}
            servings={v.dish.servings}
          />
        )}
        {isComplete && tab !== "nutrition" && (
          <p className="m-0 mt-3 rounded-btn bg-track px-4 py-3 text-[14px] leading-normal">
            {adjustSummary(completed!, v.dish.servings)} ·{" "}
            <button type="button" onClick={() => open("nutrition")} className="cursor-pointer text-action underline">
              Modifier dans Nutrition
            </button>
          </p>
        )}
        {TABS.map((t) => (
          <div key={t.id} role="tabpanel" id={panelId(base, t.id)} aria-labelledby={tabId(base, t.id)} hidden={t.id !== tab} tabIndex={-1} className="pt-3">
            {t.id === tab &&
              (t.id === "apercu" ? (
                <Overview model={model} v={v} open={open} base={base} completed={isComplete ? completed : undefined} />
              ) : (
                <div className="flex flex-col gap-[14px]">
                  {banner && (
                    <div className="md:hidden">
                      <CategoryBanner score={banner} unitLabel={bannerUnit} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-start gap-6">
                    <div className={`flex min-w-0 flex-[999_1_560px] flex-col gap-[14px] md:gap-[18px] xl:flex-[999_1_600px] ${t.id === "nutrition" ? "xl:basis-full" : ""}`}>
                      {t.id === "nutrition" && <NutritionTab v={v} basis={basis} setBasis={setBasis} servingLabel="Par portion" />}
                      {t.id === "sante" && <SanteTab v={v} />}
                      {t.id === "environnement" && <EnvironmentTab v={v} />}
                      {t.id === "animaux" && <AnimalsTab v={v} />}
                      {t.id === "economie" && <EconomyTab v={v} animalName={model.animal.name} />}
                    </div>
                    {/* Nutrition: three bases side by side need the full width; the side boxes go below (designer review, 2nd pass). */}
                    <aside
                      aria-label="À retenir"
                      className={`flex min-w-0 flex-[1_1_300px] flex-col gap-[18px] ${t.id === "nutrition" ? "xl:grid xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:items-start" : "xl:sticky xl:top-4 xl:max-w-[280px] xl:self-start"}`}
                    >
                      {banner && (
                        <div className="hidden md:block">
                          <CategoryBanner score={banner} unitLabel={bannerUnit} />
                        </div>
                      )}
                      <AnimalBetterBox items={isComplete && t.id === "nutrition" ? [] : v.animalBetter.filter((x) => x.category === t.id)} title={animalBetterTitle(t.id)} collapsible per={per} />
                    </aside>
                  </div>
                </div>
              ))}
          </div>
        ))}
        {onAdjust && !isComplete && tab === "apercu" && (
          <div className="mt-3 flex flex-wrap items-center gap-[6px] rounded-btn bg-track px-4 py-3 text-[14px]">
            <span className="mr-1 font-semibold">Ajuster la version végétale :</span>
            <button type="button" onClick={() => onAdjust({ equalize: "protein", close: [] })} className="min-h-11 cursor-pointer rounded-full border border-[#C9D5D0] bg-surface px-3 text-[13px] font-bold text-ink lg:min-h-9">
              autant de protéines
            </button>
            <button type="button" onClick={() => onAdjust({ equalize: "energy", close: [] })} className="min-h-11 cursor-pointer rounded-full border border-[#C9D5D0] bg-surface px-3 text-[13px] font-bold text-ink lg:min-h-9">
              autant de calories
            </button>
            <button type="button" onClick={() => onAdjust({ equalize: "protein", close: "all" })} className="min-h-11 cursor-pointer rounded-full border border-[#C9D5D0] bg-surface px-3 text-[13px] font-bold text-ink lg:min-h-9">
              tout combler
            </button>
            <button type="button" onClick={() => open("nutrition")} className="cursor-pointer text-action underline">
              plus de réglages dans Nutrition
            </button>
          </div>
        )}
        <div className="mt-6">
          <MedicalNote />
        </div>
        </div>
      </div>
    </>
  );
}
