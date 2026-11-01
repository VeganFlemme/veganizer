"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import type { PairCard, SearchHit } from "@/lib/compare/data";
import { COVERAGE_WARNING } from "@/lib/compare/config";
import { gapSentence } from "@/lib/format";

const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function PairGrid({ pairs }: { pairs: PairCard[] }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();

  function onQuery(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(async () => {
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

  const simplified = hits.filter((h) => h.kind === "aliment" && h.isAnimal && h.hasAlternatives);
  const others = hits.filter((h) => h.kind === "aliment" && !(h.isAnimal && h.hasAlternatives));
  const shown = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return pairs;
    return pairs.filter((p) => fold([p.name, p.description ?? "", ...p.variants.map((v) => v.name)].join(" ")).includes(q));
  }, [pairs, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="font-medium">
          Rechercher un plat
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="ex. lasagnes, bolo, steak haché, yaourt…"
          className="w-full rounded-lg border border-zinc-400 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
        />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {shown.length} plat{shown.length > 1 ? "s" : ""} trouvé{shown.length > 1 ? "s" : ""}
      </p>
      {query.trim().length >= 2 && (
        <h3 className="flex items-center gap-2 font-semibold">
          <ReliabilityBadge kind="verified" /> Paires vérifiées
        </h3>
      )}
      {shown.length === 0 ? (
        <p className="text-zinc-700">Aucune paire vérifiée ne correspond. Voir les résultats du catalogue ci-dessous.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/compare/${p.slug}`}
                className="flex h-full flex-col gap-2 rounded-xl border border-zinc-300 p-4 transition hover:border-emerald-700 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <span className="text-lg font-semibold">{p.name}</span>
                <ul className="flex flex-col gap-1 text-sm text-zinc-800">
                  {p.variants.map((v) => (
                    <li key={v.variant}>
                      <span className="font-medium">{v.variant === "maison" ? "Maison" : "Du commerce"} :</span> {v.name}
                      {v.co2Reduction != null && (
                        <>
                          {" "}
                          — <span className="text-emerald-800">{gapSentence(v.co2Reduction)} de CO₂e</span>
                        </>
                      )}
                      {v.coverage != null && v.coverage < COVERAGE_WARNING && <span className="text-amber-800"> (données partielles)</span>}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto text-sm font-medium text-emerald-800 underline">Voir la comparaison</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-4" aria-live="polite">
          {status === "loading" && <p className="text-sm text-zinc-700">Recherche dans le catalogue…</p>}
          {status === "error" && <p className="text-sm text-amber-800">La recherche dans le catalogue est indisponible pour le moment.</p>}
          <HitList title="Comparaisons simplifiées" kind="simplified" hits={simplified} />
          <HitList title="Autres aliments du catalogue" kind="food" hits={others} />
        </div>
      )}
    </div>
  );
}

function ReliabilityBadge({ kind }: { kind: "verified" | "simplified" | "food" }) {
  const label = { verified: "Paire vérifiée", simplified: "Comparaison simplifiée", food: "Aliment" }[kind];
  const cls = {
    verified: "border-emerald-800 bg-emerald-50 text-emerald-900",
    simplified: "border-amber-800 bg-amber-50 text-amber-900",
    food: "border-zinc-500 bg-zinc-50 text-zinc-800",
  }[kind];
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function HitList({ title, kind, hits }: { title: string; kind: "simplified" | "food"; hits: SearchHit[] }) {
  if (hits.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <ReliabilityBadge kind={kind} /> {title}
      </h3>
      <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-300">
        {hits.map((h) => (
          <li key={h.ref}>
            <Link href={`/aliment/${encodeURIComponent(h.ref)}`} className="block px-4 py-2 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-emerald-700">
              {h.name}
              {kind === "food" && h.isAnimal && <span className="text-sm text-zinc-700"> — pas encore d’alternative proposée</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
