// Cross-check: the TypeScript engine and the SQL view dish_impacts must agree.
// Creates a test dish in the LINKED Supabase project, reads the view and the raw
// rows, then deletes the dish (even on failure).
// Run: npm run test:db:scoring   (needs `supabase link`)
import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dishTotals, type Dish, type FoodData, type ScoringData } from "@/lib/scoring";

type Row = Record<string, string | number | boolean | null>;

function query(sql: string): Row[] {
  const out = execFileSync("supabase", ["db", "query", "--linked", "--output-format", "json", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out.slice(out.indexOf("{"))).rows as Row[];
}

const num = (x: Row[string]): number | null => (x == null ? null : Number(x));

// Real Agribalyse/Ciqual codes. 13014 (strawberry, bare Ciqual code) has no
// impact on purpose: it checks that missing data lowers coverage the same way.
const SLUG = `test-scoring-verify-${Date.now()}`;
const dish: Dish = {
  servings: 3,
  ingredients: [
    { foodCode: "6253", grams: 250 }, // Boeuf, steak haché 10% MG cuit
    { foodCode: "20505", grams: 300 }, // Lentille, cuite
    { foodCode: "13014_2", grams: 150 }, // Fraise, de saison, crue
    { foodCode: "13014", grams: 100 }, // Fraise, crue (no Agribalyse impact)
    { foodCode: "17130", grams: 15 }, // Huile de colza
  ],
};
const codes = dish.ingredients.map((i) => `'${i.foodCode}'`).join(",");

describe("dishTotals vs dish_impacts (linked Supabase)", () => {
  let view: Row[] = [];
  let data: ScoringData;

  beforeAll(() => {
    query(`
      with d as (
        insert into public.dishes (slug, name_fr, kind, servings, is_published)
        values ('${SLUG}', 'Plat de test (vérification moteur)', 'animal', ${dish.servings}, false)
        returning id
      )
      insert into public.dish_ingredients (dish_id, food_code, grams)
      select d.id, v.code, v.grams from d, (values ${dish.ingredients
        .map((i) => `('${i.foodCode}', ${i.grams})`)
        .join(",")}) as v(code, grams);`);

    view = query(`select * from public.dish_impacts where slug = '${SLUG}'`);

    const foods = query(`select code, is_animal, animal_category from public.foods where code in (${codes})`);
    const impacts = query(
      `select food_code, indicator_id, value_per_kg, low_per_kg, high_per_kg, dqr, source_id
       from public.food_impacts where food_code in (${codes})`,
    );
    data = { foods: {}, categoryFactors: {} };
    for (const f of foods) {
      const fd: FoodData = {
        nutrients: {},
        impacts: {},
        isAnimal: Boolean(f.is_animal),
        animalCategory: (f.animal_category as string) ?? null,
      };
      data.foods[f.code as string] = fd;
    }
    for (const r of impacts) {
      data.foods[r.food_code as string]!.impacts[r.indicator_id as string] = {
        value: Number(r.value_per_kg),
        low: num(r.low_per_kg),
        high: num(r.high_per_kg),
        dqr: num(r.dqr),
        sourceId: r.source_id as string,
      };
    }
  }, 60_000);

  afterAll(() => {
    query(`delete from public.dishes where slug = '${SLUG}'`);
    const left = query(`select count(*)::int as n from public.dishes where slug like 'test-scoring-verify-%'`);
    expect(Number(left[0].n)).toBe(0);
  }, 60_000);

  it("gives the same CO2e per serving as the view", () => {
    const t = dishTotals(dish, data);
    const v = view.find((r) => r.indicator_id === "ghg_100y_kgco2e");
    expect(v).toBeDefined();
    const ghg = t.impacts.ghg_100y_kgco2e;
    console.log(
      `CO2e per serving — view: ${v!.per_serving}  engine: ${ghg.perServing}  coverage: ${v!.mass_coverage} / ${ghg.massCoverage}`,
    );
    expect(ghg.perServing).toBeCloseTo(Number(v!.per_serving), 9);
    expect(ghg.massCoverage).toBeCloseTo(Number(v!.mass_coverage), 9);
    expect(ghg.massCoverage).toBeLessThan(1);
  });

  it("agrees with the view on every indicator (value, range, DQR, coverage)", () => {
    const t = dishTotals(dish, data);
    expect(Object.keys(t.impacts).sort()).toEqual(view.map((r) => r.indicator_id as string).sort());
    for (const r of view) {
      const a = t.impacts[r.indicator_id as string];
      expect(a.perServing).toBeCloseTo(Number(r.per_serving), 9);
      expect(a.lowPerServing).toBeCloseTo(Number(r.low_per_serving), 9);
      expect(a.highPerServing).toBeCloseTo(Number(r.high_per_serving), 9);
      expect(a.massCoverage).toBeCloseTo(Number(r.mass_coverage), 9);
      expect(a.worstDqr).toBe(num(r.worst_dqr));
    }
  });
});
