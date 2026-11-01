-- S24c (suite V1, step 3 ter, decision of Matt 17 h 25): plant proteins the visitor can choose.
-- Read from the data only (no hand-written list):
--   * no animal ingredient identified (is_animal = false: Ciqual/Agribalyse name and Agribalyse
--     detail per ingredient; rules 9 and 10), with protein, lipids, energy (Ciqual, read through
--     ciqual_code as dish_nutrients) and CO2e (Agribalyse) all known (rule 11: a variant without
--     ciqual_code has no nutrients, so it is not a candidate);
--   * a Ciqual/Agribalyse subgroup of protein foods or plant dishes;
--   * protein brings at least 20 % of the energy: threshold of the claim « riche en protéines »,
--     Regulation (EC) No 1924/2006, annex (unit conversion only: 4 kcal per g of protein, same
--     regulation, Regulation (EU) No 1169/2011 annex XIV);
--   * ready to eat: not dry or raw (the replaced ingredient is weighed as eaten).
-- One row per name: a variant code is dropped when the plain code with the same name qualifies.
create or replace view public.protein_candidates as
with base as (
  select f.code, f.name_fr, f.food_group, f.food_subgroup, coalesce(f.ciqual_code, f.code) as nut_code
  from public.foods f
  where f.is_animal = false
    and f.food_subgroup in ('légumineuses', 'ingrédients pour végétariens', 'substituts de viande', 'substituts de charcuterie',
                            'charcuteries et alternatives végétales', 'plats végétariens', 'plats composés')
    and f.name_fr !~* '\m(sec|sèche|cru|crue|crus|crues)\M'
    and exists (select 1 from public.food_impacts i where i.food_code = f.code and i.indicator_id = 'ghg_100y_kgco2e')
), values_ as (
  select b.*,
    (select n.value_per_100g from public.food_nutrients n where n.food_code = b.nut_code and n.nutrient_id = 'protein_g') as protein_g,
    (select n.value_per_100g from public.food_nutrients n where n.food_code = b.nut_code and n.nutrient_id = 'fat_g') as fat_g,
    (select n.value_per_100g from public.food_nutrients n where n.food_code = b.nut_code and n.nutrient_id = 'energy_eu_kcal') as energy_kcal
  from base b
), qualified as (
  select v.* from values_ v
  where v.protein_g is not null and v.fat_g is not null and v.energy_kcal is not null and v.energy_kcal > 0
    and v.protein_g * 4 >= 0.2 * v.energy_kcal
)
select q.code, q.name_fr, q.food_group, q.food_subgroup, q.protein_g, q.fat_g, q.energy_kcal
from qualified q
where not (q.code like '%\_%' and exists (select 1 from qualified p where p.code = split_part(q.code, '_', 1) and p.name_fr = q.name_fr));

comment on view public.protein_candidates is 'Plant proteins offered to the visitor (decision of Matt 17 h 25), selected from the data only; see /methodologie#choix-proteine.';
grant select on public.protein_candidates to anon, authenticated;
