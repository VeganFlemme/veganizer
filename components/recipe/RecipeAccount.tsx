"use client";
// Disabled in V1 (decision of Matt, 2026-11-01): the default Supabase SMTP only mails team members.
// Re-enable after a custom domain and SMTP (docs/ROADMAP.md, "Hors V1").

import { useEffect, useId, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Draft } from "./RecipeBuilder";

interface SavedRecipe {
  id: string;
  name_fr: string;
  servings: number;
  created_at: string;
}

/**
 * Optional account: e-mail magic link (Supabase Auth). Recipes are saved private
 * (is_published = false, created_by = auth.uid(): RLS policies of the initial migration).
 */
export function RecipeAccount({ draft, onLoad }: { draft: Draft; onLoad: (d: Draft) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const id = useId();

  useEffect(() => {
    const db = createClient();
    const code = new URLSearchParams(window.location.search).get("code");
    const init = code ? db.auth.exchangeCodeForSession(code).then(() => window.history.replaceState(null, "", "/recette")) : Promise.resolve();
    init
      .then(() => db.auth.getSession())
      .then(({ data }) => setSession(data.session))
      .catch(() => setMessage("La connexion a échoué : redemandez un lien."));
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    createClient()
      .from("dishes")
      .select("id, name_fr, servings, created_at")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSaved(data ?? []));
  }, [session]);

  async function signIn() {
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/recette` },
    });
    setMessage(error ? "L’envoi du lien a échoué. Vérifiez l’adresse et réessayez." : "Lien envoyé : ouvrez-le depuis votre boîte mail pour vous connecter.");
  }

  async function save() {
    if (!session || draft.ingredients.length === 0) return;
    const db = createClient();
    const { data: dish, error } = await db
      .from("dishes")
      .insert({
        slug: `recette-${crypto.randomUUID()}`,
        name_fr: draft.name.trim() || "Ma recette",
        kind: draft.ingredients.some((i) => i.isAnimal) ? "animal" : "vegetal",
        servings: draft.servings,
        is_published: false,
        created_by: session.user.id,
      })
      .select("id, name_fr, servings, created_at")
      .single();
    if (error || !dish) return setMessage("L’enregistrement a échoué.");
    const { error: e2 } = await db
      .from("dish_ingredients")
      .insert(draft.ingredients.map((i) => ({ dish_id: dish.id, food_code: i.code, grams: i.grams })));
    if (e2) return setMessage("L’enregistrement des ingrédients a échoué.");
    setSaved([dish, ...saved]);
    setMessage("Recette enregistrée (visible par vous seul·e).");
  }

  async function load(r: SavedRecipe) {
    const db = createClient();
    const { data } = await db.from("dish_ingredients").select("food_code, grams, foods(name_fr, is_animal)").eq("dish_id", r.id);
    onLoad({
      name: r.name_fr,
      servings: r.servings,
      ingredients: (data ?? []).map((i) => ({
        code: i.food_code,
        name: i.foods?.name_fr ?? i.food_code,
        grams: Number(i.grams),
        isAnimal: i.foods?.is_animal ?? false,
      })),
    });
  }

  if (!session) {
    return (
      <details className="text-sm">
        <summary className="cursor-pointer underline">Enregistrer mes recettes (facultatif, avec un compte)</summary>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label htmlFor={`${id}-e`} className="flex flex-col gap-1">
            <span>Adresse e-mail</span>
            <input
              id={`${id}-e`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
            />
          </label>
          <button
            type="button"
            onClick={signIn}
            disabled={!email.includes("@")}
            className="rounded-lg border border-zinc-500 px-4 py-2 hover:bg-zinc-100 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            Recevoir un lien de connexion
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-700">Sans compte, votre recette reste enregistrée dans ce navigateur.</p>
        {message && <p role="status" className="mt-1">{message}</p>}
      </details>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span>Connecté·e : {session.user.email}</span>
        <button
          type="button"
          onClick={save}
          disabled={draft.ingredients.length === 0}
          className="rounded-lg border border-emerald-800 px-3 py-1 text-emerald-900 hover:bg-emerald-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          Enregistrer cette recette
        </button>
        <button type="button" onClick={() => createClient().auth.signOut()} className="underline">
          Se déconnecter
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {saved.length > 0 && (
        <ul className="list-disc pl-5">
          {saved.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => load(r)} className="underline">
                {r.name_fr}
              </button>{" "}
              ({r.servings} portions)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
