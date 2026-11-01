-- S23: FAO Technical Conversion Factors (milk extraction rate of cheese, average egg weight, France).
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('fao-tcf', 'Technical Conversion Factors for Agricultural Commodities', 'FAO, Statistics Division',
 'moyennes nationales 1992-1996',
 'https://www.fao.org/fileadmin/templates/ess/documents/methodology/tcf.pdf',
 'Conditions d''utilisation de la FAO : usage non commercial avec mention de la FAO comme source et titulaire des droits', false, false, '2026-11-01',
 'France : coefficient d''extraction du fromage au lait entier de vache 13 % (p. 545 imprimée) ; poids moyen d''un œuf 60 g (p. 546 imprimée).')
on conflict (id) do nothing;
