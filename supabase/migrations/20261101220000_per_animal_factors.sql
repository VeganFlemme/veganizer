-- =====================================================================
-- Veganizer — per-animal category factors (pain hours, days of life)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Basis of a category factor
--    'kg'     : per kg of product (animals killed per kg of carcass, days of
--               lactation per kg of milk…), applied to the grams eaten;
--    'animal' : per animal (pain hours, age at slaughter), converted to per kg
--               with the animals_killed_land factor (per kg) of the same category.
--               Without that factor: no value (donnée manquante), never 0.
-- ---------------------------------------------------------------------
alter table public.category_factors
  add column per text not null default 'kg' check (per in ('kg', 'animal'));

comment on column public.category_factors.per is
  'kg = per kg of product; animal = per animal, converted with animals_killed_land of the same category.';

-- Same rule as lib/scoring/totals.ts (perKg). Columns unchanged.
create or replace view public.dish_animal_impacts with (security_invoker = true) as
with factors as (
  select cf.category, cf.indicator_id, cf.source_id, cf.value,
         coalesce(cf.low, cf.value) as low, coalesce(cf.high, cf.value) as high
  from public.category_factors cf
  where cf.per = 'kg'
  union all
  select a.category, a.indicator_id, a.source_id,
         a.value * k.value,
         coalesce(a.low, a.value) * coalesce(k.low, k.value),
         coalesce(a.high, a.value) * coalesce(k.high, k.value)
  from public.category_factors a
  join public.category_factors k
    on k.category = a.category and k.indicator_id = 'animals_killed_land' and k.per = 'kg'
  where a.per = 'animal'
)
select
  d.id                                                     as dish_id,
  d.slug,
  f.indicator_id,
  f.source_id,
  sum(di.grams / 1000.0 * f.value) / d.servings            as per_serving,
  sum(di.grams / 1000.0 * f.low) / d.servings              as low_per_serving,
  sum(di.grams / 1000.0 * f.high) / d.servings             as high_per_serving
from public.dishes d
join public.dish_ingredients di on di.dish_id = d.id
join public.foods fo            on fo.code = di.food_code and fo.is_animal
join factors f                  on f.category = fo.animal_category
group by d.id, d.slug, f.indicator_id, f.source_id, d.servings;

-- ---------------------------------------------------------------------
-- 2. Sources opened on 2026-11-01
-- ---------------------------------------------------------------------
update public.sources
set name = 'Welfare Footprint — Quantifying Pain in Broiler Chickens (2022) ; Quantifying Pain in Laying Hens (Schuck-Paim & Alonso, 2021)',
    publisher = 'Welfare Footprint Institute (données via Our World in Data)',
    version = 'OWID : welfare_broiler_chickens (2023), pain_hours_days_hen_systems (2021)',
    url = 'https://ourworldindata.org/do-better-cages-or-cage-free-environments-really-improve-the-lives-of-hens',
    license = 'CC BY 4.0 (« Our reports, data, and charts are licensed under CC BY 4.0 unless otherwise stated », welfarefootprint.org)',
    commercial_use = true,
    accessed_on = '2026-11-01',
    notes = 'Estimations minimales (seules les heures éveillées sont comptées ; certaines atteintes au bien-être exclues). Poules : phase de ponte seulement.'
where id = 'welfare-footprint';

insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('dir-1999-74-ce', 'Directive 1999/74/CE du Conseil établissant les normes minimales relatives à la protection des poules pondeuses',
 'Conseil de l''Union européenne', 'JO L 203 du 3.8.1999', 'http://publications.europa.eu/resource/celex/31999L0074',
 'Réutilisation des documents de l''UE (décision 2011/833/UE)', true, false, '2026-11-01',
 'Art. 5 § 2 : élevage en cages non aménagées interdit à compter du 1er janvier 2012.'),
('label-rouge-la-07-85', 'Cahier des charges du label rouge n° LA 07/85 « Poulet jaune fermier élevé en plein air »',
 'Ministère de l''Agriculture (BO agri n° 2026-09)', 'homologué par arrêté du 13 février 2026',
 'https://info.agriculture.gouv.fr/boagri/document_administratif-dd1c0327-5023-4cdf-b334-c8dfa4051185/telechargement',
 'Document administratif public', true, false, '2026-11-01', 'p. 3/11, § 3.2 : âge d''abattage du produit courant « Environ 38 jours ».'),
('label-rouge-la-13-97', 'Cahier des charges du label rouge n° LA 13/97 « Lapin fermier »',
 'Ministère de l''Agriculture (BO agri n° 2020-51)', 'homologué par arrêté du 4 décembre 2020 (version 13)',
 'https://info.agriculture.gouv.fr/boagri/document_administratif-018dbe58-b8dd-41a5-9e12-18d422e2cea1/telechargement',
 'Document administratif public', true, false, '2026-11-01', 'p. 4/30, § 3.2 : lapin courant abattu « à un âge moyen d''environ 70 jours ».'),
('agri-bien-etre-porcs', 'Le bien-être et la protection des porcs', 'Ministère de l''Agriculture et de l''Alimentation', 'fiche (données 2017)',
 'https://agriculture.gouv.fr/telecharger/94012', 'Document administratif public', true, false, '2026-11-01',
 'p. 1 : porcs charcutiers vendus « à un poids de 115 à 120 kg (équivaut à 6 mois d''âge) ».'),
('agreste-saa', 'Statistique agricole annuelle (SAA) — séries longues 2010-2025', 'Agreste — SSP, ministère de l''Agriculture',
 'données arrêtées au 30/03/2026 (2025 provisoire)', 'https://agreste.agriculture.gouv.fr/agreste-web/disaron/SAA-SeriesLongues/detail/',
 'Licence Ouverte (statistique publique)', null, false, '2026-11-01',
 'Onglet PRA « Animaux finis produits » : têtes et tonnes équivalent carcasse (veaux de boucherie).')
on conflict (id) do nothing;
