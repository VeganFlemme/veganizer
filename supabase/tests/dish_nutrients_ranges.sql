-- Test: a Ciqual value « < x » is a known interval [0 ; x] in dish_nutrients (migration
-- 20261103000000): covered, low bound with 0, high bound with x, no central value; « traces »
-- stays missing. Fixtures rolled back. Values are fictitious.
begin;
insert into public.foods (code, name_fr, source_id) values
  ('TEST_EXACT', 'Test exact', 'ciqual-2025'), ('TEST_LT', 'Test inférieur', 'ciqual-2025'), ('TEST_TR', 'Test traces', 'ciqual-2025');
insert into public.food_nutrients (food_code, nutrient_id, value_per_100g, qualifier, source_id) values
  ('TEST_EXACT', 'salt_g', 1, null, 'ciqual-2025'),
  ('TEST_LT', 'salt_g', null, '< 2', 'ciqual-2025'),
  ('TEST_TR', 'salt_g', null, 'traces', 'ciqual-2025'),
  ('TEST_EXACT', 'protein_g', 10, null, 'ciqual-2025'),
  ('TEST_LT', 'protein_g', 5, null, 'ciqual-2025');
insert into public.dishes (slug, name_fr, kind, servings) values ('test-ranges', 'Test', 'vegetal', 2);
insert into public.dish_ingredients (dish_id, food_code, grams)
select id, c, 100 from public.dishes, unnest(array['TEST_EXACT', 'TEST_LT', 'TEST_TR']) c where slug = 'test-ranges';
select case
  when (select per_serving from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'salt_g') is null
   and (select low_per_serving from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'salt_g') = 0.5
   and (select high_per_serving from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'salt_g') = 1.5
   and (select round(mass_coverage, 4) from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'salt_g') = 0.6667
   and (select censored from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'salt_g')
   and (select per_serving from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'protein_g') = 7.5
   and not (select censored from public.dish_nutrients where slug = 'test-ranges' and nutrient_id = 'protein_g')
  then 'PASS' else 'FAIL' end as dish_nutrients_ranges_test;
rollback;
