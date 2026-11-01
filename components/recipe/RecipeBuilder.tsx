"use client";

import { useId, useMemo, useRef, useState } from "react";
import { CompareView } from "@/components/compare/CompareView";
import type { IngredientHit } from "@/lib/compare/data";
import {
  applySubstitutions,
  buildRecipePage,
  type RecipeData,
  type RecipeFood,
  type RecipeIngredient,
  type SubstitutionRule,
} from "@/lib/compare/recipe";
import { formatInt } from "@/lib/format";

export interface DraftIngredient {
  code: string;
  name: string;
  grams: number;
  isAnimal: boolean;
}

export interface Draft {
  name: string;
  servings: number;
  ingredients: DraftIngredient[];
}

type Loaded = RecipeData & { substitutions: SubstitutionRule[]; recipeFoods: RecipeFood[] };

const STORAGE_KEY = "veganizer:recette";
const EMPTY: Draft = { name: "", servings: 4, ingredients: [] };

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const d = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Draft | null;
    return d && Array.isArray(d.ingredients) ? d : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function RecipeBuilder() {
  // Rendered in the browser only (RecipeBuilderClient): the saved draft can be read at once.
  const [draft, setDraftState] = useState<Draft>(readDraft);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<IngredientHit[]>([]);
  const [data, setData] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  function setDraft(d: Draft) {
    setDraftState(d);
    setData(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
      // storage unavailable: the draft only lives in this tab
    }
  }

  function onQuery(v: string) {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) return setHits([]);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recette/aliments?q=${encodeURIComponent(v.trim())}`);
        setHits(((await res.json()) as { hits: IngredientHit[] }).hits ?? []);
      } catch {
        setHits([]);
      }
    }, 250);
  }

  function add(h: IngredientHit) {
    if (draft.ingredients.some((i) => i.code === h.code)) return;
    setDraft({ ...draft, ingredients: [...draft.ingredients, { code: h.code, name: h.name, grams: 100, isAnimal: h.isAnimal }] });
    setQuery("");
    setHits([]);
  }

  async function analyse() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/recette/donnees?codes=${draft.ingredients.map((i) => encodeURIComponent(i.code)).join(",")}`);
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Loaded);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const valid = draft.ingredients.length > 0 && draft.ingredients.every((i) => i.grams > 0) && draft.servings > 0;

  const result = useMemo(() => {
    if (!data) return null;
    const ingredients: RecipeIngredient[] = draft.ingredients.map((i) => ({ code: i.code, grams: i.grams }));
    const foods = Object.fromEntries(data.recipeFoods.map((f) => [f.code, f]));
    const sub = applySubstitutions(ingredients, foods, data.substitutions);
    const model = buildRecipePage({ name: draft.name, servings: draft.servings, ingredients }, sub.ingredients, data);
    return { sub, model, foods };
  }, [data, draft]);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={`${id}-t`} className="flex flex-col gap-4 rounded-xl border border-zinc-300 p-4">
        <h2 id={`${id}-t`} className="text-xl font-semibold">
          Ma recette
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_max-content]">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Nom (facultatif)</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value.slice(0, 80) })}
              className="rounded-lg border border-zinc-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
              placeholder="ex. Gratin de ma grand-mère"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Portions</span>
            <input
              type="number"
              min={1}
              max={50}
              inputMode="numeric"
              value={draft.servings}
              onChange={(e) => setDraft({ ...draft, servings: Math.max(1, Math.min(50, Math.round(Number(e.target.value) || 1))) })}
              className="w-24 rounded-lg border border-zinc-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
            />
          </label>
        </div>

        <div className="relative flex flex-col gap-1">
          <label htmlFor={`${id}-q`} className="font-medium">
            Ajouter un ingrédient
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="ex. steak haché cuit, lardons, crème, pâtes cuites…"
            autoComplete="off"
            className="rounded-lg border border-zinc-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
          />
          <p className="text-xs text-zinc-700">
            Aliments simples seulement (pas de plat préparé), pesés tels que mangés : cuits si vous les mangez cuits.
          </p>
          {hits.length > 0 && (
            <ul role="listbox" aria-label="Suggestions" className="max-h-72 overflow-auto rounded-lg border border-zinc-300 bg-white shadow">
              {hits.map((h) => (
                <li key={h.code}>
                  <button
                    type="button"
                    onClick={() => add(h)}
                    className="block w-full px-3 py-2 text-left hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
                  >
                    {h.name} <span className="text-xs text-zinc-700">(code {h.code})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {draft.ingredients.length > 0 && (
          <ul className="flex flex-col gap-2">
            {draft.ingredients.map((i, k) => (
              <li key={i.code} className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="sr-only">Grammes de {i.name}</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={i.grams}
                    onChange={(e) => {
                      const ingredients = [...draft.ingredients];
                      ingredients[k] = { ...i, grams: Math.max(0, Number(e.target.value) || 0) };
                      setDraft({ ...draft, ingredients });
                    }}
                    className="w-24 rounded-lg border border-zinc-400 px-2 py-1 focus-visible:outline-2 focus-visible:outline-emerald-700"
                  />
                  g
                </label>
                <span className="flex-1">{i.name}</span>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((x) => x.code !== i.code) })}
                  className="rounded border border-zinc-400 px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
                  aria-label={`Retirer ${i.name}`}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!valid || status === "loading"}
            onClick={analyse}
            className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white hover:bg-emerald-900 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {status === "loading" ? "Calcul…" : "Analyser et voir la version végétale"}
          </button>
          {draft.ingredients.length > 0 && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY)}
              className="rounded-lg border border-zinc-500 px-4 py-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              Tout effacer
            </button>
          )}
        </div>
        {status === "error" && <p role="alert" className="text-red-800">Le calcul a échoué. Réessayez plus tard.</p>}
        <p className="text-sm text-zinc-700">
          <strong>Enregistrer mes recettes en ligne : bientôt.</strong> Pour l’instant, ta recette reste enregistrée dans ce navigateur.
        </p>
      </section>

      {result && (
        <>
          <section aria-labelledby={`${id}-s`} className="flex flex-col gap-2 rounded-xl border border-zinc-300 p-4">
            <h2 id={`${id}-s`} className="text-xl font-semibold">
              Version végétale : les remplacements proposés
            </h2>
            {result.sub.changes.length === 0 ? (
              <p>Aucun ingrédient animal identifié : la recette est comparée à elle-même.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {result.sub.changes.map((c) => (
                  <li key={c.from}>
                    <strong>{result.foods[c.from]?.name_fr ?? c.from}</strong> ({formatInt(c.grams)} g) →{" "}
                    <strong>{result.foods[c.to]?.name_fr ?? c.to}</strong> ({formatInt(c.newGrams)} g). {c.justification}
                  </li>
                ))}
              </ul>
            )}
            {result.sub.unmatched.length > 0 && (
              <p className="text-sm text-amber-800">
                Pas encore de remplacement proposé pour : {result.sub.unmatched.map((c) => result.foods[c]?.name_fr ?? c).join(", ")} (gardé tel quel).
              </p>
            )}
            <p className="text-xs text-zinc-700">
              Remplacements tirés d’une table relue, même masse sauf mention : vérifiez le goût et les quantités pour votre recette.
            </p>
          </section>
          <CompareView model={result.model} />
        </>
      )}
    </div>
  );
}
