-- S12 — Health sources checked on 2026-11-01.
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('spf-pnns-2019', 'Recommandations relatives à l''alimentation, à l''activité physique et à la sédentarité pour les adultes',
 'Santé publique France (Delamaire C., Escalon E., Noirot L.)', 'dépôt légal décembre 2018, ISBN-NET 979-10-289-0505-7',
 'https://www.santepubliquefrance.fr/sites/default/files/rdd/document/42466_spf00000619.pdf',
 'À vérifier (document public, conditions de réutilisation non indiquées dans le PDF)', null, false, '2026-11-01',
 'Repères adultes : viande hors volaille et charcuterie p. 35, poisson p. 33, légumes secs p. 32, tableau p. 49.')
on conflict (id) do nothing;

-- HENI: the article page (nature.com) shows no open licence ("Reprints and permissions") and
-- "Data are available from the corresponding author upon reasonable request".
update public.sources
set license = 'Aucune licence ouverte trouvée (article Springer Nature, droits réservés ; données sur demande aux auteurs)',
    commercial_use = false,
    accessed_on = '2026-11-01',
    notes = 'Valeurs par portion pour 167 aliments du régime américain moyen : non importées (pas de licence, pas de catégories françaises).'
where id = 'heni-2021';
