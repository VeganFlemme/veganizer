"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { CLIMATE_MAIN, COVERAGE_WARNING } from "@/lib/compare/config";
import type { MonetizationFactor, MonetizationRule } from "@/lib/scoring";
import { climateCostByYear, simulate, totalClimateCost } from "@/lib/scoring";
import type { VariantView } from "@/lib/compare/view";
import { formatEur, formatInt, formatValue, MISSING } from "@/lib/format";

const HORIZONS = [1, 10];
const noSubscribe = () => () => {};
const currentYear = () => new Date().getFullYear();
const ANIMALS = "animals_killed_land";

function Missing({ why }: { why: string }) {
  return (
    <span className="text-amber-800">
      {MISSING} <span className="text-xs text-zinc-700">({why})</span>
    </span>
  );
}

export function Simulator({
  v,
  dishName,
  factors,
  rules,
}: {
  v: VariantView;
  dishName: string;
  factors: MonetizationFactor[];
  rules: MonetizationRule[];
}) {
  const [perWeek, setPerWeek] = useState(1);
  const [shared, setShared] = useState<string | null>(null);
  const id = useId();
  // The simulator starts with the current year (read in the browser only: the page is static);
  // the carbon value of each year is applied. Null during prerendering.
  const startYear = useSyncExternalStore(noSubscribe, currentYear, () => null);

  const animalRow = v.rows.perServing.find((r) => r.id === ANIMALS);
  const animalsMissing = !animalRow || animalRow.animal == null;
  const animalsPartial = !!animalRow && animalRow.lowCoverage;
  const co2Row = v.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
  const co2Partial = !co2Row || co2Row.lowCoverage;

  const results = HORIZONS.map((years) => {
    const s = simulate(perWeek, years, v.sim.animal, v.sim.vegetal);
    const perYear = simulate(perWeek, 1, v.sim.animal, v.sim.vegetal).impacts[CLIMATE_MAIN]?.avoided ?? null;
    const costs = startYear == null ? [] : climateCostByYear(perYear, startYear, years, factors, { indicatorId: CLIMATE_MAIN, rules });
    return { years, s, costs, total: startYear == null ? null : totalClimateCost(costs) };
  });

  const ten = results[results.length - 1];
  const shareText = `En remplaçant « ${dishName} » par « ${v.dish.name} » ${perWeek} fois par semaine pendant 10 ans, j'éviterais environ ${formatValue(
    ten.s.impacts[CLIMATE_MAIN]?.avoided ?? null,
  )} kg CO₂e (Agribalyse). Et vous ?`;

  async function share() {
    const url = window.location.href;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Veganizer", text: shareText, url });
        setShared("Merci pour le partage !");
      } else {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        setShared("Texte et lien copiés : collez-les où vous voulez.");
      }
    } catch {
      setShared(null);
    }
  }

  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-4 rounded-xl border border-emerald-800 p-4">
      <h2 id={`${id}-t`} className="text-xl font-semibold">
        Et si je le faisais régulièrement ?
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-n`} className="font-medium">
          Je remplace ce plat <strong>{perWeek}</strong> fois par semaine
        </label>
        <input
          id={`${id}-n`}
          type="range"
          min={1}
          max={7}
          step={1}
          value={perWeek}
          onChange={(e) => setPerWeek(Number(e.target.value))}
          aria-valuetext={`${perWeek} fois par semaine`}
          className="w-full max-w-md accent-emerald-800"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-live="polite">
        {results.map(({ years, s, costs, total }) => {
          const co2 = s.impacts[CLIMATE_MAIN];
          const animals = s.animalImpacts[ANIMALS];
          return (
            <div key={years} className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3">
              <h3 className="font-semibold">
                Sur {years === 1 ? "1 an" : `${years} ans`} ({formatInt(s.servings)} portions)
              </h3>
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-zinc-700">Émissions évitées</dt>
                  <dd>
                    {co2?.avoided == null ? (
                      <Missing why="émissions inconnues" />
                    ) : (
                      <>
                        <strong>{formatValue(co2.avoided)} kg CO₂e</strong>
                        {co2.avoidedLow != null && co2.avoidedHigh != null && co2.avoidedLow !== co2.avoidedHigh && (
                          <> (fourchette {formatValue(co2.avoidedLow)} à {formatValue(co2.avoidedHigh)})</>
                        )}
                        {co2Partial && <span className="text-amber-800"> — données partielles</span>}
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-700">Coût climat évité (valeur carbone de chaque année)</dt>
                  <dd>
                    {startYear == null ? (
                      <span className="text-zinc-700">calcul…</span>
                    ) : total == null ? (
                      <Missing why="valeur carbone non publiée pour une des années" />
                    ) : (
                      <strong>
                        {formatEur(total)}{" "}
                        <span className="font-normal text-zinc-700">
                          ({startYear}–{startYear + years - 1})
                        </span>
                      </strong>
                    )}
                    {years > 1 && total != null && (
                      <details className="text-xs text-zinc-700">
                        <summary className="cursor-pointer underline">Année par année</summary>
                        <ul className="mt-1">
                          {costs.map((c) => (
                            <li key={c.year}>
                              {c.year} : {formatEur(c.eur)} ({formatEur(c.eurPerKg)}/kg{c.derived ? ", règle de croissance de la source" : ""})
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-700">Animaux épargnés (estimation basse)</dt>
                  <dd>
                    {animalsMissing || animals?.avoided == null ? (
                      <Missing why="pas encore de facteur pour les ingrédients animaux de ce plat" />
                    ) : (
                      <>
                        <strong>{formatValue(animals.avoided)}</strong>
                        {animalsPartial && <span className="text-amber-800"> au moins (certains ingrédients sans donnée)</span>}
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-700">Euros économisés en courses</dt>
                  <dd>
                    {v.price.animal && v.price.vegetal && v.price.animal.coverage >= COVERAGE_WARNING && v.price.vegetal.coverage >= COVERAGE_WARNING ? (
                      <strong>{formatEur((v.price.animal.value - v.price.vegetal.value) * s.servings)}</strong>
                    ) : (
                      <Missing why="prix observés insuffisants" />
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-700">
                    Minutes de vie en bonne santé{" "}
                    <span className="rounded border border-zinc-400 px-1 text-xs">HENI · usage non commercial à vérifier</span>
                  </dt>
                  <dd>
                    <Missing why="indice HENI pas encore intégré" />
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-zinc-700">
        « Et si 10 % des Français le faisaient ? » : nous n’avons pas encore de donnée sourcée sur la fréquence de consommation de ce plat
        (étude INCA 3 de l’ANSES à intégrer). Nous préférons ne rien afficher plutôt qu’un chiffre inventé.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={share}
          className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Partager
        </button>
        {shared && (
          <span role="status" className="text-sm text-emerald-800">
            {shared}
          </span>
        )}
      </div>
    </section>
  );
}
