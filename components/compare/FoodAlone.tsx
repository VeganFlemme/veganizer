"use client";

import { DataTable } from "@/components/ui/DataTable";
import { DishTitle } from "@/components/ui/DishTitle";
import { MedicalNote } from "@/components/ui/MedicalNote";
import type { FoodPageModel } from "@/lib/compare/food";
import { Panel, tableRows } from "./PairView";
import Link from "next/link";

/** /aliment/[code] without plant alternative (a plant food, or no reviewed rule): its own values per 100 g. */
export function FoodAlone({ model, badge }: { model: FoodPageModel; badge: React.ReactNode }) {
  const rows = model.ownRows.perServing;
  const group = (g: string) => rows.filter((r) => r.group === g);
  return (
    <>
      <section className="on-dark bg-ink text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 pb-[22px] pt-1 md:px-8 md:pb-10 md:pt-7 min-[1440px]:px-12">
          <span className="self-start text-[13px] font-semibold text-on-dark-3 md:text-[14px]">{badge}</span>
          <DishTitle animal={model.name} vegetal={null} />
          <p className="m-0 max-w-[760px] text-[14px] leading-normal text-on-dark-2">
            Code Ciqual / Agribalyse {model.code}
            {model.foodSubgroup && <> · {model.foodSubgroup}</>}.{" "}
            {model.isAnimal
              ? "Pas encore d’alternative végétale proposée pour cet aliment."
              : "Aliment sans ingrédient animal identifié dans les bases Ciqual et Agribalyse (ce n’est pas une garantie : vérifie la liste des ingrédients)."}{" "}
            <Link href="/methodologie#comparaison-simplifiee" className="text-on-dark-1 underline hover:text-white">
              Méthode
            </Link>
          </p>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[14px] px-5 pb-8 pt-5 md:px-8 min-[1440px]:px-12">
        <Panel title="Nutrition, pour 100 g">
          <DataTable caption="Nutrition, pour 100 g" unitLabel="Pour 100 g" rows={tableRows(group("nutrients"))} footer="Ciqual 2025 (ANSES)." />
        </Panel>
        <Panel title="Environnement, pour 100 g">
          <DataTable caption="Environnement, pour 100 g" unitLabel="Pour 100 g" rows={tableRows(group("impacts"))} footer="Agribalyse 3.2 (ADEME). Valeurs négatives affichées telles que publiées." />
        </Panel>
        <MedicalNote />
      </div>
    </>
  );
}
