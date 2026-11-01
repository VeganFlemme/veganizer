// Loaders of the automatic comparison (suite V1, decision of Matt 17 h 25): animal recipe (official
// AGRIBALYSE recipe when retained), candidate proteins (view protein_candidates), substitution rules.
import "server-only";
import { cacheLife } from "next/cache";
import officialPairs from "@/data/official_pairs.json";
import { createPublicClient } from "@/lib/supabase/public";
import { buildAutoPage, climateWins, NO_CODE_PREFIX, officialRecipe, rankedCandidates, type AutoInput, type CandidateRow, type OfficialContribution, type OfficialRecipeRow } from "./auto";
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

type Official = { dishCode: string; rows: OfficialRecipeRow[]; contributions: OfficialContribution[]; ours: IngredientRow[]; sides: string[] };

/** 5 quater: an official dish keeps its published impact (contributions + « Autres étapes »). */
function makeInput(s: Support, animal: DishRow, ingredients: IngredientRow[], recipe: AutoInput["recipe"], official?: Official): AutoInput {
  const base = { candidates: s.candidates, rules: s.rules, recipe };
  if (!official) return { ...base, raw: { ...s.rest, animal, vegetal: [], pairs: [], ingredients, dishPrices: [] }, context: s.context };
  const r = officialRecipe({ dishId: animal.id, dishCode: official.dishCode, official: official.rows, contributions: official.contributions, ours: official.ours, sides: official.sides, raw: s.rest, context: s.context });
  return {
    ...base,
    raw: {
      ...s.rest,
      animal: { ...animal, fixed_impacts: r.fixed },
      vegetal: [],
      pairs: [],
      ingredients: r.ingredients,
      foods: [...s.rest.foods, ...r.foods],
      impacts: [...s.rest.impacts, ...r.impacts],
      foodPrices: [...s.rest.foodPrices, ...r.foodPrices],
      dishPrices: [],
    },
    context: r.context,
  };
}

async function assemble(animal: DishRow, ingredients: IngredientRow[], recipe: AutoInput["recipe"], official?: Official): Promise<AutoInput | null> {
  const codes = [
    ...ingredients.map((i) => i.food_code),
    ...(official?.ours.map((i) => i.food_code).filter((c) => c !== "__mass") ?? []),
    ...(official?.rows.flatMap((r) => (r.food_code ? [r.food_code] : [])) ?? []),
  ];
  const s = await support(codes);
  return s ? makeInput(s, animal, ingredients, recipe, official) : null;
}

/** Published contributions of each ingredient of these AGRIBALYSE dishes (detail per ingredient 3.2). */
async function contributionsOf(codes: string[]): Promise<Map<string, OfficialContribution[]>> {
  const db = createPublicClient();
  const out = new Map<string, OfficialContribution[]>();
  for (let from = 0; codes.length; from += 1000) {
    const page = must(
      await db.from("food_impact_ingredients").select("food_code, ingredient, indicator_id, value_per_kg, source_id").in("food_code", codes)
        .order("food_code").order("ingredient").order("indicator_id").range(from, from + 999),
      "food_impact_ingredients",
    );
    for (const r of page) out.set(r.food_code, [...(out.get(r.food_code) ?? []), { ingredient: r.ingredient, indicator_id: r.indicator_id, value_per_kg: Number(r.value_per_kg), source_id: r.source_id }]);
    if (page.length < 1000) break;
  }
  return out;
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
    const contributions = (await contributionsOf([map.dishCode])).get(map.dishCode) ?? [];
    return assemble(animal, [], { kind: "officielle", officialCode: map.dishCode, officialName: name ? displayName(name) : undefined, sidesNote: map.note }, {
      dishCode: map.dishCode,
      rows: official,
      contributions,
      ours,
      sides: map.sides,
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
  const contributions = (await contributionsOf([code])).get(code) ?? [];
  const input = await assemble(animal, [], { kind: "officielle", officialCode: code, officialName: animal.name_fr }, {
    dishCode: code,
    rows: official,
    contributions,
    ours: [{ dish_id: "A", food_code: "__mass", grams: OFFICIAL_DISH_GRAMS, note: null }],
    sides: [],
  });
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

  const contributions = await contributionsOf([...new Set([...officialCodes, ...PAIRS.map((p) => p.dishCode)])]);
  const entries: { href: string; kind: AutoCard["kind"]; description: string | null; animal: DishRow; ingredients: IngredientRow[]; recipe: AutoInput["recipe"]; official?: Official }[] = [];
  for (const d of dishes) {
    const own = ours.filter((i) => i.dish_id === d.id);
    const map = PAIRS.find((p) => p.slug === d.slug);
    const off = map ? officialAll.filter((r) => r.dish_code === map.dishCode) : [];
    const official = map && off.length ? { dishCode: map.dishCode, rows: off, contributions: contributions.get(map.dishCode) ?? [], ours: own, sides: map.sides } : undefined;
    entries.push({
      href: `/compare/${d.slug}`,
      kind: "paire",
      description: d.description,
      animal: d,
      ingredients: official ? [] : own,
      recipe: official ? { kind: "officielle", officialCode: map!.dishCode } : { kind: "type" },
      official,
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
      ingredients: [],
      recipe: { kind: "officielle", officialCode: code },
      official: { dishCode: code, rows, contributions: contributions.get(code) ?? [], ours: [{ dish_id: "A", food_code: "__mass", grams: OFFICIAL_DISH_GRAMS, note: null }], sides: [] },
    });
  }
  const codes = entries.flatMap((e) => [...e.ingredients.map((i) => i.food_code), ...(e.official?.ours.map((i) => i.food_code) ?? []), ...(e.official?.rows.flatMap((r) => (r.food_code ? [r.food_code] : [])) ?? [])]);
  const s = await support(codes.filter((c) => c !== "__mass"));
  if (!s) return [];
  const out: AutoCard[] = [];
  for (const e of entries) {
    const input = makeInput(s, e.animal, e.ingredients, e.recipe, e.official);
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
