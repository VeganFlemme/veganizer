import "server-only";
import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { missingShare } from "./stats";

const CIQUAL = "ciqual-2025";
const AGRIBALYSE = "agribalyse-3.2";
const KEY_NUTRIENTS = ["protein_g", "vit_b12_ug", "fe_mg", "ca_mg", "fiber_g"] as const;
const NEGATIVE_INDICATORS = ["land_use_pt", "ghg_luc_kgco2e"] as const;

export type SourceInfo = {
  id: string;
  name: string;
  publisher: string | null;
  version: string | null;
  license: string;
};

export type NutrientCoverage = {
  id: string;
  name: string;
  total: number | null;
  numeric: number | null;
  missingShare: number | null;
};

export type NegativeCount = { id: string; name: string; unit: string | null; negatives: number | null };

export type MethodologyStats = {
  sources: SourceInfo[];
  ciqualFoods: number | null;
  agribalyseProducts: number | null;
  nutrients: NutrientCoverage[];
  negatives: NegativeCount[];
  animalFoods: number | null;
  mixedFoods: number | null;
};

/** Figures quoted on /methodologie, read from the database (never hard-coded). */
export async function getMethodologyStats(): Promise<MethodologyStats> {
  "use cache";
  cacheLife("days");
  const db = createPublicClient();
  const count = (r: { count: number | null; error: unknown }) => (r.error ? null : r.count);

  const [sources, nutrientNames, indicatorNames, ciqualFoods, agribalyseProducts, animalFoods, mixedFoods] =
    await Promise.all([
      db.from("sources").select("id, name, publisher, version, license").in("id", [CIQUAL, AGRIBALYSE]),
      db.from("nutrients").select("id, name_fr").in("id", [...KEY_NUTRIENTS]),
      db.from("indicators").select("id, name_fr, unit").in("id", [...NEGATIVE_INDICATORS]),
      db.from("foods").select("code", { count: "exact", head: true }).eq("source_id", CIQUAL),
      db
        .from("food_impacts")
        .select("food_code", { count: "exact", head: true })
        .eq("source_id", AGRIBALYSE)
        .eq("indicator_id", "ghg_100y_kgco2e"),
      db.from("foods").select("code", { count: "exact", head: true }).eq("is_animal", true),
      db
        .from("foods")
        .select("code", { count: "exact", head: true })
        .eq("is_animal", true)
        .is("animal_category", null),
    ]);

  const nutrients = await Promise.all(
    KEY_NUTRIENTS.map(async (id) => {
      const base = () =>
        db
          .from("food_nutrients")
          .select("food_code", { count: "exact", head: true })
          .eq("source_id", CIQUAL)
          .eq("nutrient_id", id);
      const [total, numeric] = await Promise.all([base(), base().not("value_per_100g", "is", null)]);
      const t = count(total);
      const n = count(numeric);
      return {
        id,
        name: nutrientNames.data?.find((x) => x.id === id)?.name_fr ?? id,
        total: t,
        numeric: n,
        missingShare: missingShare(t, n),
      };
    }),
  );

  const negatives = await Promise.all(
    NEGATIVE_INDICATORS.map(async (id) => {
      const res = await db
        .from("food_impacts")
        .select("food_code", { count: "exact", head: true })
        .eq("source_id", AGRIBALYSE)
        .eq("indicator_id", id)
        .lt("value_per_kg", 0);
      const ind = indicatorNames.data?.find((x) => x.id === id);
      return { id, name: ind?.name_fr ?? id, unit: ind?.unit ?? null, negatives: count(res) };
    }),
  );

  return {
    sources: sources.data ?? [],
    ciqualFoods: count(ciqualFoods),
    agribalyseProducts: count(agribalyseProducts),
    nutrients,
    negatives,
    animalFoods: count(animalFoods),
    mixedFoods: count(mixedFoods),
  };
}
