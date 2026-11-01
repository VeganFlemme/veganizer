-- =====================================================================
-- Veganizer — monetization growth rules + sources of data/conseils.json
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Growth rule for a monetization value between published years.
--    eur_per_unit(year) = eur_per_unit(start_year) × (1 + growth_rate)^(min(year, cap_year) − start_year)
--    The start value is read from monetization_factors (same indicator, same
--    method, year = start_year): it is never stored twice.
--    Published years in monetization_factors always take precedence.
-- ---------------------------------------------------------------------
create table public.monetization_rules (
  indicator_id  text not null references public.indicators(id),
  method        text not null,
  growth_rate   numeric not null,
  start_year    int not null,
  cap_year      int not null,              -- value constant after this year
  source_id     text not null references public.sources(id),
  notes         text,
  primary key (indicator_id, method),
  check (cap_year >= start_year)
);

alter table public.monetization_rules enable row level security;
create policy "lecture publique" on public.monetization_rules for select using (true);
grant select on public.monetization_rules to anon, authenticated;
grant all    on public.monetization_rules to service_role;

insert into public.monetization_rules (indicator_id, method, growth_rate, start_year, cap_year, source_id, notes) values
('ghg_100y_kgco2e', 'VAC France Stratégie 2025', 0.032, 2025, 2060, 'vac-2025',
 'Valeur de l''action pour le climat : part de 256 €2023/t en 2025, croît au taux d''actualisation socioéconomique (3,2 %/an) jusqu''en 2060, puis reste stable.');

-- ---------------------------------------------------------------------
-- 2. Sources of the advice shown where the animal dish does better
--    (data/conseils.json, field sourceId).
-- ---------------------------------------------------------------------
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('anses-2019-sa-0118', 'Avis relatif à l''établissement de repères alimentaires destinés aux personnes suivant un régime d''exclusion de tout ou partie des aliments d''origine animale',
 'ANSES', 'Saisine 2019-SA-0118, 3 février 2025 (publié le 13 mars 2025)', 'https://www.anses.fr/fr/system/files/NUT2019-SA-0118.pdf',
 'Citation (voir mentions légales ANSES)', null, false, '2026-11-01', 'Repères pour adultes uniquement, hors grossesse, allaitement et personnes âgées'),
('anses-iode', 'Iode : pourquoi et comment en consommer ?', 'ANSES', 'page web', 'https://www.anses.fr/fr/content/iode',
 'Citation (voir mentions légales ANSES)', null, false, '2026-11-01', null),
('anses-proteines', 'Protéines : rôle, sources et apports recommandés', 'ANSES', 'page web', 'https://www.anses.fr/fr/content/les-prot%C3%A9ines',
 'Citation (voir mentions légales ANSES)', null, false, '2026-11-01', null),
('efsa-drv-iron-2015', 'Scientific Opinion on Dietary Reference Values for iron', 'EFSA Panel NDA', 'EFSA Journal 2015;13(10):4254', 'https://doi.org/10.2903/j.efsa.2015.4254',
 'Citation (EFSA Journal, accès libre)', null, false, '2026-11-01', null)
on conflict (id) do nothing;
