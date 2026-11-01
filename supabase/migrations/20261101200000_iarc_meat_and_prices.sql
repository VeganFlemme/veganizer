-- =====================================================================
-- Veganizer — IARC meat classification, Open Prices observations, price views
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. IARC Monographs vol. 114 classification of the food itself
--    'rouge'       : unprocessed mammalian muscle meat (§ 1.1.1, p. 37) → Group 2A
--    'transformée' : meat transformed by salting, curing, smoking… (§ 1.1.3, p. 37) → Group 1
--    null          : neither, or not classified (offal, game, mixed dishes…)
--    Reviewed list: pipeline/iarc_meat.csv, imported by pipeline/iarc.py.
-- ---------------------------------------------------------------------
alter table public.foods
  add column iarc_meat text check (iarc_meat in ('rouge', 'transformée'));

comment on column public.foods.iarc_meat is
  'IARC vol. 114 category of the food: rouge (red meat, Group 2A) or transformée (processed meat, Group 1). Null = not classified.';

-- ---------------------------------------------------------------------
-- 2. Prices: one row per observation, idempotent import by external id
-- ---------------------------------------------------------------------
alter table public.prices
  add column external_id text;

alter table public.prices
  add constraint prices_source_external_id_key unique (source_id, external_id);

-- ---------------------------------------------------------------------
-- 3. Median price per kg over the last 12 months, published only with
--    at least 5 observations (fewer = donnée manquante).
-- ---------------------------------------------------------------------
create view public.food_prices with (security_invoker = true) as
select
  p.food_code,
  p.source_id,
  percentile_cont(0.5) within group (order by p.price_eur) as median_eur_per_kg,
  min(p.price_eur)  as min_eur_per_kg,
  max(p.price_eur)  as max_eur_per_kg,
  count(*)          as observations,
  min(p.observed_on) as first_observed_on,
  max(p.observed_on) as last_observed_on
from public.prices p
where p.per = 'kg'
  and p.food_code is not null
  and p.region = 'France'
  and p.observed_on >= current_date - interval '12 months'
group by p.food_code, p.source_id
having count(*) >= 5;

-- Price of a dish per serving from the median prices; mass_coverage < 0,95 → warn / no total.
create view public.dish_prices with (security_invoker = true) as
with totals as (
  select dish_id, sum(grams) as total_g
  from public.dish_ingredients
  group by dish_id
)
select
  d.id                                                          as dish_id,
  d.slug,
  fp.source_id,
  sum(di.grams / 1000.0 * fp.median_eur_per_kg) / d.servings    as per_serving,
  sum(di.grams / 1000.0 * fp.min_eur_per_kg) / d.servings       as low_per_serving,
  sum(di.grams / 1000.0 * fp.max_eur_per_kg) / d.servings       as high_per_serving,
  sum(di.grams) / t.total_g                                     as mass_coverage
from public.dishes d
join totals t                   on t.dish_id = d.id
join public.dish_ingredients di on di.dish_id = d.id
join public.food_prices fp      on fp.food_code = di.food_code
group by d.id, d.slug, fp.source_id, d.servings, t.total_g;

grant select on public.food_prices, public.dish_prices to anon, authenticated;
grant select on public.food_prices, public.dish_prices to service_role;

-- ---------------------------------------------------------------------
-- 4. Source details checked on 2026-11-01
-- ---------------------------------------------------------------------
update public.sources
set url = 'https://publications.iarc.who.int/564',
    notes = 'Définitions § 1.1.1 et 1.1.3 (p. 37) ; évaluation § 6.3 (p. 501). Le groupe indique la solidité des preuves, pas l''ampleur du risque.'
where id = 'iarc-114';
