"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { PairCard } from "@/lib/compare/data";
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
  const inputId = useId();
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex. lasagnes, burger, quiche…"
          className="w-full rounded-lg border border-zinc-400 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
        />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {shown.length} plat{shown.length > 1 ? "s" : ""} trouvé{shown.length > 1 ? "s" : ""}
      </p>
      {shown.length === 0 ? (
        <p className="text-zinc-700">Aucun plat ne correspond pour l’instant. Essayez un autre mot.</p>
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
    </div>
  );
}
