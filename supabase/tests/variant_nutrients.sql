-- Test: an Agribalyse variant reads the nutrients of its Ciqual food through
-- foods.ciqual_code in dish_nutrients; a variant without ciqual_code
-- contributes no nutrients and lowers mass_coverage.
-- Self-contained fixtures, everything rolled back.
-- Run: npm run test:db   (supabase db query --linked -f supabase/tests/variant_nutrients.sql)

begin;

insert into public.foods (code, name_fr, source_id) values
  ('TEST_CIQ', 'Test aliment Ciqual', 'ciqual-2025');
insert into public.foods (code, name_fr, ciqual_code, source_id) values
  ('TEST_CIQ_1', 'Test variante liée', 'TEST_CIQ', 'agribalyse-3.2'),
  ('TEST_OTHER_1', 'Test variante non liée', null, 'agribalyse-3.2');
insert into public.food_nutrients (food_code, nutrient_id, value_per_100g, source_id) values
  ('TEST_CIQ', 'protein_g', 10, 'ciqual-2025');

with d as (
  insert into public.dishes (slug, name_fr, kind, servings)
  values ('test-variant-nutrients', 'Test', 'vegetal', 2)
  returning id
)
insert into public.dish_ingredients (dish_id, food_code, grams)
select id, 'TEST_CIQ_1', 200 from d
union all
select id, 'TEST_OTHER_1', 200 from d;

do $$
declare
  r record;
  n int;
begin
  select count(*) into n from public.dish_nutrients where slug = 'test-variant-nutrients';
  if n <> 1 then
    raise exception 'FAIL: expected 1 nutrient row, got %', n;
  end if;

  select * into r from public.dish_nutrients
  where slug = 'test-variant-nutrients' and nutrient_id = 'protein_g';
  -- 200 g × 10 g/100 g / 2 servings = 10 g per serving
  if r.per_serving is distinct from 10 then
    raise exception 'FAIL: per_serving = %, expected 10 (variant must read TEST_CIQ nutrients)', r.per_serving;
  end if;
  -- only the linked variant (200 g of 400 g) has nutrient data
  if r.mass_coverage is distinct from 0.5 then
    raise exception 'FAIL: mass_coverage = %, expected 0.5', r.mass_coverage;
  end if;
  raise notice 'PASS: variant reads Ciqual nutrients (per_serving=%, mass_coverage=%)', r.per_serving, r.mass_coverage;
end $$;

select 'PASS' as variant_nutrients_test;

rollback;
