"use client";

import dynamic from "next/dynamic";

// The recipe builder reads the draft saved in this browser: no server rendering.
export const RecipeBuilderClient = dynamic(() => import("./RecipeBuilder").then((m) => m.RecipeBuilder), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-[1200px] px-5 text-ink-2 md:px-8">Chargement de l’outil…</p>,
});
