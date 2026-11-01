-- =====================================================================
-- Veganizer — données de départ : sources, indicateurs, valeur carbone
-- Vérifié le 1er novembre 2026. commercial_use = null → à vérifier
-- sur la page de la source avant tout usage commercial.
-- =====================================================================

insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
-- Nutrition
('ciqual-2025',        'Table de composition nutritionnelle Ciqual', 'ANSES', 'nov. 2025 (3 484 aliments, 74 constituants)', 'https://ciqual.anses.fr', 'Open data (Licence Ouverte Etalab)', true, false, '2026-11-01', 'Codes aliments partagés avec Agribalyse'),
('calnut',             'CALNUT (Ciqual sans valeurs manquantes)', 'ANSES', null, 'https://ciqual.anses.fr', 'Open data (Licence Ouverte Etalab)', true, false, '2026-11-01', 'Valeurs estimées : signaler comme telles'),
('usda-fdc',           'FoodData Central', 'USDA ARS', 'Foundation Foods déc. 2025', 'https://fdc.nal.usda.gov/download-datasets', 'CC0 1.0 (domaine public)', true, false, '2026-11-01', null),
('bls-4.0',            'Bundeslebensmittelschlüssel', 'Max Rubner-Institut', '4.0 (déc. 2025)', 'https://blsdb.de', 'Gratuit, sans redevance depuis le 16/12/2025', null, false, '2026-11-01', 'Vérifier les conditions de réutilisation'),
('off',                'Open Food Facts', 'Open Food Facts', 'export quotidien', 'https://world.openfoodfacts.org/data', 'ODbL (base) + DbCL (contenus)', true, true, '2026-11-01', 'Partage à l''identique de la base dérivée'),
('diaas-muleya-2021',  'Ileal amino acid digestibility and DIAAS values of world foods', 'Muleya et al. (Mendeley Data)', 'v1 (2021)', 'https://data.mendeley.com/datasets/gz3cx7d5f4', 'Voir la page du jeu', null, false, '2026-11-01', null),
-- Santé
('ihme-gbd',           'Global Burden of Disease', 'IHME', 'GBD 2021/2023', 'https://ghdx.healthdata.org', 'IHME Free-of-Charge Non-commercial User Agreement', false, false, '2026-11-01', 'Interdit en usage commercial sans accord IHME'),
('heni-2021',          'Health Nutritional Index (HENI)', 'Stylianou, Fulgoni, Jolliet — Nature Food', '2021', 'https://doi.org/10.1038/s43016-021-00343-4', 'Données d''article scientifique, citer', null, false, '2026-11-01', 'Aliments américains ; financement partiel National Dairy Council'),
('iarc-114',           'IARC Monographs vol. 114 — Red meat and processed meat', 'CIRC / OMS', '2015 (publ. 2018)', 'https://publications.iarc.fr', 'Citation', null, false, '2026-11-01', 'Groupe = solidité des preuves, pas ampleur du risque'),
('eat-lancet-2025',    'EAT-Lancet Commission 2.0', 'The Lancet', '2025', 'https://www.thelancet.com/commissions-do/EAT-2025', 'Citation', null, false, '2026-11-01', null),
('esuavet',            'European Sales and Use of Antimicrobials for Veterinary Medicine', 'EMA', 'annuel depuis 2025', 'https://www.ema.europa.eu', 'Citation', null, false, '2026-11-01', 'Données brutes sur demande'),
-- Climat et environnement
('agribalyse-3.2',     'AGRIBALYSE — Synthèse, détail par étape et par ingrédient', 'ADEME / INRAE', '3.2', 'https://doc.agribalyse.fr', 'Licence Ouverte (tableurs data.gouv)', true, false, '2026-11-01', 'La version openLCA complète exige une licence ecoinvent'),
('poore-nemecek-owid', 'Environmental impacts of food (Poore & Nemecek 2018)', 'Our World in Data', '2018', 'https://ourworldindata.org/environmental-impacts-of-food', 'CC BY (citer OWID et les auteurs)', true, false, '2026-11-01', 'Moyennes mondiales ; fourchettes dans l''article'),
('big-climate-db-1.2', 'The Big Climate Database', 'CONCITO / 2.-0 LCA consultants', '1.2 (sept. 2024)', 'https://thebigclimatedatabase.com', 'CC BY 4.0', true, false, '2026-11-01', 'Marché français inclus'),
('ecobalyse',          'Ecobalyse — coût environnemental', 'État français (beta.gouv)', null, 'https://www.data.gouv.fr/datasets/690cdf236100bbf43e591e8b', 'Données data.gouv (voir page) ; code MIT', null, false, '2026-11-01', null),
('wfn-animal',         'Water footprint of animal products', 'Mekonnen & Hoekstra (4TU.ResearchData)', '1996-2005', 'https://data.4tu.nl/datasets/37031c95-23e0-4449-9eaf-3eee6628f8c9', 'Accès libre, citer', null, false, '2026-11-01', null),
('trase',              'Trase — supply chains and deforestation', 'SEI / Global Canopy', null, 'https://trase.earth/open-data', 'Téléchargement libre, citer', null, false, '2026-11-01', null),
('ipcc-ar6-gwp',       'Potentiels de réchauffement global (AR6)', 'GIEC', 'AR6 (2021)', 'https://www.ipcc.ch/report/ar6/wg1/', 'Citation', true, false, '2026-11-01', 'CH4 : ~80 sur 20 ans, 27-30 sur 100 ans'),
-- Animaux
('faostat-qcl',        'FAOSTAT — Crops and livestock products', 'FAO', null, 'https://www.fao.org/faostat/', 'Licence FAO (vérifier la version CC du jeu)', null, false, '2026-11-01', 'Têtes abattues, rendement carcasse par animal'),
('fishcount',          'Fishcount — estimated mean weights', 'fishcount.org.uk', '2010-2019', 'https://fishcount.org.uk', 'Données publiées dans le domaine public (selon les auteurs)', null, false, '2026-11-01', null),
('welfare-footprint',  'Welfare Footprint — Cumulative Pain', 'Welfare Footprint Institute', null, 'https://welfarefootprint.org', 'Accès ouvert, citer', null, false, '2026-11-01', null),
('ec-laying-hens',     'Laying hens by way of keeping 2011-2025', 'Commission européenne (DG AGRI)', '2025', 'https://agriculture.ec.europa.eu/farming/animal-products/eggs_en', 'Réutilisation des documents de la Commission, citer', null, false, '2026-11-01', null),
('rp-welfare-ranges',  'Welfare range estimates', 'Rethink Priorities', '2023', 'https://www.rethinkpriorities.org/publications/welfare-range-estimates', 'Citer', null, false, '2026-11-01', 'Option désactivée par défaut'),
-- Coût
('open-prices',        'Open Prices', 'Open Food Facts', 'export quotidien', 'https://www.data.gouv.fr/datasets/open-prices', 'ODbL', true, true, '2026-11-01', null),
('rnm',                'Réseau des nouvelles des marchés — prix de détail', 'FranceAgriMer', 'hebdomadaire', 'https://rnm.franceagrimer.fr', 'Open data', null, false, '2026-11-01', null),
('vac-2025',           'La valeur de l''action pour le climat', 'France Stratégie (commission Quinet)', 'mars 2025', 'https://www.strategie.gouv.fr', 'Rapport public', true, false, '2026-11-01', 'Euros 2023 par tonne de CO2e'),
('tmg-true-costs',     'True Costs of Food Database', 'TMG Think Tank / True Price', 'janv. 2026', 'https://tmg-thinktank.com/publications/true-costs-of-food-database-documentation-and-user-manual', 'Accès ouvert (vérifier la licence du fichier)', null, false, '2026-11-01', null),
('trueprice-mf-3.0',   'Monetisation Factors for True Pricing', 'True Price Foundation', '3.0.0 (2023)', 'https://www.trueprice.org/publications/monitisation-factors-for-true-pricing/', 'Accès ouvert', null, false, '2026-11-01', null),
('fao-sofa-2023',      'The State of Food and Agriculture 2023 — True cost of food', 'FAO', '2023 et 2024', 'https://openknowledge.fao.org', 'Licence FAO du rapport', null, false, '2026-11-01', 'Ordres de grandeur nationaux'),
('basic-injuste-prix', 'L''injuste prix de notre alimentation', 'BASIC, Secours Catholique, Réseau Civam, Solidarité Paysans, FFD', 'sept. 2024', 'https://www.secours-catholique.org', 'Rapport public, citer', null, false, '2026-11-01', null),
('pac-beneficiaires',  'Aides perçues au titre de la PAC', 'Ministère de l''Agriculture / ASP', null, 'https://www.data.gouv.fr/datasets/aides-percues-par-les-personnes-morales-au-titre-de-la-politique-agricole-commune', 'Licence Ouverte', true, false, '2026-11-01', null),
-- Transverse
('inca3',              'Étude INCA 3 — consommations alimentaires', 'ANSES', '2014-2015', 'https://www.data.gouv.fr/fr/datasets/5df9151d634f415c1a9c1df4/', 'Open data (licence non précisée sur data.gouv)', null, false, '2026-11-01', 'Portions et fréquences'),
('veganizer-pairs',    'Table des paires Veganizer', 'Veganizer', '0.1', null, 'À choisir (CC BY-SA ou ODbL conseillés)', true, true, '2026-11-01', 'Actif propre du projet');

insert into public.indicators (id, pillar, name_fr, unit, horizon, scale, higher_is_better, description) values
-- Santé
('heni_minutes',        'sante',   'Minutes de vie en bonne santé',               'min',            'long',   'individuel', true,  'HENI, transposé par catégorie'),
('rr_colorectal',       'sante',   'Risque relatif cancer colorectal',             '%',              'long',   'individuel', false, 'Pour une portion quotidienne'),
('rr_cvd',              'sante',   'Risque relatif maladies cardiovasculaires',    '%',              'long',   'individuel', false, null),
('rr_t2d',              'sante',   'Risque relatif diabète de type 2',             '%',              'long',   'individuel', false, null),
('weekly_redmeat_share','sante',   'Part du repère hebdomadaire viande rouge',     '%',              'court',  'individuel', false, 'PNNS / EAT-Lancet'),
('foodborne_risk',      'sante',   'Risque d''intoxication alimentaire',            'niveau 1-3',     'court',  'individuel', false, 'EFSA One Health'),
-- Climat et environnement
('ghg_100y_kgco2e',     'climat',  'Gaz à effet de serre (100 ans)',               'kg CO2e',        'long',   'collectif',  false, 'Agribalyse, EF 3.1'),
('ghg_20y_kgco2e',      'climat',  'Gaz à effet de serre (20 ans, méthane renforcé)','kg CO2e',      'court',  'collectif',  false, 'Nécessite la répartition par gaz'),
('land_m2a',            'climat',  'Surface de terres',                            'm²·an',          'long',   'collectif',  false, null),
('carbon_opportunity',  'climat',  'Coût d''opportunité carbone',                   'kg CO2',         'long',   'collectif',  false, 'Carbone non stocké faute de reboisement'),
('water_scarcity_m3',   'climat',  'Eau (pondérée par la raréfaction)',            'm³ éq.',         'long',   'collectif',  false, null),
('eutro_fw_kgp',        'climat',  'Eutrophisation eau douce',                     'kg P éq.',       'long',   'collectif',  false, null),
('eutro_marine_kgn',    'climat',  'Eutrophisation marine',                        'kg N éq.',       'long',   'collectif',  false, null),
('acidification_molh',  'climat',  'Acidification',                                'mol H+ éq.',     'long',   'collectif',  false, null),
('particulates',        'climat',  'Particules fines',                             'incidence',      'court',  'collectif',  false, null),
('ecotox_ctue',         'climat',  'Écotoxicité eau douce',                        'CTUe',           'long',   'collectif',  false, null),
('deforestation_risk',  'climat',  'Risque de déforestation importée',             'ha/t',           'long',   'collectif',  false, 'Trase'),
('ef_single_score',     'climat',  'Score unique environnemental EF',              'mPt',            'long',   'collectif',  false, null),
-- Animaux
('animals_killed_land', 'animaux', 'Animaux terrestres tués',                      'animaux',        'court',  'collectif',  false, 'FAOSTAT : 1 / (rendement carcasse × part comestible)'),
('fish_killed',         'animaux', 'Poissons tués (y compris fourrage)',           'poissons',       'court',  'collectif',  false, 'Fishcount'),
('life_days_farmed',    'animaux', 'Jours de vie en élevage',                      'jours',          'vie',    'collectif',  false, null),
('pain_hours_annoying', 'animaux', 'Douleur gênante cumulée',                      'heures',         'vie',    'collectif',  false, 'Welfare Footprint'),
('pain_hours_hurtful',  'animaux', 'Douleur pénible cumulée',                      'heures',         'vie',    'collectif',  false, 'Welfare Footprint'),
('pain_hours_disabling','animaux', 'Douleur invalidante cumulée',                  'heures',         'vie',    'collectif',  false, 'Welfare Footprint'),
('pain_hours_excruciating','animaux','Douleur atroce cumulée',                     'heures',         'vie',    'collectif',  false, 'Welfare Footprint'),
('caged_share',         'animaux', 'Part d''animaux en cage',                       '%',              'actuel', 'collectif',  false, null),
-- Coût
('price_eur',           'cout',    'Prix',                                         '€',              'court',  'individuel', false, null),
('prep_minutes',        'cout',    'Temps de préparation',                         'min',            'court',  'individuel', false, null),
('climate_cost_eur',    'cout',    'Coût climat (valeur carbone officielle)',      '€',              'long',   'collectif',  false, 'ghg × valeur de l''action pour le climat'),
('env_cost_eur',        'cout',    'Coût environnemental monétisé',                '€',              'long',   'collectif',  false, 'True Costs of Food Database'),
('health_cost_eur',     'cout',    'Coût santé (ordre de grandeur)',               '€',              'long',   'collectif',  false, null);

-- Valeur de l'action pour le climat (France Stratégie, mars 2025), en € 2023 par kg CO2e
insert into public.monetization_factors (indicator_id, year, eur_per_unit, method, source_id) values
('ghg_100y_kgco2e', 2025, 0.256,  'VAC France Stratégie 2025', 'vac-2025'),
('ghg_100y_kgco2e', 2030, 0.300,  'VAC France Stratégie 2025', 'vac-2025'),
('ghg_100y_kgco2e', 2050, 0.563,  'VAC France Stratégie 2025', 'vac-2025'),
('ghg_100y_kgco2e', 2060, 0.7713, 'VAC France Stratégie 2025', 'vac-2025');
