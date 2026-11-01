"use client";

import dynamic from "next/dynamic";

// The recipe builder reads the draft saved in this browser: no server rendering.
export const RecipeBuilderClient = dynamic(() => import("./RecipeBuilder").then((m) => m.RecipeBuilder), {
  ssr: false,
  // Same footprint as the empty builder, so that nothing moves when it appears (CLS).
  loading: () => (
    <div className="mx-auto w-full max-w-[1440px] min-[1440px]:px-12 px-5 md:px-8">
      <div className="flex min-h-[505px] items-start rounded-panel bg-surface p-5 text-ink-2 shadow-card md:min-h-[400px] md:p-6">Chargement de l’outil…</div>
    </div>
  ),
});
