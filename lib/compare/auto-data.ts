// Loaders of the automatic comparison (suite V1, decision of Matt 17 h 25): animal recipe (official
// AGRIBALYSE recipe when retained), candidate proteins (view protein_candidates), substitution rules.
import "server-only";
import { cacheLife } from "next/cache";
import officialPairs from "@/data/official_pairs.json";
import { createPublicClient } from "@/lib/supabase/public";
import { buildAutoPage, climateWins, NO_CODE_PREFIX, officialIngredients, rankedCandidates, type AutoInput, type CandidateRow, type OfficialRecipeRow } from "./auto";
import { loadRecipeData } from "./data";
import { displayName } from "./food";
import { substitutionContext } from "./recipe";
import type { DishRow, IngredientRow } from "./view";

const OFFICIAL_SOURCE = "agribalyse-3.0-openlca";
const PAIRS = officialPairs.pairs as { slug: string; dishCode: string; sides: string[]; note?: string }[];
// Official dish pages: recipe for 100 g of dish, compared per 100 g like the food pages.
const OFFICIAL_DISH_GRAMS = 100;

function must<T>(res: { data: T[] | null; error: { message: string } | null }, what: string): T[] {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data ?? [];
}

async function candidates(): Promise<CandidateRow[]> {
  const db = createPublicClient();
  return must(await db.from("protein_candidates").select("code, name_fr, food_subgroup, protein_g, fat_g, energy_kcal"), "protein_candidates").flatMap((c) =>
    c.code && c.name_fr && c.protein_g != null && c.fat_g != null && c.energy_kcal != null
      ? [{ code: c.code, name_fr: c.name_fr, food_subgroup: c.food_subgroup, protein_g: Number(c.protein_g), fat_g: Number(c.fat_g), energy_kcal: Number(c.energy_kcal) }]
      : [],
  );
}

async function officialRows(code: string): Promise<OfficialRecipeRow[]> {
  const db = createPublicClient();
  return must(
    await db.from("official_recipes").select("dish_code, flow, food_code, ingredient_fr, kg_per_kg_dish").eq("dish_code", code).eq("is_published", true).eq("source_id", OFFICIAL_SOURCE),
    "official_recipes",
  ).map((r) => ({ ...r, kg_per_kg_dish: Number(r.kg_per_kg_dish) }));
}

type Support = { rest: Omit<NonNullable<Awaited<ReturnType<typeof loadRecipeData>>>, "substitutions" | "recipeFoods" | "cookingYields">; rules: AutoInput["rules"]; context: AutoInput["context"]; candidates: CandidateRow[] };

/** Data of every food of these ingredients, of the candidate proteins and of the rule targets, loaded once. */
async function support(ingredientCodes: string[]): Promise<Support | null> {
  const cands = await candidates();
  const codes = [...new Set([...ingredientCodes.filter((c) => !c.startsWith(NO_CODE_PREFIX)), ...cands.map((c) => c.code)])];
  const data = await loadRecipeData(codes);
  if (!data) return null;
  const { substitutions, recipeFoods, cookingYields, ...rest } = data;
  void recipeFoods;
  return { rest, rules: substitutions, context: substitutionContext({ foods: data.foods, nutrientValues: data.nutrientValues, cookingYields }), candidates: cands };
}

function makeInput(s: Support, animal: DishRow, ingredients: IngredientRow[], recipe: AutoInput["recipe"]): AutoInput {
  return { raw: { ...s.rest, animal, vegetal: [], pairs: [], ingredients, dishPrices: [] }, candidates: s.candidates, rules: s.rules, context: s.context, recipe };
}

async function assemble(animal: DishRow, ingredients: IngredientRow[], recipe: AutoInput["recipe"]): Promise<AutoInput | null> {
  const s = await support(ingredients.map((i) => i.food_code));
  return s ? makeInput(s, animal, ingredients, recipe) : null;
}

/** A published animal dish of our catalogue, its recipe replaced by the official one when retained. */
export async function getAutoInput(slug: string): Promise<AutoInput | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  const animal = must(await db.from("dishes").select("id, slug, name_fr, kind, servings, description").eq("slug", slug).eq("kind", "animal").eq("is_published", true), "dishes")[0];
  if (!animal) return null;
  const ours = must(await db.from("dish_ingredients").select("dish_id, food_code, grams, note").eq("dish_id", animal.id), "dish_ingredients");
  const map = PAIRS.find((p) => p.slug === slug);
  const official = map ? await officialRows(map.dishCode) : [];
  if (map && official.length > 0) {
    const name = must(await db.from("foods").select("name_fr").eq("code", map.dishCode), "foods")[0]?.name_fr;
    return assemble(animal, officialIngredients(animal.id, official, ours, map.sides), {
      kind: "officielle",
      officialCode: map.dishCode,
      officialName: name ? displayName(name) : undefined,
      sidesNote: map.note,
    });
  }
  return assemble(animal, ours, { kind: "type" });
}

/** An AGRIBALYSE composite dish with a retained official recipe, for 100 g. null without an animal ingredient. */
export async function getOfficialDishInput(code: string): Promise<AutoInput | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const official = await officialRows(code);
  if (official.length === 0) return null;
  const db = createPublicClient();
  const food = must(await db.from("foods").select("code, name_fr").eq("code", code), "foods")[0];
  if (!food) return null;
  const animal: DishRow = { id: "A", slug: `aliment-${code}`, name_fr: displayName(food.name_fr), kind: "animal", servings: 1, description: null };
  const ingredients = officialIngredients("A", official, [{ dish_id: "A", food_code: "__mass", grams: OFFICIAL_DISH_GRAMS, note: null }], []);
  const input = await assemble(animal, ingredients, { kind: "officielle", officialCode: code, officialName: animal.name_fr });
  if (!input || rankedCandidates(input).length === 0 || !buildAutoPage(input, rankedCandidates(input)[0].code, { light: true })) return null;
  return input;
}

/** One animal food (100 g), compared to each candidate protein (100 g). */
export async function getFoodAutoInput(code: string): Promise<AutoInput | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  const food = must(await db.from("foods").select("code, name_fr, is_animal").eq("code", code), "foods")[0];
  if (!food?.is_animal) return null;
  const animal: DishRow = { id: "A", slug: `aliment-${code}`, name_fr: displayName(food.name_fr), kind: "animal", servings: 1, description: null };
  const input = await assemble(animal, [{ dish_id: "A", food_code: code, grams: OFFICIAL_DISH_GRAMS, note: null }], { kind: "type" });
  if (!input || !buildAutoPage(input, rankedCandidates(input)[0]?.code ?? "", { light: true })) return null;
  return input;
}

export interface AutoPair {
  input: AutoInput;
  /** First protein of the list (closest), shown by default. */
  defaultCode: string;
  wins: { wins: number; total: number };
}

function summarize(input: AutoInput | null): AutoPair | null {
  if (!input) return null;
  const first = rankedCandidates(input)[0];
  if (!first || !buildAutoPage(input, first.code, { light: true })) return null;
  return { input, defaultCode: first.code, wins: climateWins(input) };
}

export async function getAutoPair(slug: string): Promise<AutoPair | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  return summarize(await getAutoInput(slug));
}

/** Official AGRIBALYSE dish (recipe retained) or animal food, for /aliment/[code]. */
export async function getAutoFood(code: string): Promise<AutoPair | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  return summarize((await getOfficialDishInput(code)) ?? (await getFoodAutoInput(code)));
}

export interface AutoCard {
  href: string;
  name: string;
  description: string | null;
  /** kg CO2e per serving (per 100 g for an AGRIBALYSE dish); null = missing, never 0. */
  co2: number | null;
  plant: { name: string; co2: number | null; co2Reduction: number | null; coverage: number | null };
  /** "paire" = our catalogue (per serving); "agribalyse" = dish with an official recipe (per 100 g). */
  kind: "paire" | "agribalyse";
}

function card(pair: AutoPair, href: string, kind: AutoCard["kind"], description: string | null): AutoCard | null {
  const built = buildAutoPage(pair.input, pair.defaultCode, { light: true });
  const v = built?.model.variants[pair.defaultCode];
  if (!built || !v) return null;
  const co2 = v.rows.perServing.find((r) => r.id === "ghg_100y_kgco2e");
  const choice = built.model.choices.find((c) => c.id === pair.defaultCode);
  return {
    href,
    name: built.model.animal.name,
    description,
    co2: co2?.animal?.value ?? null,
    plant: {
      name: choice?.label ?? v.dish.name,
      co2: co2?.vegetal?.value ?? null,
      co2Reduction: co2?.reductionPercent ?? null,
      coverage: co2?.animal && co2?.vegetal ? Math.min(co2.animal.coverage, co2.vegetal.coverage) : null,
    },
    kind,
  };
}

/** Home catalogue: our dishes, then the AGRIBALYSE dishes with an official recipe and an animal ingredient (one data load for all). */
export async function listAutoCards(): Promise<AutoCard[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  const dishes = must(await db.from("dishes").select("id, slug, name_fr, kind, servings, description").eq("kind", "animal").eq("is_published", true), "dishes");
  const ours = must(await db.from("dish_ingredients").select("dish_id, food_code, grams, note").in("dish_id", dishes.map((d) => d.id)).limit(5000), "dish_ingredients");
  const officialAll = must(
    await db.from("official_recipes").select("dish_code, flow, food_code, ingredient_fr, kg_per_kg_dish").eq("is_published", true).eq("source_id", OFFICIAL_SOURCE).limit(5000),
    "official_recipes",
  ).map((r) => ({ ...r, kg_per_kg_dish: Number(r.kg_per_kg_dish) }));
  const paired = new Set(PAIRS.map((p) => p.dishCode));
  const officialCodes = [...new Set(officialAll.map((r) => r.dish_code))].filter((c) => !paired.has(c));
  const names = new Map(must(await db.from("foods").select("code, name_fr").in("code", officialCodes), "foods").map((f) => [f.code, displayName(f.name_fr)]));

  const entries: { href: string; kind: AutoCard["kind"]; description: string | null; animal: DishRow; ingredients: IngredientRow[]; recipe: AutoInput["recipe"] }[] = [];
  for (const d of dishes) {
    const own = ours.filter((i) => i.dish_id === d.id);
    const map = PAIRS.find((p) => p.slug === d.slug);
    const off = map ? officialAll.filter((r) => r.dish_code === map.dishCode) : [];
    entries.push({
      href: `/compare/${d.slug}`,
      kind: "paire",
      description: d.description,
      animal: d,
      ingredients: map && off.length ? officialIngredients(d.id, off, own, map.sides) : own,
      recipe: map && off.length ? { kind: "officielle", officialCode: map.dishCode } : { kind: "type" },
    });
  }
  for (const code of officialCodes) {
    const animal: DishRow = { id: "A", slug: `aliment-${code}`, name_fr: names.get(code) ?? code, kind: "animal", servings: 1, description: null };
    const rows = officialAll.filter((r) => r.dish_code === code);
    entries.push({
      href: `/aliment/${code}`,
      kind: "agribalyse",
      description: "Recette officielle Agribalyse, pour 100 g.",
      animal,
      ingredients: officialIngredients("A", rows, [{ dish_id: "A", food_code: "__mass", grams: OFFICIAL_DISH_GRAMS, note: null }], []),
      recipe: { kind: "officielle", officialCode: code },
    });
  }
  const s = await support(entries.flatMap((e) => e.ingredients.map((i) => i.food_code)));
  if (!s) return [];
  const out: AutoCard[] = [];
  for (const e of entries) {
    const input = makeInput(s, e.animal, e.ingredients, e.recipe);
    const first = rankedCandidates(input)[0];
    const c = first && card({ input, defaultCode: first.code, wins: { wins: 0, total: 0 } }, e.href, e.kind, e.description);
    if (c) out.push(c);
  }
  return out;
}

/** /recette: data of the user's ingredients and of the candidate proteins (at most 40 user codes). */
export async function getRecipeAutoSupport(codes: string[]): Promise<Omit<AutoInput, "recipe" | "raw"> & { raw: Omit<AutoInput["raw"], "animal" | "vegetal" | "pairs" | "ingredients" | "dishPrices"> } | null> {
  const s = await support(codes.slice(0, 40));
  if (!s) return null;
  return { raw: s.rest, candidates: s.candidates, rules: s.rules, context: s.context };
}
