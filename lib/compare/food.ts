// Pure: model of /aliment/[code] ("Comparaison simplifiée"). No network.
// A food is compared, per 100 g / per 100 kcal / per 10 g of protein, with 1 to 3 plant
// alternatives chosen by the reviewed rules of pipeline/auto_alternatives_rules.csv.

import { categoryOf } from "./config";
import { dishTotals, type Basis, type Conseil } from "@/lib/scoring";
import { BASES, VEGAN_WORD } from "./config";
import { rowsFor, scoringData, TOTALS_OPTIONS, type AdvantageView, type CriterionRow, type RawPairData, type SourceRow } from "./view";

export interface AlternativeRow {
  plant_code: string;
  rank: number;
  rule: string;
}

export type FoodRawData = Pick<
  RawPairData,
  "foods" | "nutrientValues" | "impacts" | "categoryFactors" | "nutrients" | "indicators" | "sources" | "conseils"
> & {
  code: string;
  foodGroup: string | null;
  foodSubgroup: string | null;
  alternatives: AlternativeRow[];
};

export interface FoodAlternativeView {
  code: string;
  name: string;
  rule: string;
  rows: Record<Basis, CriterionRow[]>;
  animalBetter: AdvantageView[];
  /** (plant − food) / food protein × 100 per 100 g; null if a value is missing. */
  proteinGapPercent: number | null;
}

export interface FoodPageModel {
  code: string;
  name: string;
  isAnimal: boolean;
  /** Ciqual name shortened when it carries a vegan claim (rule 10). */
  foodGroup: string | null;
  foodSubgroup: string | null;
  alternatives: FoodAlternativeView[];
  /** Values of the food alone (used when there is no alternative). */
  ownRows: Record<Basis, CriterionRow[]>;
  sources: Record<string, SourceRow>;
}

// Rule 10: remove a vegan claim quoted in a source name (never displayed by the site).
const VEGAN_CLAIM = /\s*\((ne )?convient (pas )?aux v[eé]ganes( ou v[eé]g[eé]taliens)?\)/gi;

export function displayName(name: string): string {
  const cleaned = name.replace(VEGAN_CLAIM, "").replace(/\s{2,}/g, " ").trim();
  return VEGAN_WORD.test(cleaned) ? "Aliment (nom non affiché, voir le code)" : cleaned;
}

// Comparison basis of a single food: 100 g eaten as one "serving".
const GRAMS = 100;

export function buildFoodPage(raw: FoodRawData): FoodPageModel | null {
  const food = raw.foods.find((f) => f.code === raw.code);
  if (!food) return null;
  const rawLike = { ...raw, animal: null, vegetal: [], pairs: [], ingredients: [] } as unknown as RawPairData;
  const data = scoringData(rawLike);
  const totals = (code: string) => dishTotals({ servings: 1, ingredients: [{ foodCode: code, grams: GRAMS }] }, data, TOTALS_OPTIONS);
  const own = totals(food.code);
  const usedSources = new Set<string>();
  const byBasis = (a: ReturnType<typeof totals>, v: ReturnType<typeof totals>) =>
    Object.fromEntries(BASES.map((b) => [b.id, rowsFor(a, v, rawLike, b.id)])) as Record<Basis, CriterionRow[]>;

  const alternatives = [...raw.alternatives]
    .sort((x, y) => x.rank - y.rank)
    .flatMap((alt) => {
      const plant = raw.foods.find((f) => f.code === alt.plant_code);
      if (!plant || plant.is_animal) return [];
      const v = totals(plant.code);
      const rows = byBasis(own, v);
      rows.perServing.forEach((r) => r.sourceIds.forEach((s) => usedSources.add(s)));
      const animalBetter: AdvantageView[] = rows.perServing
        .filter((r) => r.winner === "animal" || r.indicativeWinner === "animal")
        .map((r) => ({
          criterion: r.id,
          name: r.name,
          partial: r.winner !== "animal",
          conseil: raw.conseils.find((c: Conseil) => c.criteria.includes(r.id)) ?? null,
          category: categoryOf(r.id),
        }));
      animalBetter.forEach((x) => x.conseil?.sources.forEach((s) => usedSources.add(s.sourceId)));
      const pa = own.nutrients.protein_g?.perServing ?? null;
      const pv = v.nutrients.protein_g?.perServing ?? null;
      return [
        {
          code: plant.code,
          name: displayName(plant.name_fr),
          rule: alt.rule,
          rows,
          animalBetter,
          proteinGapPercent: pa != null && pv != null && pa !== 0 ? ((pv - pa) / pa) * 100 : null,
        },
      ];
    });

  const ownRows = byBasis(own, own);
  ownRows.perServing.forEach((r) => r.sourceIds.forEach((s) => usedSources.add(s)));

  return {
    code: food.code,
    name: displayName(food.name_fr),
    isAnimal: food.is_animal,
    foodGroup: raw.foodGroup,
    foodSubgroup: raw.foodSubgroup,
    alternatives,
    ownRows,
    sources: Object.fromEntries(raw.sources.filter((s) => usedSources.has(s.id)).map((s) => [s.id, s])),
  };
}
