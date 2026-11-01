-- S24b (suite V1, step 3 bis, point 2 bis): official recipes of the AGRIBALYSE composite dishes,
-- read from the AGRIBALYSE 3.0 openLCA export republished on data.gouv.fr (Licence Ouverte 2.0).
-- Only the recipes that pass the checks of pipeline/agribalyse_recipes.py are imported
-- (same ingredient list as the 3.2 detail, >= 95 % of the mass with a Ciqual code).
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('agribalyse-3.0-openlca', 'Agribalyse (base complète, export openLCA)', 'ADEME (rediffusion communautaire sur data.gouv.fr)',
 '3.0 (export du 20 juin 2020)', 'https://www.data.gouv.fr/fr/datasets/agribalyse/', 'Licence Ouverte 2.0', true, false, '2026-11-01',
 'Rediffusion au titre de la Licence Ouverte de la base AGRIBALYSE 3.0 de l''ADEME, exportée depuis openLCA (table TBL_EXCHANGES : masse de chaque intrant par kg de plat à l''usine). Version 3.0 : utilisée seulement pour les masses des recettes, quand la liste d''ingrédients correspond à celle du détail par ingrédient 3.2.')
on conflict (id) do nothing;

create table public.official_recipes (
  dish_code        text not null references public.foods(code) on delete cascade, -- the AGRIBALYSE / Ciqual dish
  flow             text not null,      -- input as named in the 3.0 database
  food_code        text references public.foods(code), -- reviewed match (pipeline/agribalyse_recipe_ingredients.csv); null = no code
  kg_per_kg_dish   numeric not null check (kg_per_kg_dish >= 0), -- raw input per kg of dish at plant
  note             text,
  source_id        text not null references public.sources(id),
  primary key (dish_code, flow, source_id)
);
comment on table public.official_recipes is 'Masses of the ingredients of AGRIBALYSE composite dishes (3.0), per kg of dish at plant; checked against the 3.2 detail per ingredient.';

alter table public.official_recipes enable row level security;
create policy "lecture publique" on public.official_recipes for select using (true);

grant select on public.official_recipes to anon, authenticated;
grant all    on public.official_recipes to service_role;
