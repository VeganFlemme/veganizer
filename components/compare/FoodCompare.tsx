"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimalBetterBox } from "@/components/ui/AnimalBetterBox";
import { animalBetterTitle } from "@/lib/compare/config";
import { DataTable } from "@/components/ui/DataTable";
import { DishTitle } from "@/components/ui/DishTitle";
import { MedicalNote } from "@/components/ui/MedicalNote";
import { UNIT_OPTIONS, UnitSwitch } from "@/components/ui/UnitSwitch";
import type { FoodPageModel } from "@/lib/compare/food";
import type { Basis } from "@/lib/scoring";
import { formatPercent } from "@/lib/format";
import { Panel, tableRows } from "./PairView";

// Per 100 g instead of "per serving": no sourced typical portion is used for single foods.
const unitLabel = (b: Basis) => (b === "perServing" ? "Pour 100 g" : UNIT_OPTIONS.find((u) => u.id === b)!.long);

const ORIGIN = "l’aliment d’origine";

export function FoodCompare({ model }: { model: FoodPageModel }) {
  const [index, setIndex] = useState(0);
  const [basis, setBasis] = useState<Basis>("perServing");
  const alt = model.alternatives[index];
  const rows = alt ? alt.rows[basis] : model.ownRows[basis];
  const group = (g: string) => rows.filter((r) => r.group === g);
  const label = unitLabel(basis);

  return (
    <>
      <section className="on-dark bg-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 pb-[22px] pt-1 md:px-8 md:pb-10 md:pt-7">
          <span className="self-start rounded-full bg-white/8 px-3 py-1 text-[13px] font-bold text-on-dark-1">Comparaison simplifiée</span>
          <DishTitle animal={model.name} vegetal={alt?.name ?? null} />
          <p className="m-0 max-w-[760px] text-[14px] leading-normal text-on-dark-2">
            Code Ciqual / Agribalyse {model.code}
            {model.foodSubgroup && <> · {model.foodSubgroup}</>}.{" "}
            {model.isAnimal
              ? "Comparaison automatique avec des aliments végétaux du catalogue, choisis selon des règles relues (même rôle dans le repas, protéines les plus proches). Ce n’est pas une recette vérifiée : nutrition, environnement et animaux seulement, pour 100 g."
              : "Aliment sans ingrédient animal identifié dans les bases Ciqual et Agribalyse (ce n’est pas une garantie : vérifie la liste des ingrédients)."}{" "}
            <Link href="/methodologie#comparaison-simplifiee" className="text-on-dark-1 underline hover:text-white">
              Méthode
            </Link>
          </p>
          {model.alternatives.length > 1 && (
            <div role="group" aria-label="Alternative végétale proposée" className="flex flex-col gap-1 rounded-select bg-white/8 p-1 md:flex-row">
              {model.alternatives.map((a, i) => (
                <button
                  key={a.code}
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                  className={`min-h-11 flex-1 cursor-pointer rounded-[10px] border-0 px-3 py-2 text-left text-[14px] font-bold ${i === index ? "bg-surface text-ink" : "bg-transparent text-white hover:bg-white/10"}`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
          {model.isAnimal && model.alternatives.length === 0 && (
            <p className="m-0 rounded-btn bg-white/8 px-3 py-2 text-[14px] text-on-dark-1">Pas encore d’alternative végétale proposée pour cet aliment.</p>
          )}
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[14px] px-5 pb-8 pt-5 md:px-8 md:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {alt ? (
            <p className="m-0 max-w-[720px] text-[14px] leading-normal text-ink-2">
              <strong className="text-ink">Pourquoi cette alternative :</strong> {alt.rule}.{" "}
              {alt.proteinGapPercent != null && (
                <>
                  Protéines pour 100 g : {alt.proteinGapPercent >= 0 ? "+" : "−"}
                  {formatPercent(Math.abs(alt.proteinGapPercent))} par rapport à l’aliment d’origine.
                </>
              )}
            </p>
          ) : (
            <span />
          )}
          <div className="w-full md:w-auto">
            <UnitSwitch value={basis} onChange={setBasis} servingLabel="100 g" />
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[14px] md:gap-[18px]">
            <Panel title="Nutrition">
              <DataTable caption={`Nutrition, ${label.toLowerCase()}`} unitLabel={label} rows={tableRows(group("nutrients"))} footer="Ciqual 2025 (ANSES). En gras : indicateurs comptés dans les scores des paires." />
            </Panel>
            {alt && <AnimalBetterBox items={alt.animalBetter.filter((x) => x.category === "nutrition")} title={animalBetterTitle("nutrition", ORIGIN)} />}
            <Panel title="Environnement">
              <DataTable caption={`Environnement, ${label.toLowerCase()}`} unitLabel={label} rows={tableRows(group("impacts"))} footer="Agribalyse 3.2 (ADEME). Valeurs négatives affichées telles que publiées." />
            </Panel>
            {alt && <AnimalBetterBox items={alt.animalBetter.filter((x) => x.category === "environnement")} title={animalBetterTitle("environnement", ORIGIN)} />}
            <Panel title="Protection animale">
              {group("animalImpacts").length > 0 ? (
                <DataTable caption={`Protection animale, ${label.toLowerCase()}`} unitLabel={label} rows={tableRows(group("animalImpacts"))} />
              ) : (
                <p className="m-0 text-[14px] italic text-ink-3">Pas de facteur animal sourcé pour cet aliment (donnée manquante).</p>
              )}
            </Panel>
            {alt && <AnimalBetterBox items={alt.animalBetter.filter((x) => x.category === "animaux")} title={animalBetterTitle("animaux", ORIGIN)} />}
          </div>
          <aside aria-label="À retenir" className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
            <MedicalNote />
          </aside>
        </div>
      </div>
    </>
  );
}
