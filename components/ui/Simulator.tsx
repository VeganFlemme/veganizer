"use client";

import { useId, useState } from "react";
import { CLIMATE_MAIN, CLIMATE_REFERENCE_YEAR } from "@/lib/compare/config";
import type { SimInput } from "@/lib/compare/view";
import { avoidedClimateCost, simulate, type MonetizationFactor, type MonetizationRule } from "@/lib/scoring";
import { animalsSparedParts, formatEur, formatForUnit, formatInt, MISSING, NBSP } from "@/lib/format";

// Unit conversions only: 12 months and 52 weeks per year (simulate() counts per week).
const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = 52;
const FREQUENCIES = [
  { id: "mois", label: "1×/mois", perWeek: MONTHS_PER_YEAR / WEEKS_PER_YEAR, text: "une fois par mois" },
  { id: "sem", label: "1×/sem.", perWeek: 1, text: "une fois par semaine" },
  { id: "2sem", label: "2×/sem.", perWeek: 2, text: "deux fois par semaine" },
];
const YEARS = [1, 5, 10];
const ANIMALS = "animals_killed_land";

function Chips<T extends string | number>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-[6px]">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className={`h-11 cursor-pointer rounded-[10px] border-0 text-[14px] font-bold ${o.id === value ? "bg-surface text-ink" : "bg-white/8 text-white hover:bg-white/15"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** "Et si je change ?": frequency × duration → kg CO2e, climate cost, slaughter avoided. */
export function Simulator({
  sim,
  dishName,
  plantName,
  factors,
  rules,
  animalsCounted,
}: {
  sim: SimInput;
  dishName: string;
  plantName: string;
  factors: MonetizationFactor[];
  rules: MonetizationRule[];
  /** false when the animal dish has no animal factor (donnée manquante). */
  animalsCounted: boolean;
}) {
  const [freq, setFreq] = useState("sem");
  const [years, setYears] = useState(1);
  const [shared, setShared] = useState<string | null>(null);
  const id = useId();
  const f = FREQUENCIES.find((x) => x.id === freq)!;
  const s = simulate(f.perWeek, years, sim.animal, sim.vegetal);
  const co2 = s.impacts[CLIMATE_MAIN]?.avoided ?? null;
  const cost = avoidedClimateCost(s, CLIMATE_REFERENCE_YEAR, factors, { indicatorId: CLIMATE_MAIN, rules });
  const animals = animalsCounted ? (s.animalImpacts[ANIMALS]?.avoided ?? null) : null;
  const spared = animalsSparedParts(animals);

  const shareText = `En remplaçant « ${dishName} » par « ${plantName} » ${f.text} pendant ${years === 1 ? "1 an" : `${years} ans`}, j’éviterais environ ${formatForUnit(co2, "kg CO2e")}${NBSP}kg CO₂e (Agribalyse 3.2). Et toi ?`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Veganizer", text: shareText, url: window.location.href });
      else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        setShared("Texte et lien copiés.");
      }
    } catch {
      setShared(null);
    }
  }

  const big = "text-[24px] font-extrabold tracking-[-0.02em] md:text-[26px]";
  return (
    <section aria-labelledby={`${id}-t`} className="on-dark flex flex-col gap-[14px] rounded-panel bg-ink p-5 text-white md:p-[22px]">
      <h2 id={`${id}-t`} className="m-0 text-[17px] font-extrabold md:text-[19px]">
        Et si je change ?
      </h2>
      <Chips label="Fréquence" options={FREQUENCIES.map((x) => ({ id: x.id, label: x.label }))} value={freq} onChange={setFreq} />
      <Chips label="Durée" options={YEARS.map((y) => ({ id: y, label: y === 1 ? "1 an" : `${y} ans` }))} value={years} onChange={setYears} />
      <dl aria-live="polite" className="m-0 grid grid-cols-3 gap-[10px] border-t border-white/15 pt-[10px]">
        <div className="flex flex-col-reverse justify-end gap-[2px]">
          <dt className="text-[12px] text-on-dark-3">kg CO₂e évités</dt>
          <dd className={`m-0 ${big}`}>{co2 == null ? <span className="text-[15px] italic text-on-dark-3">{MISSING}</span> : formatForUnit(co2, "kg CO2e")}</dd>
        </div>
        <div className="flex flex-col-reverse justify-end gap-[2px]">
          <dt className="text-[12px] text-on-dark-3">coût climat évité (valeur {CLIMATE_REFERENCE_YEAR})</dt>
          <dd className={`m-0 ${big}`}>{cost == null ? <span className="text-[15px] italic text-on-dark-3">{MISSING}</span> : formatEur(cost.eur)}</dd>
        </div>
        <div className="flex flex-col-reverse justify-end gap-[2px]">
          <dt className="text-[12px] text-on-dark-3">{spared?.noun ?? "animaux épargnés"} (estimation basse)</dt>
          <dd className={`m-0 ${big}`}>{spared == null ? <span className="text-[15px] italic text-on-dark-3">{MISSING}</span> : `au moins ${spared.number}`}</dd>
        </div>
      </dl>
      <p className="m-0 text-[12px] leading-normal text-on-dark-3">
        {formatInt(s.servings)} portions remplacées. Estimations basses ; un nombre d’animaux par kg est une moyenne statistique, pas un animal précis.
        Coût climat : valeur de l’action pour le climat {CLIMATE_REFERENCE_YEAR} (France Stratégie){cost ? `, ${formatEur(cost.eurPerKg)} par kg CO₂e` : ""}.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={share} className="h-11 cursor-pointer rounded-btn border-0 bg-plant-on-dark px-[18px] text-[15px] font-extrabold text-ink">
          Partager ce résultat
        </button>
        <span role="status" className="text-[13px] text-on-dark-2">
          {shared}
        </span>
      </div>
    </section>
  );
}
