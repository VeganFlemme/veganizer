-- =====================================================================
-- S13 — One price per food (source priority), dish price with dates and places
-- =====================================================================

-- RNM legal notice read on 2026-11-01 (https://rnm.franceagrimer.fr/rnm/infolegal.shtml).
update public.sources
set name = 'Réseau des nouvelles des marchés — prix au stade détail (GMS)',
    license = 'Licence ouverte FranceAgriMer : « La réutilisation est autorisée, y compris à des fins commerciales », avec mention précise des sources',
    commercial_use = true,
    version = 'moyennes mensuelles, € TTC le kg',
    url = 'https://rnm.franceagrimer.fr/prix?M2502:MARCHE',
    accessed_on = '2026-11-01',
    notes = 'Panel RNM de grandes et moyennes surfaces (viande : 150 magasins de plus de 400 m²), France.'
where id = 'rnm';

-- Priority of the price sources (lower = preferred). Editorial choice documented in docs/DECISIONS.md.
create table public.price_source_priority (
  source_id  text primary key references public.sources(id),
  priority   int not null,
  place      text not null              -- shown with the price ("où ont été faits les relevés")
);
alter table public.price_source_priority enable row level security;
create policy "lecture publique" on public.price_source_priority for select using (true);
grant select on public.price_source_priority to anon, authenticated;
grant all on public.price_source_priority to service_role;

insert into public.price_source_priority (source_id, priority, place) values
('rnm', 1, 'France, panel de grandes et moyennes surfaces (RNM, FranceAgriMer)'),
('open-prices', 2, 'France, relevés citoyens Open Prices (magasins variés)');

create view public.food_prices_best with (security_invoker = true) as
select distinct on (fp.food_code)
  fp.food_code, fp.source_id, fp.median_eur_per_kg, fp.min_eur_per_kg, fp.max_eur_per_kg,
  fp.observations, fp.first_observed_on, fp.last_observed_on, psp.place
from public.food_prices fp
join public.price_source_priority psp on psp.source_id = fp.source_id
order by fp.food_code, psp.priority;

create view public.dish_prices_best with (security_invoker = true) as
with totals as (
  select dish_id, sum(grams) as total_g from public.dish_ingredients group by dish_id
)
select
  d.id                                                           as dish_id,
  d.slug,
  sum(di.grams / 1000.0 * fp.median_eur_per_kg) / d.servings     as per_serving,
  sum(di.grams / 1000.0 * fp.min_eur_per_kg) / d.servings        as low_per_serving,
  sum(di.grams / 1000.0 * fp.max_eur_per_kg) / d.servings        as high_per_serving,
  sum(di.grams) / t.total_g                                      as mass_coverage,
  array_agg(distinct fp.source_id order by fp.source_id)         as source_ids,
  min(fp.first_observed_on)                                      as first_observed_on,
  max(fp.last_observed_on)                                       as last_observed_on
from public.dishes d
join totals t                    on t.dish_id = d.id
join public.dish_ingredients di  on di.dish_id = d.id
join public.food_prices_best fp  on fp.food_code = di.food_code
group by d.id, d.slug, d.servings, t.total_g;

grant select on public.food_prices_best, public.dish_prices_best to anon, authenticated, service_role;
