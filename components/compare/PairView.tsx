"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import sante from "@/data/sante.json";
import { AnimalBetterBox } from "@/components/ui/AnimalBetterBox";
import { CategoryBanner } from "@/components/ui/CategoryBanner";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { DataTable, type DataTableRow } from "@/components/ui/DataTable";
import { DishTitle } from "@/components/ui/DishTitle";
import { Dot } from "@/components/ui/Dot";
import { FaceToFaceBar } from "@/components/ui/FaceToFaceBar";
import { MedicalNote } from "@/components/ui/MedicalNote";
import { MissingValue } from "@/components/ui/MissingValue";
import { Simulator } from "@/components/ui/Simulator";
import { panelId, TabBar, tabId, type TabDef } from "@/components/ui/TabBar";
import { UNIT_OPTIONS, UnitSwitch } from "@/components/ui/UnitSwitch";
import { VariantSwitch, type VariantId } from "@/components/ui/VariantSwitch";
import { VerdictPanel } from "@/components/ui/VerdictPanel";
import { CLIMATE_MAIN, COVERAGE_WARNING } from "@/lib/compare/config";
import type { CategoryId, CategoryScoreView } from "@/lib/compare/scores";
import type { CriterionRow, DishView, IngredientPrice, PairPageModel, PriceSide, SideValue, VariantView } from "@/lib/compare/view";
import type { Basis } from "@/lib/scoring";
import { formatEur, formatInt, formatPercent, formatValue, MISSING, NBSP, signedGap, withUnit } from "@/lib/format";
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

function Cell({ v, range = true }: { v: SideValue | null; range?: boolean }) {
  if (!v || v.value == null) return <MissingValue />;
  return (
    <>
      {formatValue(v.value)}
      {range && v.rangePublished && (
        <span className="block text-[12px] text-ink-3">
          {formatValue(v.low)} à {formatValue(v.high)}
        </span>
      )}
    </>
  );
}

/** Note under a table row: partial data, advantage to the animal dish (rule 3), negative values. */
function rowNote(r: CriterionRow): ReactNode {
  const notes: string[] = [];
  const partial = (s: SideValue | null) => !!s && s.value != null && s.coverage < COVERAGE_WARNING;
  if (partial(r.animal) || partial(r.vegetal))
    notes.push(`Données partielles : ${r.animal ? pct(r.animal.coverage) : MISSING} et ${r.vegetal ? pct(r.vegetal.coverage) : MISSING} de la masse, pas de verdict`);
  if (r.winner === "animal") notes.push("Avantage au plat animal");
  if ((r.animal?.value ?? 0) < 0 || (r.vegetal?.value ?? 0) < 0) notes.push("Valeur négative publiée telle quelle");
  return notes.length ? notes.join(". ") : undefined;
}

export function tableRows(rows: CriterionRow[]): DataTableRow[] {
  return rows.map((r) => ({
    id: r.id,
    name: (
      <span title={r.sourceName !== r.name ? r.sourceName : undefined}>
        {r.name}
        {unitOf(r)}
      </span>
    ),
    animal: <Cell v={r.animal} />,
    vegetal: <Cell v={r.vegetal} />,
    note: rowNote(r),
    strong: r.direction !== "none",
  }));
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
        Pour {dish.servings} portions, environ {formatInt(dish.gramsPerServing)}
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
function Overview({ model, v, open, base }: { model: PairPageModel; v: VariantView; open: (t: TabIdT) => void; base: string }) {
  const cats = Object.fromEntries(v.scores.verdict.categories.map((c) => [c.id, c])) as Record<CategoryId, CategoryScoreView>;
  const rows = v.rows.perServing;
  const protein = find(rows, "protein_g");
  const energy = find(rows, "energy_eu_kcal");
  const co2 = find(rows, CLIMATE_MAIN);
  const animals = find(rows, ANIMALS);
  const cost = v.climateCost[0];
  const priceOk = v.price.animal && v.price.vegetal && v.price.animal.coverage >= COVERAGE_WARNING && v.price.vegetal.coverage >= COVERAGE_WARNING;
  const classified = (side: "animal" | "vegetal") =>
    v.iarc.filter((x) => (side === "animal" ? x.animalGrams : x.vegetalGrams) > 0).map((x) => `${(side === "animal" ? x.animalFoods : x.vegetalFoods).join(", ")} : groupe ${x.entry.groupe}`);
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
  const pair = (a: number | null | undefined, b: number | null | undefined, unit: string, f = formatValue) => (
    <>
      {a == null ? MISSING : f(a)} · {b == null ? MISSING : f(b)}
      {unit ? `${NBSP}${unit}` : ""}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <VerdictPanel verdict={v.scores.verdict} className="md:hidden" />
      <p className="m-0 mt-[6px] text-[15px] leading-normal text-ink-2">Touche une catégorie pour voir toutes ses données.</p>
      <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] md:gap-[18px]">
        {card(
          "nutrition",
          "Nutrition",
          <span className="flex flex-col gap-[6px]">
            {line("Protéines", pair(protein?.animal?.value, protein?.vegetal?.value, "g"))}
            <FaceToFaceBar rows={[{ id: "p", label: "", animal: protein?.animal?.value ?? null, vegetal: protein?.vegetal?.value ?? null, format: () => "" }]} valueWidth="0px" />
            {line("Énergie", pair(energy?.animal?.value, energy?.vegetal?.value, "kcal", formatInt))}
          </span>,
        )}
        {card(
          "sante",
          "Santé",
          <span className="flex flex-col gap-[6px] text-[14px] leading-snug">
            <span className="flex gap-2">
              <Dot series="animal" className="mt-[5px]" />
              <span>{classified("animal").length ? `Classés par le CIRC : ${classified("animal").join(" ; ")}` : "Aucun ingrédient classé par le CIRC"}</span>
            </span>
            <span className="flex gap-2">
              <Dot series="plant" className="mt-[5px]" />
              <span>{classified("vegetal").length ? `Classés par le CIRC : ${classified("vegetal").join(" ; ")}` : "Aucun ingrédient classé"}</span>
            </span>
          </span>,
        )}
        {card(
          "environnement",
          "Environnement",
          <span className="flex flex-col gap-[6px]">
            <span className="flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-none tracking-[-0.04em]">{signedGap(co2?.reductionPercent ?? null)}</span>
              <span className="text-[15px] text-ink-2">de CO₂e par portion</span>
            </span>
            <FaceToFaceBar rows={[{ id: "co2", label: "", animal: co2?.animal?.value ?? null, vegetal: co2?.vegetal?.value ?? null, format: (x) => withUnit(x, "kg") }]} />
          </span>,
        )}
        {card(
          "animaux",
          "Protection animale",
          <span className="flex flex-col gap-1">
            <span className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
              {animalsSentence(animals?.animal?.value ?? null) ?? <MissingValue label="Animaux tués : donnée manquante" />}
            </span>
            <span className="text-[13px] text-ink-3">Version végétale : {animals?.vegetal?.value === 0 ? "aucun ingrédient animal identifié" : MISSING}. D’après FAOSTAT et Agreste.</span>
          </span>,
        )}
        {card(
          "economie",
          "Économie",
          <span className="flex flex-col gap-[6px]">
            {line(`Coût climat pour la société (${cost?.year ?? ""})`, pair(cost?.animalEur, cost?.vegetalEur, "", formatEur))}
            {line("Prix en magasin", priceOk ? pair(v.price.animal?.value, v.price.vegetal?.value, "", formatEur) : <MissingValue />)}
          </span>,
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
      <Panel title="Les recettes comparées" className="mt-3">
        {v.rationale && (
          <p className="m-0 text-[14px] leading-normal text-ink-2">
            <strong className="text-ink">Pourquoi c’est comparable :</strong> {v.rationale}
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <Recipe dish={model.animal} title={model.animal.name} series="animal" />
          <Recipe dish={v.dish} title={v.dish.name} series="plant" />
        </div>
      </Panel>
    </div>
  );
}

function NutritionTab({ v, basis, setBasis, servingLabel }: { v: VariantView; basis: Basis; setBasis: (b: Basis) => void; servingLabel: string }) {
  const rows = v.rows[basis].filter((r) => r.group === "nutrients");
  const unit = UNIT_OPTIONS.find((u) => u.id === basis)!;
  const unitLabel = basis === "perServing" ? servingLabel : unit.long;
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[16px] font-extrabold md:text-[19px]">Composition nutritionnelle</h2>
        <div className="w-full md:w-auto">
          <UnitSwitch value={basis} onChange={setBasis} servingLabel={servingLabel === "Par portion" ? "Portion" : "100 g"} />
        </div>
      </div>
      <DataTable
        caption={`Composition nutritionnelle, ${unitLabel.toLowerCase()}`}
        unitLabel={unitLabel}
        rows={tableRows(rows)}
        footer={
          <>
            Ciqual 2025 (ANSES), {rows.length} constituants. En gras : indicateurs comptés dans le score. Une couverture inférieure à 95{NBSP}% de la
            masse est signalée et n’est jamais comptée ; une valeur absente n’est jamais remplacée par 0.
          </>
        }
      />
    </Panel>
  );
}

function SanteTab({ v }: { v: VariantView }) {
  const guide = (x: (typeof v.pnns)[number], per: string): DataTableRow => {
    const cell = (g: number, p: number | null) => (
      <>
        {formatInt(g)}
        {NBSP}g{p != null && <span className="block text-[12px] text-ink-3">{formatPercent(p)} du repère {per}</span>}
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
                  {x.animalFoods.join(", ")} ({x.entry.libelle.toLowerCase()}), {formatInt(x.animalGrams)}
                  {NBSP}g par portion
                </span>
              </div>
            ))}
          {v.iarc.some((x) => x.vegetalGrams > 0) ? (
            v.iarc
              .filter((x) => x.vegetalGrams > 0)
              .map((x) => (
                <div key={`v-${x.entry.id}`} className="flex flex-col gap-1 rounded-select bg-win-animal p-[14px]">
                  <span className="text-[13px] font-bold text-animal-note">Version végétale, groupe {x.entry.groupe}</span>
                  <span className="text-[16px] font-bold">{x.vegetalFoods.join(", ")}</span>
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
      <Panel title="Repères de consommation pour les adultes (PNNS)">
        <DataTable caption="Repères PNNS" unitLabel="Par portion" rows={v.pnns.map((x) => guide(x, "hebdomadaire"))} footer={v.pnns[0] && <>Santé publique France, recommandations pour les adultes, {[...new Set(v.pnns.map((x) => x.entry.source.pages))].join(" ; ")}. Affiché, non compté dans le score (mêmes grammes que le CIRC).</>} />
      </Panel>
      <Panel title="Régime de référence EAT-Lancet 2025 (source provisoire)">
        <DataTable caption="Repères EAT-Lancet" unitLabel="Par portion" rows={v.eatLancet.map((x) => guide(x, "quotidien"))} footer={<>{sante.eatLancetLecture} {v.eatLancet[0] && <>EAT Forum, Summary Report 2025, {v.eatLancet[0].entry.source.pages}.</>} Non compté.</>} />
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

function EnvironmentTab({ v }: { v: VariantView }) {
  const rows = v.rows.perServing.filter((r) => r.group === "impacts");
  const co2 = find(v.rows.perServing, CLIMATE_MAIN);
  const norm = (["perServing", "per100kcal", "per10gProtein"] as Basis[]).map((b) => {
    const r = find(v.rows[b], CLIMATE_MAIN);
    return { id: b, label: UNIT_OPTIONS.find((u) => u.id === b)!.long, aside: signedGap(r?.reductionPercent ?? null), animal: r?.animal?.value ?? null, vegetal: r?.vegetal?.value ?? null, format: (x: number) => formatValue(x) };
  });
  const range = co2?.animal?.rangePublished || co2?.vegetal?.rangePublished;
  return (
    <>
      <div className="grid gap-[14px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[18px]">
        <Panel>
          <span className="text-[15px] font-bold text-ink-2">Gaz à effet de serre, par portion</span>
          <span className="text-[64px] font-extrabold leading-[0.95] tracking-[-0.05em] md:text-[72px]">{signedGap(co2?.reductionPercent ?? null)}</span>
          <FaceToFaceBar thickness="lg" rows={[{ id: "co2", label: "", animal: co2?.animal?.value ?? null, vegetal: co2?.vegetal?.value ?? null, format: (x) => withUnit(x, "kg") }]} />
          <span className="text-[13px] leading-normal text-ink-3">
            {range ? "Fourchette publiée affichée dans le tableau." : "Fourchette non publiée par la source."} Masse couverte par des données :{" "}
            {co2?.animal ? pct(co2.animal.coverage) : MISSING} (plat animal), {co2?.vegetal ? pct(co2.vegetal.coverage) : MISSING} (végétal).
          </span>
        </Panel>
        <Panel title="Selon l’unité de comparaison, kg CO₂e">
          <FaceToFaceBar rows={norm} />
        </Panel>
      </div>
      <Panel title={`Les ${rows.length} indicateurs Agribalyse`}>
        <DataTable
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
        <span className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[56px]">{sentence ?? <MissingValue />}</span>
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
          <DataTable caption="Protection animale, par portion" unitLabel="Par portion" rows={tableRows(rows)} />
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
            { id: "s", name: "Par portion", animal: price(animal, (p) => p.value), vegetal: price(vegetal, (p) => p.value), strong: true },
            { id: "k", name: "Pour 100 kcal", animal: price(animal, (p) => p.per100kcal), vegetal: price(vegetal, (p) => p.per100kcal) },
            { id: "p", name: "Pour 10 g de protéines", animal: price(animal, (p) => p.per10gProtein), vegetal: price(vegetal, (p) => p.per10gProtein) },
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

// ---------------------------------------------------------------------------
export function PairView({
  model,
  badge,
  headingAs = "h1",
  useUrl = true,
  base = "comparaison",
}: {
  model: PairPageModel;
  badge: ReactNode;
  headingAs?: "h1" | "h2";
  useUrl?: boolean;
  base?: string;
}) {
  const available = (["maison", "commerce"] as VariantId[]).filter((x) => model.variants[x]);
  const [variant, setVariant] = useState<VariantId>(available[0] ?? "maison");
  const [basis, setBasis] = useState<Basis>("perServing");
  const [urlTab, setUrlTab] = useQueryParam("onglet", useUrl);
  const [localTab, setLocalTab] = useState<TabIdT>("apercu");
  const tab: TabIdT = useUrl ? (isTab(urlTab) ? urlTab : "apercu") : localTab;
  const setTab = (t: TabIdT) => (useUrl ? setUrlTab(t === "apercu" ? null : t) : setLocalTab(t));
  const open = (t: TabIdT) => {
    setTab(t);
    document.getElementById(tabId(base, t))?.scrollIntoView({ block: "nearest" });
    document.getElementById(tabId(base, t))?.focus({ preventScroll: true });
  };
  const v = model.variants[variant];
  if (!v) return <p className="px-5">Alternative indisponible.</p>;
  const score = v.scores.verdict.categories.find((c) => c.id === tab);
  const banner = score && (tab === "nutrition" ? v.scores.nutritionByBasis[basis] : score);
  const bannerUnit = tab === "nutrition" ? UNIT_OPTIONS.find((u) => u.id === basis)?.long.toLowerCase() : "par portion";

  return (
    <>
      <section className="on-dark bg-ink text-white">
        <div className="mx-auto grid max-w-[1200px] items-end gap-10 px-5 pb-[22px] pt-1 md:grid-cols-[repeat(auto-fit,minmax(460px,1fr))] md:px-8 md:pb-10 md:pt-7">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-[6px] self-start text-[13px] font-semibold text-on-dark-3 md:text-[14px]">
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#3FC1A3" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {badge}
            </span>
            <DishTitle animal={model.animal.name} vegetal={v.dish.name} as={headingAs} />
            {v.keyCoverage != null && v.keyCoverage < COVERAGE_WARNING && (
              <p role="note" className="m-0 rounded-btn bg-white/8 px-3 py-2 text-[14px] text-on-dark-1">
                Attention : l’énergie, les protéines ou les émissions ne sont connues que pour {pct(v.keyCoverage)} de la masse d’un des plats. À lire avec prudence.
              </p>
            )}
            <div className="md:self-start">
              <VariantSwitch value={variant} available={available} onChange={setVariant} />
            </div>
          </div>
          <VerdictPanel verdict={v.scores.verdict} className="hidden md:flex" />
        </div>
      </section>
      <TabBar tabs={TABS} active={tab} onChange={setTab} base={base} label="Catégories de la comparaison" />
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-8 pt-5 md:px-8 md:pt-7">
        <Legend />
        {TABS.map((t) => (
          <div key={t.id} role="tabpanel" id={panelId(base, t.id)} aria-labelledby={tabId(base, t.id)} hidden={t.id !== tab} tabIndex={-1} className="pt-3">
            {t.id === tab &&
              (t.id === "apercu" ? (
                <Overview model={model} v={v} open={open} base={base} />
              ) : (
                <div className="flex flex-col gap-[14px]">
                  {banner && (
                    <div className="md:hidden">
                      <CategoryBanner score={banner} unitLabel={bannerUnit} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-start gap-6">
                    <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[14px] md:gap-[18px]">
                      {t.id === "nutrition" && <NutritionTab v={v} basis={basis} setBasis={setBasis} servingLabel="Par portion" />}
                      {t.id === "sante" && <SanteTab v={v} />}
                      {t.id === "environnement" && <EnvironmentTab v={v} />}
                      {t.id === "animaux" && <AnimalsTab v={v} />}
                      {t.id === "economie" && <EconomyTab v={v} animalName={model.animal.name} />}
                    </div>
                    <aside aria-label="À retenir" className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
                      {banner && (
                        <div className="hidden md:block">
                          <CategoryBanner score={banner} unitLabel={bannerUnit} />
                        </div>
                      )}
                      <AnimalBetterBox items={v.animalBetter} />
                      <MedicalNote />
                    </aside>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
