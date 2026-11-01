-- =====================================================================
-- Veganizer — schéma initial (Supabase / Postgres 15+)
-- Comparaison factuelle plat animal ↔ alternative végétale
-- Clé commune : le code aliment Ciqual (partagé par Agribalyse)
-- =====================================================================

create extension if not exists pg_trgm;   -- recherche floue sur les noms

-- ---------------------------------------------------------------------
-- 1. Sources : chaque chiffre de la base doit pointer vers une ligne ici
-- ---------------------------------------------------------------------
create table public.sources (
  id              text primary key,          -- ex. 'ciqual-2025', 'agribalyse-3.2'
  name            text not null,
  publisher       text,
  version         text,
  url             text,
  license         text not null,             -- ex. 'Licence Ouverte 2.0', 'ODbL', 'CC0'
  commercial_use  boolean,                   -- null = à vérifier avant tout usage commercial
  share_alike     boolean not null default false,  -- true pour ODbL / CC BY-SA
  accessed_on     date,
  notes           text
);

-- ---------------------------------------------------------------------
-- 2. Aliments (référentiel Ciqual) et nutriments
-- ---------------------------------------------------------------------
create table public.foods (
  code            text primary key,          -- code Ciqual
  name_fr         text not null,
  name_en         text,
  food_group      text,
  food_subgroup   text,
  is_animal       boolean not null default false,
  animal_category text,                      -- 'bovin', 'porc', 'poulet de chair', 'poule pondeuse', 'saumon d''élevage'…
  state           text check (state in ('cru', 'cuit', 'prêt à consommer')),
  source_id       text references public.sources(id)
);
create index foods_name_fr_trgm on public.foods using gin (name_fr gin_trgm_ops);

create table public.nutrients (
  id        text primary key,                -- 'protein_g', 'vit_b12_ug', 'fe_mg'…
  name_fr   text not null,
  unit      text not null,                   -- 'g', 'mg', 'µg', 'kcal'
  category  text                             -- 'macro', 'vitamine', 'minéral', 'acide gras'…
);

create table public.food_nutrients (
  food_code       text not null references public.foods(code) on delete cascade,
  nutrient_id     text not null references public.nutrients(id),
  value_per_100g  numeric,                   -- null = donnée absente (ne jamais remplacer par 0)
  qualifier       text,                      -- '<', 'traces', 'estimé'
  source_id       text not null references public.sources(id),
  primary key (food_code, nutrient_id, source_id)
);

-- Besoins de référence (ANSES / EFSA) pour exprimer en % des besoins
create table public.nutrient_references (
  nutrient_id  text not null references public.nutrients(id),
  population   text not null,                -- 'femme 18-64', 'homme 18-64', 'enceinte'…
  kind         text not null check (kind in ('RNP', 'AS', 'BNM', 'LSS')),
  value        numeric not null,
  unit         text not null,
  source_id    text not null references public.sources(id),
  primary key (nutrient_id, population, kind, source_id)
);

-- ---------------------------------------------------------------------
-- 3. Indicateurs d'impact (climat, santé, animaux, coût…)
-- ---------------------------------------------------------------------
create table public.indicators (
  id                text primary key,        -- 'ghg_100y_kgco2e', 'animals_killed', 'price_eur'…
  pillar            text not null check (pillar in ('nutrition', 'sante', 'climat', 'animaux', 'cout')),
  name_fr           text not null,
  unit              text not null,
  horizon           text check (horizon in ('court', 'long', 'vie', 'actuel')),
  scale             text check (scale in ('individuel', 'collectif')),
  higher_is_better  boolean not null default false,
  description       text
);

-- Impact par kg d'aliment (Agribalyse, Poore & Nemecek, Big Climate Database…)
create table public.food_impacts (
  food_code     text not null references public.foods(code) on delete cascade,
  indicator_id  text not null references public.indicators(id),
  value_per_kg  numeric not null,
  low_per_kg    numeric,                     -- fourchette basse (si disponible)
  high_per_kg   numeric,                     -- fourchette haute
  dqr           numeric check (dqr between 1 and 5),  -- qualité Agribalyse : 1 = fiable, 5 = incertain
  source_id     text not null references public.sources(id),
  primary key (food_code, indicator_id, source_id)
);

-- Facteurs par catégorie quand la donnée n'existe pas par aliment
-- (animaux tués par kg, heures de douleur par kg, minutes de vie HENI par catégorie…)
create table public.category_factors (
  id            bigint generated always as identity primary key,
  category      text not null,               -- doit correspondre à foods.animal_category ou à une catégorie HENI
  indicator_id  text not null references public.indicators(id),
  value         numeric not null,
  low           numeric,
  high          numeric,
  unit_basis    text not null,               -- ex. 'par kg de produit comestible'
  source_id     text not null references public.sources(id),
  notes         text,
  unique (category, indicator_id, source_id)
);

-- Valeurs de monétisation (valeur carbone officielle, prix environnementaux…)
create table public.monetization_factors (
  indicator_id  text not null references public.indicators(id),
  year          int not null,
  eur_per_unit  numeric not null,
  method        text not null,               -- 'VAC France Stratégie 2025', 'CE Delft 2023'…
  source_id     text not null references public.sources(id),
  primary key (indicator_id, year, method)
);

-- Prix observés (Open Prices, RNM…)
create table public.prices (
  id           bigint generated always as identity primary key,
  food_code    text references public.foods(code),
  off_barcode  text,
  price_eur    numeric not null check (price_eur >= 0),
  per          text not null check (per in ('kg', 'l', 'unite')),
  region       text,
  observed_on  date,
  source_id    text not null references public.sources(id),
  check (food_code is not null or off_barcode is not null)
);

-- ---------------------------------------------------------------------
-- 4. Plats, recettes et paires animal ↔ végétal
-- ---------------------------------------------------------------------
create table public.dishes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name_fr       text not null,
  kind          text not null check (kind in ('animal', 'vegetal')),
  servings      int  not null default 1 check (servings > 0),
  description   text,
  prep_minutes  int,
  is_published  boolean not null default false,
  created_by    uuid references auth.users(id) on delete set null,  -- null = plat officiel
  created_at    timestamptz not null default now()
);

-- Grammes pour la recette entière, à l'état réellement consommé (codes Ciqual cuits si cuits)
create table public.dish_ingredients (
  dish_id    uuid not null references public.dishes(id) on delete cascade,
  food_code  text not null references public.foods(code),
  grams      numeric not null check (grams > 0),
  note       text,
  primary key (dish_id, food_code)
);

create table public.dish_pairs (
  id              uuid primary key default gen_random_uuid(),
  animal_dish_id  uuid not null references public.dishes(id) on delete cascade,
  vegan_dish_id   uuid not null references public.dishes(id) on delete cascade,
  variant         text check (variant in ('maison', 'commerce')),
  rationale       text,                      -- pourquoi c'est une alternative équivalente (même rôle, même portion)
  is_published    boolean not null default false,
  unique (animal_dish_id, vegan_dish_id),
  check (animal_dish_id <> vegan_dish_id)
);

-- Engagements personnels (simulateur « je remplace X fois par semaine »)
create table public.swap_commitments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pair_id         uuid not null references public.dish_pairs(id) on delete cascade,
  times_per_week  numeric not null check (times_per_week > 0 and times_per_week <= 21),
  started_on      date not null default current_date
);

-- Signalements d'erreurs (transparence)
create table public.error_reports (
  id          bigint generated always as identity primary key,
  page        text not null,
  message     text not null check (char_length(message) between 5 and 2000),
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  status      text not null default 'nouveau' check (status in ('nouveau', 'en cours', 'corrigé', 'rejeté'))
);

-- ---------------------------------------------------------------------
-- 5. Vues de calcul (security_invoker : respectent la RLS de l'appelant)
--    mass_coverage = part de la masse du plat couverte par des données
--    → l'interface doit avertir si < 0,95
-- ---------------------------------------------------------------------
create view public.dish_impacts with (security_invoker = true) as
with totals as (
  select dish_id, sum(grams) as total_g
  from public.dish_ingredients
  group by dish_id
)
select
  d.id                                                as dish_id,
  d.slug,
  fi.indicator_id,
  fi.source_id,
  sum(di.grams / 1000.0 * fi.value_per_kg) / d.servings as per_serving,
  sum(di.grams / 1000.0 * coalesce(fi.low_per_kg,  fi.value_per_kg)) / d.servings as low_per_serving,
  sum(di.grams / 1000.0 * coalesce(fi.high_per_kg, fi.value_per_kg)) / d.servings as high_per_serving,
  max(fi.dqr)                                          as worst_dqr,
  sum(di.grams) / t.total_g                            as mass_coverage
from public.dishes d
join totals t                    on t.dish_id = d.id
join public.dish_ingredients di  on di.dish_id = d.id
join public.food_impacts fi      on fi.food_code = di.food_code
group by d.id, d.slug, fi.indicator_id, fi.source_id, d.servings, t.total_g;

create view public.dish_nutrients with (security_invoker = true) as
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
join public.food_nutrients fn    on fn.food_code = di.food_code and fn.value_per_100g is not null
group by d.id, d.slug, fn.nutrient_id, fn.source_id, d.servings, t.total_g;

-- Impacts « animaux » via les facteurs par catégorie (animaux tués, heures de douleur…)
create view public.dish_animal_impacts with (security_invoker = true) as
select
  d.id                                                     as dish_id,
  d.slug,
  cf.indicator_id,
  cf.source_id,
  sum(di.grams / 1000.0 * cf.value) / d.servings           as per_serving,
  sum(di.grams / 1000.0 * coalesce(cf.low,  cf.value)) / d.servings as low_per_serving,
  sum(di.grams / 1000.0 * coalesce(cf.high, cf.value)) / d.servings as high_per_serving
from public.dishes d
join public.dish_ingredients di on di.dish_id = d.id
join public.foods f              on f.code = di.food_code and f.is_animal
join public.category_factors cf  on cf.category = f.animal_category
group by d.id, d.slug, cf.indicator_id, cf.source_id, d.servings;

-- ---------------------------------------------------------------------
-- 6. Sécurité (Row Level Security)
--    Référentiels : lecture publique, écriture réservée au service_role
--    (le service_role contourne la RLS : à n'utiliser que dans le pipeline)
-- ---------------------------------------------------------------------
alter table public.sources               enable row level security;
alter table public.foods                 enable row level security;
alter table public.nutrients             enable row level security;
alter table public.food_nutrients        enable row level security;
alter table public.nutrient_references   enable row level security;
alter table public.indicators            enable row level security;
alter table public.food_impacts          enable row level security;
alter table public.category_factors      enable row level security;
alter table public.monetization_factors  enable row level security;
alter table public.prices                enable row level security;
alter table public.dishes                enable row level security;
alter table public.dish_ingredients      enable row level security;
alter table public.dish_pairs            enable row level security;
alter table public.swap_commitments      enable row level security;
alter table public.error_reports         enable row level security;

-- Lecture publique des référentiels
create policy "lecture publique" on public.sources              for select using (true);
create policy "lecture publique" on public.foods                for select using (true);
create policy "lecture publique" on public.nutrients            for select using (true);
create policy "lecture publique" on public.food_nutrients       for select using (true);
create policy "lecture publique" on public.nutrient_references  for select using (true);
create policy "lecture publique" on public.indicators           for select using (true);
create policy "lecture publique" on public.food_impacts         for select using (true);
create policy "lecture publique" on public.category_factors     for select using (true);
create policy "lecture publique" on public.monetization_factors for select using (true);
create policy "lecture publique" on public.prices               for select using (true);

-- Plats : publiés visibles par tous ; brouillons visibles par leur auteur
create policy "plats publiés ou à moi" on public.dishes
  for select using (is_published or created_by = auth.uid());
create policy "créer mes plats" on public.dishes
  for insert to authenticated with check (created_by = auth.uid() and is_published = false);
create policy "modifier mes plats" on public.dishes
  for update to authenticated using (created_by = auth.uid())
  with check (created_by = auth.uid() and is_published = false);
create policy "supprimer mes plats" on public.dishes
  for delete to authenticated using (created_by = auth.uid());

create policy "ingrédients visibles avec le plat" on public.dish_ingredients
  for select using (exists (
    select 1 from public.dishes d
    where d.id = dish_id and (d.is_published or d.created_by = auth.uid())));
create policy "gérer les ingrédients de mes plats" on public.dish_ingredients
  for all to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.created_by = auth.uid()))
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.created_by = auth.uid()));

create policy "paires publiées" on public.dish_pairs
  for select using (is_published);

-- Données personnelles : uniquement les miennes
create policy "mes engagements" on public.swap_commitments
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signalements : tout le monde peut signaler, personne ne peut relire ceux des autres
create policy "signaler une erreur" on public.error_reports
  for insert with check (created_by is null or created_by = auth.uid());
create policy "voir mes signalements" on public.error_reports
  for select to authenticated using (created_by = auth.uid());

-- ---------------------------------------------------------------------
-- 7. Droits explicites (projet créé avec « Automatically expose new tables »
--    désactivé) : rien n'est exposé à l'API sans être listé ici.
--    La RLS ci-dessus filtre ensuite les lignes.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- Lecture publique : référentiels, plats, paires, vues de calcul
grant select on
  public.sources, public.foods, public.nutrients, public.food_nutrients,
  public.nutrient_references, public.indicators, public.food_impacts,
  public.category_factors, public.monetization_factors, public.prices,
  public.dishes, public.dish_ingredients, public.dish_pairs,
  public.dish_impacts, public.dish_nutrients, public.dish_animal_impacts
to anon, authenticated;

-- Utilisateurs connectés : leurs propres recettes et engagements
grant insert, update, delete on public.dishes, public.dish_ingredients to authenticated;
grant select, insert, update, delete on public.swap_commitments to authenticated;

-- Signalements d'erreurs
grant insert on public.error_reports to anon, authenticated;
grant select on public.error_reports to authenticated;

-- Pipeline d'import (clé secrète, jamais dans le navigateur)
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
