-- Test: food_prices_best keeps one source per food (RNM before Open Prices) and
-- needs at least 5 observations in 12 months; dish_prices_best reports coverage.
-- Self-contained fixtures, everything rolled back. Values are fictitious.
begin;

insert into public.foods (code, name_fr, source_id) values
  ('TEST_PRICE_A', 'Test prix A', 'ciqual-2025'),
  ('TEST_PRICE_B', 'Test prix B', 'ciqual-2025');

insert into public.prices (food_code, price_eur, per, region, observed_on, source_id, external_id)
select 'TEST_PRICE_A', 2, 'kg', 'France', current_date - 10, 'rnm', 'test-rnm-' || g from generate_series(1, 5) g
union all
select 'TEST_PRICE_A', 9, 'kg', 'France', current_date - 10, 'open-prices', 'test-op-' || g from generate_series(1, 5) g
union all  -- only 4 observations: not published
select 'TEST_PRICE_B', 3, 'kg', 'France', current_date - 10, 'open-prices', 'test-opb-' || g from generate_series(1, 4) g;

with d as (
  insert into public.dishes (slug, name_fr, kind, servings) values ('test-best-prices', 'Test', 'vegetal', 2) returning id
)
insert into public.dish_ingredients (dish_id, food_code, grams)
select d.id, v.code, v.g from d, (values ('TEST_PRICE_A', 500), ('TEST_PRICE_B', 500)) v(code, g);

select case
  when (select source_id from public.food_prices_best where food_code = 'TEST_PRICE_A') = 'rnm'
   and (select median_eur_per_kg from public.food_prices_best where food_code = 'TEST_PRICE_A') = 2
   and not exists (select 1 from public.food_prices_best where food_code = 'TEST_PRICE_B')
   and (select round(per_serving::numeric, 4) from public.dish_prices_best where slug = 'test-best-prices') = 0.5
   and (select round(mass_coverage::numeric, 2) from public.dish_prices_best where slug = 'test-best-prices') = 0.5
  then 'PASS' else 'FAIL' end as best_prices_test;

rollback;
