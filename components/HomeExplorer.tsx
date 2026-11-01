"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryParam } from "@/components/compare/useQueryParam";
import { Dot } from "@/components/ui/Dot";
import type { AutoCard } from "@/lib/compare/auto-data";
import type { SearchHit } from "@/lib/compare/data";
import { COVERAGE_WARNING } from "@/lib/compare/config";
import { formatForUnit, signedGap } from "@/lib/format";
import { fold, fuzzyMatch } from "@/lib/fuzzy";


/** Home: dark band with the search, featured verdict, verified pairs face to face (same scale), catalogue hits. */
export function HomeExplorer({ cards, featured }: { cards: AutoCard[]; featured: ReactNode }) {
  const [urlQ] = useQueryParam("q");
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? urlQ ?? "";
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();

  function search(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setHits([]);
        setStatus("idle");
        return;
      }
      setStatus("loading");
      try {
        const res = await fetch(`/api/recherche?q=${encodeURIComponent(value.trim())}`);
        const body = (await res.json()) as { hits: SearchHit[] };
        setHits(body.hits ?? []);
        setStatus(res.ok ? "idle" : "error");
      } catch {
        setStatus("error");
      }
    }, 250);
  }

  // A query coming from the header search (/?q=…) is searched once the page is in the browser.
  useEffect(() => {
    if (urlQ) search(urlQ);
  }, [urlQ]);

  const searching = query.trim().length >= 2;
  const shown = useMemo(() => {
    const q = fold(query.trim());
    const list = [...cards].sort((a, b) => (b.co2 ?? -1) - (a.co2 ?? -1));
    if (!q) return list;
    // Tolerant to typos (« bourguinon »), step 4 reviews.
    return list.filter((p) => fuzzyMatch([p.name, p.description ?? "", p.plant.name].join(" "), q));
  }, [cards, query]);
  const ours = shown.filter((c) => c.kind === "paire");
  const agb = shown.filter((c) => c.kind === "agribalyse");
  const simplified = hits.filter((h) => h.kind === "aliment" && h.isAnimal && h.hasAlternatives);
  const others = hits.filter((h) => h.kind === "aliment" && !(h.isAnimal && h.hasAlternatives));

  return (
    <>
      <section className="on-dark bg-ink text-white">
        <div className={`mx-auto grid max-w-[1440px] items-center gap-x-12 px-5 pb-[84px] pt-2 md:px-8 md:pb-[100px] md:pt-8 min-[1440px]:px-12 ${featured ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:pb-14" : ""}`}>
        <div className="flex min-w-0 flex-col gap-[22px]">
          <h1 className="m-0 max-w-[820px] text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[56px]">Ton plat face à sa version végétale, données à l’appui.</h1>
          <p className="m-0 max-w-[720px] text-[16px] leading-normal text-on-dark-2 md:text-[18px]">
            Nutrition, santé, environnement, protection animale, économie : un score et un vainqueur par catégorie, chaque chiffre sourcé.
          </p>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex max-w-[640px] flex-col gap-2 lg:max-w-[880px]">
            <label htmlFor={inputId} className="text-[14px] font-semibold text-on-dark-1">
              Quel plat veux-tu comparer ?
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => {
                  setTyped(e.target.value);
                  search(e.target.value);
                }}
                placeholder="Bœuf bourguignon, lasagnes, bolo…"
                className="h-[52px] min-w-0 flex-1 rounded-select border-0 bg-surface px-4 text-[16px] text-ink"
              />
              <a href="#resultats" className="flex h-[52px] items-center rounded-select bg-plant-on-dark px-[18px] text-[16px] font-extrabold text-ink no-underline hover:text-ink">
                Comparer
              </a>
            </div>
          </form>
        </div>
        {/* Desktop: the example card fills the right half of the hero (designer review, S24d). */}
        {featured && <div className="hidden lg:block">{featured}</div>}
        </div>
      </section>

      {featured && <div className="mx-auto -mt-[60px] w-full max-w-[1440px] px-5 md:px-8 lg:hidden">{featured}</div>}

      <section id="resultats" aria-labelledby={`${inputId}-p`} className="mx-auto flex w-full max-w-[1440px] min-[1440px]:px-12 scroll-mt-4 flex-col px-5 pb-2 pt-[30px] md:px-8">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 id={`${inputId}-p`} className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
            {searching ? `Plats comparés : ${shown.length}` : `${cards.length} plats comparés`}
          </h2>
        </div>
        <span className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-[6px]">
            <Dot series="animal" /> Plat animal
          </span>
          <span className="inline-flex items-center gap-[6px]">
            <Dot series="plant" /> Version végétale avec la protéine la plus proche (au choix sur chaque page)
          </span>
        </span>
        <p className="sr-only" role="status" aria-live="polite">
          {shown.length} plat{shown.length > 1 ? "s" : ""} trouvé{shown.length > 1 ? "s" : ""}
        </p>
        {shown.length === 0 ? (
          <p className="border-t border-line py-3 text-ink-2">Aucun plat comparé ne correspond. Voir les résultats du catalogue ci-dessous.</p>
        ) : (
          <>
            <CardList title="Nos recettes" unit="kg CO₂e par portion" cards={ours} />
            <CardList title="Plats Agribalyse, recette officielle" unit="kg CO₂e pour 100 g" cards={agb} />
          </>
        )}
        <span className="border-t border-line pt-[10px] text-[12px] leading-normal text-ink-3">
          Une échelle par liste (par portion pour nos recettes, pour 100 g pour les plats Agribalyse). Agribalyse 3.2 (ADEME), recettes détaillées ingrédient par ingrédient.
        </span>
      </section>

      {searching && (
        <section aria-live="polite" aria-label="Résultats du catalogue" className="mx-auto flex w-full max-w-[1440px] min-[1440px]:px-12 flex-col gap-4 px-5 pt-5 md:px-8">
          {status === "loading" && <p className="m-0 text-[14px] text-ink-2">Recherche dans le catalogue…</p>}
          {status === "error" && <p className="m-0 text-[14px] text-animal-note">La recherche dans le catalogue est indisponible pour le moment.</p>}
          <HitList title="Comparaisons simplifiées" hits={simplified} />
          <HitList title="Autres aliments du catalogue" hits={others} food />
        </section>
      )}
    </>
  );
}

function HitList({ title, hits, food = false }: { title: string; hits: SearchHit[]; food?: boolean }) {
  if (hits.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 flex items-center gap-2 text-[17px] font-extrabold">
        <span className="rounded-full bg-track px-[10px] py-[2px] text-[12px] font-bold">{food ? "Aliment" : "Comparaison simplifiée"}</span> {title}
      </h3>
      <ul className="m-0 flex list-none flex-col rounded-panel bg-surface p-0">
        {hits.map((h) => (
          <li key={h.ref} className="border-t border-line-soft first:border-t-0">
            <Link href={`/aliment/${encodeURIComponent(h.ref)}`} className="flex min-h-11 items-center px-4 py-2 text-ink no-underline hover:bg-ground hover:text-ink">
              {h.name}
              {food && h.isAnimal && <span className="text-[13px] text-ink-2">&nbsp;— pas encore d’alternative proposée</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardList({ title, unit, cards }: { title: string; unit: string; cards: AutoCard[] }) {
  if (cards.length === 0) return null;
  const max = Math.max(0, ...cards.flatMap((p) => [p.co2 ?? 0, p.plant.co2 ?? 0]));
  const w = (x: number | null) => (max > 0 && x != null && x > 0 ? `${(x / max) * 100}%` : "0%");
  return (
    <div className="flex flex-col pt-3">
      <div className="flex items-baseline justify-between gap-3 pb-1">
        <h3 className="m-0 text-[17px] font-extrabold">
          {title} <span className="num text-[14px] font-semibold text-ink-2">({cards.length})</span>
        </h3>
        <span className="text-[13px] text-ink-2">{unit}</span>
      </div>
      <ul className="m-0 grid list-none gap-x-10 p-0 md:grid-cols-2 xl:grid-cols-3 min-[1920px]:grid-cols-4">
        {cards.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="flex flex-col gap-[7px] border-t border-line py-3 text-ink no-underline hover:bg-surface/60 hover:text-ink">
              <span className="flex items-baseline justify-between gap-2">
                <span title={p.name} className="min-w-0 text-[16px] font-bold md:truncate">
                  {p.name}
                </span>
                <span className="num text-[16px] font-extrabold">{signedGap(p.plant.co2Reduction)}</span>
              </span>
              <span className="num grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-[2px] text-[13px] text-ink-2">
                <span className="pr-[6px] text-right">{formatForUnit(p.co2, "kg CO2e")}</span>
                <span className="flex justify-end" aria-hidden="true">
                  <span className="h-2 rounded-l-[4px] bg-animal" style={{ width: w(p.co2) }} />
                </span>
                <span className="flex" aria-hidden="true">
                  <span className="h-2 rounded-r-[4px] bg-plant" style={{ width: w(p.plant.co2) }} />
                </span>
                <span className="pl-[6px]">{formatForUnit(p.plant.co2, "kg CO2e")}</span>
              </span>
              <span title={p.plant.name} className="text-[13px] text-ink-2 md:truncate">
                Avec : {p.plant.name}
                {p.plant.coverage != null && p.plant.coverage < COVERAGE_WARNING && " (données partielles)"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
