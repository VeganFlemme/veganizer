-- S14 — A category factor can be restricted to some foods of the category
-- (e.g. days of lactation per kg of MILK: liquid milks and yogurts only, not cheese, butter or cream,
-- for which no official milk-equivalent coefficient is used: donnée manquante).
alter table public.category_factors
  add column food_codes text[];

comment on column public.category_factors.food_codes is
  'When not null, the factor applies only to these foods.code values; other foods of the category get no value.';

-- Same rule as lib/scoring/totals.ts (perKg). Columns unchanged.
create or replace view public.dish_animal_impacts with (security_invoker = true) as
with factors as (
  select cf.category, cf.indicator_id, cf.source_id, cf.value,
         coalesce(cf.low, cf.value) as low, coalesce(cf.high, cf.value) as high,
         cf.food_codes, null::text[] as kill_food_codes
  from public.category_factors cf
  where cf.per = 'kg'
  union all
  select a.category, a.indicator_id, a.source_id,
         a.value * k.value,
         coalesce(a.low, a.value) * coalesce(k.low, k.value),
         coalesce(a.high, a.value) * coalesce(k.high, k.value),
         a.food_codes, k.food_codes
  from public.category_factors a
  join public.category_factors k
    on k.category = a.category and k.indicator_id = 'animals_killed_land' and k.per = 'kg'
  where a.per = 'animal'
)
select
  d.id                                                     as dish_id,
  d.slug,
  f.indicator_id,
  f.source_id,
  sum(di.grams / 1000.0 * f.value) / d.servings            as per_serving,
  sum(di.grams / 1000.0 * f.low) / d.servings              as low_per_serving,
  sum(di.grams / 1000.0 * f.high) / d.servings             as high_per_serving
from public.dishes d
join public.dish_ingredients di on di.dish_id = d.id
join public.foods fo            on fo.code = di.food_code and fo.is_animal
join factors f                  on f.category = fo.animal_category
                               and (f.food_codes is null or di.food_code = any (f.food_codes))
                               and (f.kill_food_codes is null or di.food_code = any (f.kill_food_codes))
group by d.id, d.slug, f.indicator_id, f.source_id, d.servings;
