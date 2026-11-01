-- =====================================================================
-- Corrections after the review of PR #15 (decisions of Matt, 2026-11-01)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. dish_nutrients: Ciqual values published as « < x » are a known interval [0 ; x]
--    (Ciqual 2025 documentation, p. 21: « une valeur maximale »). They count in mass_coverage,
--    add 0 to low_per_serving and x to high_per_serving; per_serving is then null (only the range
--    is known: never x/2, never 0). « traces » stays missing data (Ciqual 2025 documentation,
--    p. 10, § 3.2.3: no rule for recipe calculations). Same rule as lib/scoring/totals.ts.
--    Same columns as before, three added at the end.
-- ---------------------------------------------------------------------
create or replace view public.dish_nutrients with (security_invoker = true) as
with totals as (
  select dish_id, sum(grams) as total_g
  from public.dish_ingredients
  group by dish_id
),
values_per_100g as (
  select fn.food_code, fn.nutrient_id, fn.source_id,
         fn.value_per_100g as value,
         case when fn.value_per_100g is null and fn.qualifier ~ '^<\s*[0-9]+(\.[0-9]+)?$'
              then regexp_replace(fn.qualifier, '^<\s*', '')::numeric end as upper_bound
  from public.food_nutrients fn
)
select
  d.id                                                                as dish_id,
  d.slug,
  v.nutrient_id,
  v.source_id,
  case when bool_or(v.value is null) then null
       else sum(di.grams / 100.0 * v.value) / d.servings end         as per_serving,
  sum(di.grams) / t.total_g                                           as mass_coverage,
  sum(di.grams / 100.0 * coalesce(v.value, 0)) / d.servings           as low_per_serving,
  sum(di.grams / 100.0 * coalesce(v.value, v.upper_bound)) / d.servings as high_per_serving,
  bool_or(v.value is null)                                            as censored
from public.dishes d
join totals t                    on t.dish_id = d.id
join public.dish_ingredients di  on di.dish_id = d.id
join public.foods f              on f.code = di.food_code
join values_per_100g v           on v.food_code = coalesce(f.ciqual_code, f.code)
                                and (v.value is not null or v.upper_bound is not null)
group by d.id, d.slug, v.nutrient_id, v.source_id, d.servings, t.total_g;

grant select on public.dish_nutrients to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. ingredient_substitutions.ratio_basis: how the quantity of the substitute is computed.
--    null          : grams × ratio (as before);
--    'fat_g'       : same quantity of fat, grams × fat of the original / fat of the substitute
--                    (Ciqual values of the two foods; ratio used when one is missing);
--    'cooking_yield': raw meat → product eaten as is, grams × cooking yield of the raw food
--                    (public.cooking_yields, USDA); ratio used when no yield is published.
-- ---------------------------------------------------------------------
alter table public.ingredient_substitutions
  add column ratio_basis text check (ratio_basis in ('fat_g', 'cooking_yield'));
