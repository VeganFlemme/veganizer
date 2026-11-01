-- S23: ministry sheet on laying hens (laying cycle and eggs per hen, p. 1), for pain per kg of eggs.
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('agri-bien-etre-poules', 'Le bien-être et la protection des poules pondeuses', 'Ministère de l''Agriculture et de la Souveraineté alimentaire',
 'fiche (données 2017)', 'https://agriculture.gouv.fr/telecharger/94018',
 'À vérifier (document public, conditions de réutilisation non lues)', null, false, '2026-11-01',
 'p. 1 : cycle de ponte d''environ 12-13 mois, environ 300 œufs par poule.')
on conflict (id) do nothing;
