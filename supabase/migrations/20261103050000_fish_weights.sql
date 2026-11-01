-- S23: fishes killed per kg (Mood et al., Animal Welfare, CC BY 4.0) and one factor per species.
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('mood-2023-farmed', 'Estimating global numbers of farmed fishes killed for food annually from 1990 to 2019', 'Mood, Lara, Boyland, Brooke (Animal Welfare 32, e12)',
 '2023, données 2019, matériel supplémentaire S4', 'https://doi.org/10.1017/awf.2023.4', 'CC BY 4.0', true, false, '2026-11-01',
 'Poids moyens estimés (EMW) à l''abattage par espèce, borne basse et haute ; fichiers fournis par Matt (cambridge.org bloque l''environnement de travail).'),
('mood-2024-wild', 'Estimating global numbers of fishes caught from the wild annually from 2000 to 2019', 'Mood, Brooke (Animal Welfare 33, e6)',
 '2024, moyennes 2000-2019, matériel supplémentaire S3', 'https://doi.org/10.1017/awf.2024.7', 'CC BY 4.0', true, false, '2026-11-01',
 'Poids moyens estimés (EMW) à la capture par espèce, borne basse et haute ; fichiers fournis par Matt.')
on conflict (id) do nothing;

-- Several factors of one source for one category (e.g. cod and saithe, both "poisson sauvage"):
-- `scope` names the subset (species), '' for a factor of the whole category.
alter table public.category_factors add column scope text not null default '';
alter table public.category_factors add constraint category_factors_category_indicator_source_scope_key unique (category, indicator_id, source_id, scope);
alter table public.category_factors drop constraint category_factors_category_indicator_id_source_id_key;
comment on column public.category_factors.scope is 'Subset of the category the row applies to (species…), with food_codes; empty = whole category.';
