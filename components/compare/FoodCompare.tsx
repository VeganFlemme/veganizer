"use client";

import { useState } from "react";
import { BASES } from "@/lib/compare/config";
import type { FoodPageModel } from "@/lib/compare/food";
import type { Basis } from "@/lib/scoring";
import { formatPercent } from "@/lib/format";
import { Card, Rows, Soon, Toggle } from "./CompareView";

// Per 100 g instead of "per serving": no sourced typical portion is used for single foods.
const FOOD_BASES = BASES.map((b) => (b.id === "perServing" ? { ...b, label: "pour 100 g" } : b));

export function FoodCompare({ model }: { model: FoodPageModel }) {
  const [index, setIndex] = useState(0);
  const [basis, setBasis] = useState<Basis>("perServing");
  const alt = model.alternatives[index];

  if (!alt) {
    return (
      <div className="flex flex-col gap-4">
        <Toggle label="Base de comparaison" options={FOOD_BASES} value={basis} onChange={setBasis} />
        <Card id="valeurs" title="Valeurs de cet aliment">
          <Rows rows={model.ownRows[basis]} sources={model.sources} animalName={model.name} vegetalName="(même aliment)" />
        </Card>
      </div>
    );
  }

  const nutrition = alt.rows[basis].filter((r) => r.group === "nutrients");
  const climate = alt.rows[basis].filter((r) => r.group === "impacts");
  const animals = alt.rows[basis].filter((r) => r.group === "animalImpacts");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-300 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Alternative végétale proposée</span>
          <Toggle label="Choisir l’alternative" options={model.alternatives.map((a, i) => ({ id: String(i), label: a.name }))} value={String(index)} onChange={(v) => setIndex(Number(v))} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Comparer</span>
          <Toggle label="Base de comparaison" options={FOOD_BASES} value={basis} onChange={setBasis} />
        </div>
        <p className="text-sm text-zinc-700">
          <strong>Pourquoi cette alternative :</strong> {alt.rule}.{" "}
          {alt.proteinGapPercent != null && (
            <>
              Protéines pour 100 g : {alt.proteinGapPercent >= 0 ? "+" : "−"}
              {formatPercent(Math.abs(alt.proteinGapPercent))} par rapport à l’aliment d’origine.
            </>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id="nutrition" title="Nutrition">
          <Rows rows={nutrition} sources={model.sources} animalName={model.name} vegetalName={alt.name} />
        </Card>
        <Card id="climat" title="Climat et environnement">
          <Rows rows={climate} sources={model.sources} animalName={model.name} vegetalName={alt.name} />
        </Card>
        <Card id="animaux" title="Animaux">
          {animals.length > 0 ? (
            <Rows rows={animals} sources={model.sources} animalName={model.name} vegetalName={alt.name} />
          ) : (
            <Soon>Pas de facteur animal sourcé pour cet aliment (donnée manquante).</Soon>
          )}
        </Card>
        <Card id="mieux" title="Là où l’aliment d’origine fait mieux">
          {alt.animalBetter.length === 0 ? (
            <p className="text-sm">Sur les critères affichés, l’aliment d’origine ne fait mieux sur aucun point.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {alt.animalBetter.map((x) => (
                <li key={x.criterion}>
                  <strong>{x.name}</strong>
                  {x.partial && " (données partielles)"}
                  {x.conseil ? <> — {x.conseil.titre}. {x.conseil.texte}</> : " — pas encore de conseil sourcé."}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-zinc-700">Informations générales, pas un conseil médical : parlez-en à un professionnel de santé.</p>
        </Card>
      </div>
    </div>
  );
}
