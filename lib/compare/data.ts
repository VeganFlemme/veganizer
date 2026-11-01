import "server-only";
import { cacheLife } from "next/cache";
import conseilsFile from "@/data/conseils.json";
import santeFile from "@/data/sante.json";
import { createPublicClient } from "@/lib/supabase/public";
import type { Conseil } from "@/lib/scoring";
import { CIQUAL_SOURCE, CLIMATE_COST_YEARS, CLIMATE_INDICATORS, CLIMATE_MAIN } from "./config";
import { buildFoodPage, displayName, type FoodPageModel } from "./food";
import type { RecipeData, RecipeFood, SubstitutionRule } from "./recipe";
import { buildPairPage, reductionPercent, type IarcEntry, type PairPageModel, type PnnsEntry, type RawPairData } from "./view";

// Supabase caps a response at 1000 rows: a full page means rows may be missing.
const MAX_ROWS = 1000;

function rows<T>(res: { data: T[] | null; error: { message: string } | null }, what: string): T[] {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  const data = res.data ?? [];
  if (data.length >= MAX_ROWS) throw new Error(`${what}: ${data.length} rows, results may be truncated`);
  return data;
}

/** Reads every row of a query, 1000 at a time (the query must have a stable order). */
async function paged<T>(
  what: string,
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += MAX_ROWS) {
    const res = await query(from, from + MAX_ROWS - 1);
    if (res.error) throw new Error(`${what}: ${res.error.message}`);
    const data = res.data ?? [];
    out.push(...data);
    if (data.length < MAX_ROWS) return out;
  }
}

export interface PairCard {
  slug: string;
  name: string;
  description: string | null;
  /** kg CO2e per serving of the animal dish (dish_impacts view); null = missing. */
  co2: number | null;
  variants: { variant: "maison" | "commerce"; name: string; co2: number | null; co2Reduction: number | null; coverage: number | null }[];
}

/** Published pairs for the home page grid, with the CO2e gap read from the dish_impacts view. */
export async function listPairs(): Promise<PairCard[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  const pairs = rows(
    await db.from("dish_pairs").select("animal_dish_id, vegan_dish_id, variant").eq("is_published", true),
    "dish_pairs",
  );
  const ids = [...new Set(pairs.flatMap((p) => [p.animal_dish_id, p.vegan_dish_id]))];
  if (ids.length === 0) return [];
  const [dishes, impacts] = await Promise.all([
    db.from("dishes").select("id, slug, name_fr, description").in("id", ids).eq("is_published", true),
    db.from("dish_impacts").select("dish_id, per_serving, mass_coverage").in("dish_id", ids).eq("indicator_id", CLIMATE_MAIN),
  ]);
  const d = new Map(rows(dishes, "dishes").map((x) => [x.id, x]));
  const co2 = new Map(rows(impacts, "dish_impacts").map((x) => [x.dish_id, x]));

  const cards = new Map<string, PairCard>();
  for (const p of pairs) {
    const a = d.get(p.animal_dish_id);
    const v = d.get(p.vegan_dish_id);
    if (!a || !v || (p.variant !== "maison" && p.variant !== "commerce")) continue;
    const ca = co2.get(a.id);
    const cv = co2.get(v.id);
    const card = cards.get(a.id) ?? { slug: a.slug, name: a.name_fr, description: a.description, co2: ca?.per_serving ?? null, variants: [] };
    card.variants.push({
      variant: p.variant,
      name: v.name_fr,
      co2: cv?.per_serving ?? null,
      co2Reduction: reductionPercent(ca?.per_serving ?? null, cv?.per_serving ?? null),
      coverage: ca && cv ? Math.min(Number(ca.mass_coverage), Number(cv.mass_coverage)) : null,
    });
    cards.set(a.id, card);
  }
  for (const c of cards.values()) c.variants.sort((x, y) => (x.variant === "maison" ? -1 : y.variant === "maison" ? 1 : 0));
  return [...cards.values()].sort((x, y) => x.name.localeCompare(y.name, "fr"));
}

/** Everything /compare/[slug] needs, computed with lib/scoring. null = no published pair. */
export async function getPairPage(slug: string): Promise<PairPageModel | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();

  const animal = rows(
    await db.from("dishes").select("id, slug, name_fr, kind, servings, description").eq("slug", slug).eq("kind", "animal").eq("is_published", true),
    "dishes",
  )[0];
  if (!animal) return null;
  const pairs = rows(
    await db.from("dish_pairs").select("vegan_dish_id, variant, rationale").eq("animal_dish_id", animal.id).eq("is_published", true),
    "dish_pairs",
  );
  if (pairs.length === 0) return null;
  const vegetal = rows(
    await db.from("dishes").select("id, slug, name_fr, kind, servings, description").in("id", pairs.map((p) => p.vegan_dish_id)).eq("is_published", true),
    "dishes",
  );
  const dishIds = [animal.id, ...vegetal.map((v) => v.id)];
  const ingredients = rows(await db.from("dish_ingredients").select("dish_id, food_code, grams, note").in("dish_id", dishIds), "dish_ingredients");
  const codes = [...new Set(ingredients.map((i) => i.food_code))];
  const foods = rows(await db.from("foods").select("code, name_fr, is_animal, animal_category, ciqual_code, iarc_meat, food_subgroup").in("code", codes), "foods");
  const nutrientCodes = [...new Set(foods.map((f) => f.ciqual_code ?? f.code))];

  const [nutrientValues, impacts, categoryFactors, nutrients, indicators, sources, factors, rules, prices, foodPrices] = await Promise.all([
    paged("food_nutrients", (from, to) =>
      db.from("food_nutrients").select("food_code, nutrient_id, value_per_100g, qualifier, source_id").in("food_code", nutrientCodes).eq("source_id", CIQUAL_SOURCE)
        .order("food_code").order("nutrient_id").range(from, to),
    ),
    db.from("food_impacts").select("food_code, indicator_id, value_per_kg, low_per_kg, high_per_kg, dqr, source_id").in("food_code", codes).in("indicator_id", CLIMATE_INDICATORS),
    db.from("category_factors").select("category, indicator_id, value, low, high, source_id, unit_basis, notes, per, food_codes"),
    db.from("nutrients").select("id, name_fr, unit"),
    db.from("indicators").select("id, name_fr, unit, higher_is_better, pillar"),
    db.from("sources").select("id, name, publisher, version, license, commercial_use, url"),
    db.from("monetization_factors").select("indicator_id, year, eur_per_unit, method, source_id").eq("indicator_id", CLIMATE_MAIN),
    db.from("monetization_rules").select("indicator_id, method, growth_rate, start_year, cap_year, source_id").eq("indicator_id", CLIMATE_MAIN),
    db.from("dish_prices_best").select("dish_id, source_ids, per_serving, low_per_serving, high_per_serving, mass_coverage, first_observed_on, last_observed_on").in("dish_id", dishIds),
    db.from("food_prices_best").select("food_code, source_id, median_eur_per_kg, observations, first_observed_on, last_observed_on, place, derived_from, yield_pct").in("food_code", codes),
  ]);

  const raw: RawPairData = {
    animal,
    vegetal,
    pairs,
    ingredients,
    foods,
    nutrientValues,
    impacts: rows(impacts, "food_impacts"),
    categoryFactors: rows(categoryFactors, "category_factors"),
    nutrients: rows(nutrients, "nutrients"),
    indicators: rows(indicators, "indicators"),
    sources: rows(sources, "sources"),
    monetizationFactors: rows(factors, "monetization_factors").map((f) => ({
      indicatorId: f.indicator_id, year: f.year, eurPerUnit: Number(f.eur_per_unit), method: f.method, sourceId: f.source_id,
    })),
    monetizationRules: rows(rules, "monetization_rules").map((r) => ({
      indicatorId: r.indicator_id, method: r.method, growthRate: Number(r.growth_rate), startYear: r.start_year, capYear: r.cap_year, sourceId: r.source_id,
    })),
    conseils: conseilsFile.conseils as Conseil[],
    climateCostYears: CLIMATE_COST_YEARS,
    dishPrices: rows(prices, "dish_prices_best").flatMap((p) =>
      p.dish_id && p.per_serving != null && p.mass_coverage != null
        ? [
            {
              dish_id: p.dish_id,
              source_ids: p.source_ids ?? [],
              per_serving: Number(p.per_serving),
              low_per_serving: p.low_per_serving,
              high_per_serving: p.high_per_serving,
              mass_coverage: Number(p.mass_coverage),
              first_observed_on: p.first_observed_on,
              last_observed_on: p.last_observed_on,
            },
          ]
        : [],
    ),
    foodPrices: rows(foodPrices, "food_prices_best").flatMap((p) =>
      p.food_code && p.source_id && p.median_eur_per_kg != null
        ? [
            {
              food_code: p.food_code,
              source_id: p.source_id,
              median_eur_per_kg: Number(p.median_eur_per_kg),
              observations: Number(p.observations),
              first_observed_on: p.first_observed_on,
              last_observed_on: p.last_observed_on,
              place: p.place,
              derived_from: p.derived_from,
              yield_pct: p.yield_pct,
            },
          ]
        : [],
    ),
    iarc: santeFile.iarc as IarcEntry[],
    pnns: santeFile.pnns as PnnsEntry[],
    eatLancet: santeFile.eatLancet as PnnsEntry[],
  };
  return buildPairPage(raw);
}

export interface SourceListRow {
  id: string;
  name: string;
  publisher: string | null;
  version: string | null;
  url: string | null;
  license: string;
  commercial_use: boolean | null;
  share_alike: boolean;
  accessed_on: string | null;
  notes: string | null;
}

export async function listSources(): Promise<SourceListRow[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  return rows(
    await db.from("sources").select("id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes").order("id"),
    "sources",
  );
}

/** /aliment/[code]: the food, its plant alternatives (food_alternatives) and the data to compare them. */
export async function getFoodPage(code: string): Promise<FoodPageModel | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const db = createPublicClient();
  const food = rows(
    await db.from("foods").select("code, name_fr, is_animal, animal_category, ciqual_code, iarc_meat, food_subgroup, food_group").eq("code", code),
    "foods",
  )[0];
  if (!food) return null;
  const alternatives = rows(await db.from("food_alternatives").select("plant_code, rank, rule").eq("animal_code", code), "food_alternatives");
  const codes = [code, ...alternatives.map((a) => a.plant_code)];
  const foods = rows(
    await db.from("foods").select("code, name_fr, is_animal, animal_category, ciqual_code, iarc_meat, food_subgroup").in("code", codes),
    "foods",
  );
  const nutrientCodes = [...new Set(foods.map((f) => f.ciqual_code ?? f.code))];
  const [nutrientValues, impacts, categoryFactors, nutrients, indicators, sources] = await Promise.all([
    paged("food_nutrients", (from, to) =>
      db.from("food_nutrients").select("food_code, nutrient_id, value_per_100g, qualifier, source_id").in("food_code", nutrientCodes).eq("source_id", CIQUAL_SOURCE)
        .order("food_code").order("nutrient_id").range(from, to),
    ),
    db.from("food_impacts").select("food_code, indicator_id, value_per_kg, low_per_kg, high_per_kg, dqr, source_id").in("food_code", codes).in("indicator_id", CLIMATE_INDICATORS),
    db.from("category_factors").select("category, indicator_id, value, low, high, source_id, unit_basis, notes, per, food_codes"),
    db.from("nutrients").select("id, name_fr, unit"),
    db.from("indicators").select("id, name_fr, unit, higher_is_better, pillar"),
    db.from("sources").select("id, name, publisher, version, license, commercial_use, url"),
  ]);
  return buildFoodPage({
    code,
    foodGroup: food.food_group,
    foodSubgroup: food.food_subgroup,
    alternatives,
    foods,
    nutrientValues,
    impacts: rows(impacts, "food_impacts"),
    categoryFactors: rows(categoryFactors, "category_factors"),
    nutrients: rows(nutrients, "nutrients"),
    indicators: rows(indicators, "indicators"),
    sources: rows(sources, "sources"),
    conseils: conseilsFile.conseils as Conseil[],
  });
}

export interface SearchHit {
  kind: "paire" | "aliment";
  ref: string;
  name: string;
  isAnimal: boolean;
  hasAlternatives: boolean;
}

/** Catalogue search (Postgres pg_trgm + unaccent, see migration 20261102012000). */
export async function searchCatalog(q: string): Promise<SearchHit[]> {
  const db = createPublicClient();
  const { data, error } = await db.rpc("search_catalog", { q, max_results: 30 });
  if (error) throw new Error(`search_catalog: ${error.message}`);
  return (data ?? []).map((r) => ({
    kind: r.kind === "paire" ? "paire" : "aliment",
    ref: r.ref,
    name: displayName(r.name_fr),
    isAnimal: r.is_animal,
    hasAlternatives: r.has_alternatives,
  }));
}

export interface IngredientHit {
  code: string;
  name: string;
  isAnimal: boolean;
}

/** /recette autocompletion: pure foods only (rule 9), see search_ingredients. */
export async function searchIngredients(q: string): Promise<IngredientHit[]> {
  const db = createPublicClient();
  const { data, error } = await db.rpc("search_ingredients", { q, max_results: 15 });
  if (error) throw new Error(`search_ingredients: ${error.message}`);
  return (data ?? []).map((r) => ({ code: r.code, name: displayName(r.name_fr), isAnimal: r.is_animal }));
}

const MAX_RECIPE_CODES = 40;

/** Everything the browser needs to compute a recipe and its plant version with lib/scoring. */
export async function getRecipeData(
  requested: string[],
): Promise<(RecipeData & { substitutions: SubstitutionRule[]; recipeFoods: RecipeFood[]; cookingYields: { raw_code: string; yield_pct: number }[] }) | null> {
  const db = createPublicClient();
  const subs = rows(await db.from("ingredient_substitutions").select("priority, match_type, match_value, to_code, ratio, ratio_basis, justification"), "ingredient_substitutions");
  const codes = [...new Set([...requested.slice(0, MAX_RECIPE_CODES), ...subs.map((s) => s.to_code)])];
  const foods = rows(await db.from("foods").select("code, name_fr, is_animal, animal_category, ciqual_code, iarc_meat, food_subgroup").in("code", codes), "foods");
  if (foods.length === 0) return null;
  const nutrientCodes = [...new Set(foods.map((f) => f.ciqual_code ?? f.code))];
  const [nutrientValues, impacts, categoryFactors, nutrients, indicators, sources, factors, rules, foodPrices, cookingYields] = await Promise.all([
    paged("food_nutrients", (from, to) =>
      db.from("food_nutrients").select("food_code, nutrient_id, value_per_100g, qualifier, source_id").in("food_code", nutrientCodes).eq("source_id", CIQUAL_SOURCE)
        .order("food_code").order("nutrient_id").range(from, to),
    ),
    db.from("food_impacts").select("food_code, indicator_id, value_per_kg, low_per_kg, high_per_kg, dqr, source_id").in("food_code", codes).in("indicator_id", CLIMATE_INDICATORS),
    db.from("category_factors").select("category, indicator_id, value, low, high, source_id, unit_basis, notes, per, food_codes"),
    db.from("nutrients").select("id, name_fr, unit"),
    db.from("indicators").select("id, name_fr, unit, higher_is_better, pillar"),
    db.from("sources").select("id, name, publisher, version, license, commercial_use, url"),
    db.from("monetization_factors").select("indicator_id, year, eur_per_unit, method, source_id").eq("indicator_id", CLIMATE_MAIN),
    db.from("monetization_rules").select("indicator_id, method, growth_rate, start_year, cap_year, source_id").eq("indicator_id", CLIMATE_MAIN),
    db.from("food_prices_best").select("food_code, source_id, median_eur_per_kg, observations, first_observed_on, last_observed_on, place, derived_from, yield_pct").in("food_code", codes),
    db.from("cooking_yields").select("raw_code, yield_pct").in("raw_code", codes),
  ]);
  return {
    foods,
    recipeFoods: foods.map((f) => ({ code: f.code, name_fr: displayName(f.name_fr), is_animal: f.is_animal, animal_category: f.animal_category, food_subgroup: f.food_subgroup, iarc_meat: f.iarc_meat })),
    substitutions: subs.map((s) => ({
      ...s,
      ratio: Number(s.ratio),
      ratio_basis: s.ratio_basis === "fat_g" || s.ratio_basis === "cooking_yield" ? s.ratio_basis : null,
      match_type: s.match_type as SubstitutionRule["match_type"],
    })),
    cookingYields: rows(cookingYields, "cooking_yields").map((y) => ({ raw_code: y.raw_code, yield_pct: Number(y.yield_pct) })),
    nutrientValues,
    impacts: rows(impacts, "food_impacts"),
    categoryFactors: rows(categoryFactors, "category_factors"),
    nutrients: rows(nutrients, "nutrients"),
    indicators: rows(indicators, "indicators"),
    sources: rows(sources, "sources"),
    monetizationFactors: rows(factors, "monetization_factors").map((f) => ({
      indicatorId: f.indicator_id, year: f.year, eurPerUnit: Number(f.eur_per_unit), method: f.method, sourceId: f.source_id,
    })),
    monetizationRules: rows(rules, "monetization_rules").map((r) => ({
      indicatorId: r.indicator_id, method: r.method, growthRate: Number(r.growth_rate), startYear: r.start_year, capYear: r.cap_year, sourceId: r.source_id,
    })),
    foodPrices: rows(foodPrices, "food_prices_best").flatMap((p) =>
      p.food_code && p.source_id && p.median_eur_per_kg != null
        ? [{ food_code: p.food_code, source_id: p.source_id, median_eur_per_kg: Number(p.median_eur_per_kg), observations: Number(p.observations), first_observed_on: p.first_observed_on, last_observed_on: p.last_observed_on, place: p.place, derived_from: p.derived_from, yield_pct: p.yield_pct }]
        : [],
    ),
    conseils: conseilsFile.conseils as Conseil[],
    climateCostYears: CLIMATE_COST_YEARS,
    iarc: santeFile.iarc as IarcEntry[],
    pnns: santeFile.pnns as PnnsEntry[],
    eatLancet: santeFile.eatLancet as PnnsEntry[],
  };
}
