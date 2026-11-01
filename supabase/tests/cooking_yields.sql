-- Test: a cooked food without a direct price is priced from its raw product / cooking yield,
-- and a direct price always wins. Fixtures rolled back. Values are fictitious.
begin;
insert into public.foods (code, name_fr, source_id) values
  ('TEST_RAW', 'Test cru', 'ciqual-2025'), ('TEST_COOKED', 'Test cuit', 'ciqual-2025'),
  ('TEST_RAW2', 'Test cru 2', 'ciqual-2025'), ('TEST_COOKED2', 'Test cuit 2', 'ciqual-2025');
insert into public.prices (food_code, price_eur, per, region, observed_on, source_id, external_id)
select 'TEST_RAW', 10, 'kg', 'France', current_date - 10, 'rnm', 'test-cy-raw-' || g from generate_series(1, 5) g
union all
select 'TEST_RAW2', 10, 'kg', 'France', current_date - 10, 'rnm', 'test-cy-raw2-' || g from generate_series(1, 5) g
union all
select 'TEST_COOKED2', 3, 'kg', 'France', current_date - 10, 'rnm', 'test-cy-cooked2-' || g from generate_series(1, 5) g;
insert into public.cooking_yields (cooked_code, raw_code, yield_pct, yield_min, yield_max, reference, source_id) values
  ('TEST_COOKED', 'TEST_RAW', 80, 75, 85, 'test', 'usda-cooking-yields-r2'),
  ('TEST_COOKED2', 'TEST_RAW2', 80, null, null, 'test', 'usda-cooking-yields-r2');
select case
  when (select round(median_eur_per_kg::numeric, 3) from public.food_prices_best where food_code = 'TEST_COOKED') = 12.5
   and (select derived_from from public.food_prices_best where food_code = 'TEST_COOKED') = 'TEST_RAW'
   and (select median_eur_per_kg from public.food_prices_best where food_code = 'TEST_COOKED2') = 3
   and (select count(*) from public.food_prices_best where food_code = 'TEST_COOKED2') = 1
  then 'PASS' else 'FAIL' end as cooking_yields_test;
rollback;
