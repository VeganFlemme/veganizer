"use client";

import dynamic from "next/dynamic";

// The recipe builder reads the draft saved in this browser: no server rendering.
export const RecipeBuilderClient = dynamic(() => import("./RecipeBuilder").then((m) => m.RecipeBuilder), {
  ssr: false,
  loading: () => <p className="text-zinc-700">Chargement de l’outil…</p>,
});
