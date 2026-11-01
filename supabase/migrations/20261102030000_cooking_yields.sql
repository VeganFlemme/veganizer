-- =====================================================================
-- S17b — Cooking yields (USDA Table of Cooking Yields for Meat and Poultry, Release 2)
-- A cooked ingredient without a direct price gets: price of the raw product / cooking yield,
-- only when the raw product and the cooking method match the cooked Ciqual code
-- (reviewed mapping pipeline/cooking_yields_map.csv). Recipes stay in cooked weights.
-- =====================================================================

insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('usda-cooking-yields-r2', 'USDA Table of Cooking Yields for Meat and Poultry, Release 2', 'USDA Agricultural Research Service',
 'Release 2 (2014), CSV du 2017-11-15 (DOI 10.15482/USDA.ADC/1409031)',
 'https://catalog.data.gov/dataset/usda-table-of-cooking-yields-for-meat-and-poultry',
 'CC0 1.0 (domaine public)', true, false, '2026-11-01',
 'Rendement = poids cuit / poids cru (pertes d''eau et de graisse), avec minimum et maximum observés.')
on conflict (id) do nothing;

create table public.cooking_yields (
  cooked_code  text primary key references public.foods(code),
  raw_code     text not null references public.foods(code),
  yield_pct    numeric not null check (yield_pct > 0 and yield_pct <= 200),
  yield_min    numeric,
  yield_max    numeric,
  reference    text not null,               -- USDA row: NDB, description, preparation method
  source_id    text not null references public.sources(id),
  check (cooked_code <> raw_code)
);
alter table public.cooking_yields enable row level security;
create policy "lecture publique" on public.cooking_yields for select using (true);
grant select on public.cooking_yields to anon, authenticated;
grant all on public.cooking_yields to service_role;

-- Same columns as before, plus two at the end (derived_from, yield_pct): direct prices first,
-- then prices derived from the raw product, never both for the same food.
create or replace view public.food_prices_best with (security_invoker = true) as
with direct as (
  select distinct on (fp.food_code)
    fp.food_code, fp.source_id, fp.median_eur_per_kg, fp.min_eur_per_kg, fp.max_eur_per_kg,
    fp.observations, fp.first_observed_on, fp.last_observed_on, psp.place
  from public.food_prices fp
  join public.price_source_priority psp on psp.source_id = fp.source_id
  order by fp.food_code, psp.priority
),
derived as (
  select cy.cooked_code as food_code, d.source_id,
         d.median_eur_per_kg / (cy.yield_pct / 100.0) as median_eur_per_kg,
         d.min_eur_per_kg / (coalesce(cy.yield_max, cy.yield_pct) / 100.0) as min_eur_per_kg,
         d.max_eur_per_kg / (coalesce(cy.yield_min, cy.yield_pct) / 100.0) as max_eur_per_kg,
         d.observations, d.first_observed_on, d.last_observed_on, d.place,
         cy.raw_code as derived_from, cy.yield_pct
  from public.cooking_yields cy
  join direct d on d.food_code = cy.raw_code
  where not exists (select 1 from direct x where x.food_code = cy.cooked_code)
)
select food_code, source_id, median_eur_per_kg, min_eur_per_kg, max_eur_per_kg,
       observations, first_observed_on, last_observed_on, place,
       null::text as derived_from, null::numeric as yield_pct
from direct
union all
select food_code, source_id, median_eur_per_kg, min_eur_per_kg, max_eur_per_kg,
       observations, first_observed_on, last_observed_on, place, derived_from, yield_pct
from derived;

grant select on public.food_prices_best to anon, authenticated, service_role;
