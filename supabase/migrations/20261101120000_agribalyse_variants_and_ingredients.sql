-- =====================================================================
-- Veganizer — Agribalyse variants, per-ingredient detail, inferred state
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. foods: variants and inferred state
--    Agribalyse sometimes splits one Ciqual code into variants (codes
--    '20061_1', '20061_2'…: season, air freight, rehydrated…). Each variant
--    is its own foods row. ciqual_code points to the Ciqual food whose
--    nutrients apply ONLY when the variant is the same food in the same
--    state (see pipeline/agribalyse_variants.csv); otherwise null.
-- ---------------------------------------------------------------------
alter table public.foods
  add column ciqual_code    text references public.foods(code),
  add column state_inferred boolean not null default false;

alter table public.foods
  add constraint foods_ciqual_code_not_self check (ciqual_code is null or ciqual_code <> code);

comment on column public.foods.ciqual_code is
  'Ciqual food providing the nutrients of an Agribalyse variant (same food, same state). Null = no nutrient data.';
comment on column public.foods.state_inferred is
  'true when state was deduced from the food name rather than given by the source.';

create index foods_ciqual_code_idx on public.foods (ciqual_code) where ciqual_code is not null;

-- ---------------------------------------------------------------------
-- 2. Agribalyse "Détail par ingrédient": contribution of each ingredient
--    (and of "Autres étapes") to the impact of 1 kg of product.
-- ---------------------------------------------------------------------
create table public.food_impact_ingredients (
  food_code     text not null references public.foods(code) on delete cascade,
  ingredient    text not null,               -- label as published by Agribalyse
  indicator_id  text not null references public.indicators(id),
  value_per_kg  numeric not null,            -- contribution per kg of finished product
  source_id     text not null references public.sources(id),
  primary key (food_code, ingredient, indicator_id, source_id)
);

alter table public.food_impact_ingredients enable row level security;
create policy "lecture publique" on public.food_impact_ingredients for select using (true);

grant select on public.food_impact_ingredients to anon, authenticated;
grant all    on public.food_impact_ingredients to service_role;

-- ---------------------------------------------------------------------
-- 3. dish_nutrients: a variant reads the nutrients of its Ciqual food.
--    coalesce(ciqual_code, code): a variant without ciqual_code finds no
--    nutrient rows under its own code → excluded, and mass_coverage drops
--    (the UI then shows "donnée manquante" / coverage warning).
--
--    dish_impacts is intentionally unchanged: every variant carries its own
--    Agribalyse impacts under its own code, so impacts must NOT be read
--    through ciqual_code (that would give a variant the impacts of the bare
--    code, e.g. air-freighted beans the impacts of boat-freighted ones).
-- ---------------------------------------------------------------------
create or replace view public.dish_nutrients with (security_invoker = true) as
with totals as (
  select dish_id, sum(grams) as total_g
  from public.dish_ingredients
  group by dish_id
)
select
  d.id                                                   as dish_id,
  d.slug,
  fn.nutrient_id,
  fn.source_id,
  sum(di.grams / 100.0 * fn.value_per_100g) / d.servings as per_serving,
  sum(di.grams) / t.total_g                              as mass_coverage
from public.dishes d
join totals t                    on t.dish_id = d.id
join public.dish_ingredients di  on di.dish_id = d.id
join public.foods f              on f.code = di.food_code
join public.food_nutrients fn    on fn.food_code = coalesce(f.ciqual_code, f.code)
                                and fn.value_per_100g is not null
group by d.id, d.slug, fn.nutrient_id, fn.source_id, d.servings, t.total_g;
