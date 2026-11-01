-- S23: INSEE average retail prices (Licence Ouverte 2.0), second in the price priority, before
-- Open Prices: an official monthly national average, like the RNM.
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('insee-ipc-pm', 'Prix moyens de vente de détail', 'Insee',
 'données jusqu''à 2026-09',
 'https://www.data.gouv.fr/datasets/6983dff71f90da358ccf74d7',
 'Licence Ouverte 2.0', true, false, '2026-11-01',
 'Moyennes mensuelles nationales (France métropolitaine) calculées à partir des relevés de l''indice des prix à la consommation ; séries au kg seulement.')
on conflict (id) do nothing;

update public.price_source_priority set priority = 3 where source_id = 'open-prices' and priority = 2;
insert into public.price_source_priority (source_id, priority, place)
values ('insee-ipc-pm', 2, 'France métropolitaine, moyenne nationale des relevés de l''indice des prix (Insee)')
on conflict (source_id) do nothing;
