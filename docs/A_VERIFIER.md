# À vérifier par un humain

Points à contrôler avant de considérer une étape comme validée. Cocher quand c'est fait.

## Étape A — CALNUT (sautée)

- [ ] Le site `ciqual.anses.fr` était en maintenance (503) le 2026-11-01 : relancer l'étape A quand il est de retour (téléchargement CALNUT, import `source_id = calnut` là où Ciqual n'a pas de valeur, vue `food_nutrients_best` avec priorité ciqual-2025 > calnut > bls-4.0 > usda-fdc).
- [ ] Vérifier la licence et la version exacte de CALNUT au moment du téléchargement (la ligne `sources.calnut` n'a pas de version).

## Étape B — 10 paires de plats

Chiffres par portion (4 portions par recette). **Mis à jour le 2026-11-01 après la relecture des recettes par Matt, puis après la session S22 (protéines végétales plus denses, `pairs.py` importé)** : calculés hors ligne à partir de `pipeline/pairs.csv` avec la formule des vues (`dish_nutrients`, `dish_impacts`, mêmes valeurs Ciqual et Agribalyse lues dans la base), car l'import dans Supabase reste à faire (voir « Relecture du lot C-D »). Les plats animaux n'ont pas changé et retrouvent exactement leurs anciennes valeurs. Pourcentage entre parenthèses : protéines de l'alternative rapportées au plat animal (70 % = objectif, plus un critère bloquant) ; « −x % » : écart de CO2e.

| Paire | Plat | g/portion | Protéines g | kcal | kg CO2e (fourchette) | DQR max | Couverture | Critères |
|---|---|---|---|---|---|---|---|---|
| boeuf-bourguignon | Bœuf bourguignon (animal) | 405 | 48.6 | 483 | 5.03 (5.03–5.03) | 2.87 | 1.00 | OK |
| boeuf-bourguignon | Bourguignon de protéines de soja et tofu fumé (maison) | 432 | 34.5 (71%) | 474 | 0.52 (0.52–0.52), −90 % | 2.87 | 1.00 | OK |
| boeuf-bourguignon | Bourguignon de seitan (commerce) | 422 | 36.6 (75%) | 430 | 0.57 (0.57–0.57), −89 % | 2.87 | 1.00 | OK |
| blanquette-de-veau | Blanquette de veau (animal) | 425 | 48.2 | 652 | 3.07 (3.07–3.07) | 3.73 | 1.00 | OK |
| blanquette-de-veau | Blanquette de protéines de soja (maison) | 438 | 31.0 (64%, objectif 70 % non atteint) | 535 | 0.42 (0.42–0.42), −86 % | 3.73 | 1.00 | OK |
| blanquette-de-veau | Blanquette de seitan (commerce) | 438 | 33.7 (70%) | 514 | 0.48 (0.48–0.48), −84 % | 3.73 | 1.00 | OK |
| poulet-roti-haricots-verts | Poulet rôti et haricots verts (animal) | 355 | 47.4 | 402 | 1.20 (1.20–1.20) | 2.31 | 1.00 | OK |
| poulet-roti-haricots-verts | Protéines de soja rôties et haricots verts (maison) | 388 | 37.5 (79%) | 396 | 0.49 (0.49–0.49), −59 % | 2.23 | 1.00 | OK |
| poulet-roti-haricots-verts | Seitan rôti et haricots verts (commerce) | 358 | 34.9 (74%) | 327 | 0.53 (0.53–0.53), −56 % | 2.23 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes à la bolognaise (animal) | 429 | 40.1 | 663 | 5.01 (5.01–5.01) | 3.12 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes aux protéines de soja texturées (maison) | 428 | 33.2 (83%) | 528 | 0.41 (0.41–0.41), −92 % | 3.12 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes au haché végétal (commerce) | 448 | 24.7 (62%, objectif 70 % non atteint) | 574 | 0.55 (0.55–0.55), −89 % | 3.12 | 1.00 | OK |
| quiche-lorraine | Quiche lorraine et salade verte (animal) | 336 | 20.6 | 776 | 1.00 (1.00–1.00) | 2.92 | 1.00 | OK |
| quiche-lorraine | Quiche au tofu fumé et salade verte (maison) | 354 | 23.7 (115%) | 710 | 0.41 (0.41–0.41), −59 % | 3.48 | 1.00 | OK |
| quiche-lorraine | Quiche au tofu fumé (pâte filo du commerce) et salade verte (commerce) | 334 | 22.2 (108%) | 497 | 0.41 (0.41–0.41), −59 % | 3.48 | 1.00 | OK |
| hachis-parmentier | Hachis parmentier (animal) | 419 | 32.4 | 569 | 4.79 (4.79–4.79) | 2.9 | 1.00 | OK |
| hachis-parmentier | Parmentier aux protéines de soja texturées (maison) | 420 | 27.0 (83%) | 449 | 0.49 (0.49–0.49), −90 % | 2.48 | 1.00 | OK |
| hachis-parmentier | Parmentier au haché végétal (commerce) | 435 | 19.1 (59%, objectif 70 % non atteint) | 482 | 0.61 (0.61–0.61), −87 % | 2.48 | 1.00 | OK |
| saumon-riz | Saumon et riz (animal) | 319 | 33.3 | 583 | 1.08 (1.08–1.08) | 3.73 | 1.00 | OK |
| saumon-riz | Tofu rôti et riz (maison) | 344 | 25.8 (77%) | 536 | 0.37 (0.37–0.37), −66 % | 3.73 | 1.00 | OK |
| saumon-riz | Pavé de soja et riz (commerce) | 319 | 25.1 (75%) | 630 | 0.49 (0.49–0.49), −54 % | 3.73 | 1.00 | OK |
| omelette | Omelette et pommes de terre rôties (animal) | 368 | 23.7 | 483 | 0.52 (0.52–0.52) | 2.92 | 1.00 | OK |
| omelette | Omelette à la farine de pois chiche et pommes de terre rôties (maison) | 368 | 17.9 (76%) | 495 | 0.26 (0.26–0.26), −49 % | 3.91 | 1.00 | OK |
| burger | Burger et frites (animal) | 395 | 41.3 | 892 | 4.93 (4.93–4.93) | 2.9 | 1.00 | OK |
| burger | Burger aux protéines de soja texturées et frites (maison) | 410 | 36.6 (88%) | 856 | 0.46 (0.46–0.46), −91 % | 3.93 | 1.00 | OK |
| burger | Burger à la galette végétale et frites (commerce) | 405 | 30.4 (74%) | 864 | 0.56 (0.56–0.56), −89 % | 2.9 | 1.00 | OK |
| croque-monsieur | Croque-monsieur et salade verte (animal) | 302 | 27.8 | 560 | 0.83 (0.83–0.83) | 2.97 | 1.00 | OK |
| croque-monsieur | Croque au tofu fumé et salade verte (maison) | 300 | 21.3 (77%) | 525 | 0.35 (0.35–0.35), −57 % | 2.92 | 1.00 | OK |
| croque-monsieur | Croque aux tranches végétales et salade verte (commerce) | 302 | 24.6 (89%) | 600 | 0.37 (0.37–0.37), −55 % | 2.92 | 1.00 | OK |

Critères bloquants (portion 300-500 g, couverture ≥ 0,95, règles de recette de `pairs.py`) respectés ; objectif de 70 % des protéines non atteint pour 7 versions végétales après S22 (affiché sur le site).

À contrôler :
- [ ] **Recettes** : proportions réalistes pour la cuisine française courante (fichier `pipeline/pairs.csv`, colonne `note`). En particulier : 500 g de bœuf cuit pour 4 (≈ 750 g cru) ; 450 g de veau cuit pour 4 ; 12 œufs pour 4 dans l'omelette. Les versions végétales ont été revues le 2026-11-01 (règles de Matt, voir « Relecture du lot C-D ») : par exemple bourguignon maison 450 g de tempeh + 240 g de lentilles (au lieu de 550 + 400).
- [ ] **Comparer 2 plats à la main** : par exemple bœuf bourguignon (48,6 g de protéines, 5,03 kg CO2e par portion) avec une calculatrice à partir des valeurs de `food_nutrients` et `food_impacts` des 8 codes.
- [ ] **Fourchettes** : Agribalyse ne publie pas de borne basse/haute ; la fourchette affichée vaut donc la valeur centrale. L'interface doit le dire (« fourchette non publiée ») plutôt que suggérer une précision. Le DQR max par plat est entre 2,2 et 3,9.
- [ ] **Hypothèses de code** (voir `docs/DECISIONS.md`) : carottes au code cru, œuf cru, vin compté à son poids (énergie surestimée des deux côtés), pain blanc pour le burger, pas de champignons ni de tomate crue.
- [ ] **Produits du commerce** : 30181 haché végétal (11,5 g de protéines/100 g, plus faible que la plupart des marques), 25593 galette blé-soja, 1030 fines tranches végétales, 1029_1/1029_2 spécialité végétale type fromage (0,25 g de protéines/100 g), 23412 pâte brisée végétale, 20914 pavé de soja, 25598 seitan. Vérifier qu'ils correspondent à des produits réellement vendus en France.
- [ ] **Classement animal** : 9 aliments passés en `mixte` (liste dans `docs/DECISIONS.md`). À trancher aussi : 24048 « Biscuit sec, sablé… autre que pur beurre » et 42000 « Substitut de repas hypocalorique, crème dessert » restent `is_animal = false` alors qu'ils contiennent probablement du lait, du beurre ou des œufs.
- [ ] **Textes** des descriptions et justifications (`pipeline/pair_dishes.csv`) : ton, exactitude (ex. « l'huile de colza apporte des oméga-3 ALA, pas d'EPA ni de DHA »).

## Étape C — Interface publique

- [ ] **Relire les textes** de l'accueil, de `/compare`, `/a-propos` et des ajouts de `/methodologie` (sections « Les paires de plats » et « Le coût climat ») : ton bienveillant, aucune promesse de santé.
- [ ] **Encadré « Là où le plat animal fait mieux »** : certains points n'ont pas encore de conseil sourcé (sel, par ex. pour le tofu à la sauce soja). Ajouter des conseils dans `data/conseils.json` si souhaité.
- [ ] **Couverture des micronutriments** : iode, vitamine D, B2, oméga-3 ne sont connus que pour une partie des ingrédients (ex. iode 9 % de la masse du bourguignon végétal). Une fois CALNUT importé (étape A), ces couvertures devraient monter.
- [ ] **Coût climat** : l'année affichée est l'année en cours (2026), valeur calculée avec la règle de croissance de la VAC (0,256 €/kg en 2025 × 1,032). Vérifier que c'est la lecture voulue.
- [ ] **Accessibilité AA** : contrôle automatique non fait (pas d'outil dans l'environnement). Vérifier avec axe ou Lighthouse : contrastes, ordre des titres, navigation au clavier des boutons de bascule (`aria-pressed`).
- [ ] **Page inconnue** : `/compare/xxx` affiche bien « page introuvable » mais renvoie un code HTTP 200 (rendu en flux de Next.js 16 avec Cache Components). À corriger si le référencement le demande.
- [ ] **Images de partage** : vérifier le rendu de `/compare/<plat>/opengraph-image` (accents, longueur des titres).
- [ ] **Signaler une erreur** : tester un envoi réel depuis le site et vérifier la ligne dans `error_reports` (table lisible seulement avec la clé secrète).

## Étape D — Piliers Animaux, Santé, Coût

- [ ] **Condition d'arrêt rencontrée** : les sources officielles PNNS (Santé publique France, mangerbouger.fr), Fishcount (HTTP 401) et HENI (Nature Food) étaient inaccessibles. Rien n'a été inventé ; décider s'il faut les remplacer ou réessayer plus tard (`TODO_SOURCES.md`).
- [ ] **FAOSTAT** : vérifier à la main un facteur, ex. porc 2024 = 21 936 820 têtes ÷ 2 094 250 t = 10,475 animaux par tonne de carcasse ; bovins 2024 = 3 986 140 ÷ 1 298 540 t = 3,070 par tonne. Licence FAOSTAT (`sources.faostat-qcl.commercial_use` = null) à vérifier.
- [x] **Lecture « 1 animal pour N portions »** (→ décision de Matt du 2026-11-01, formulation « Au moins 1 animal tué pour N portions (estimation basse) ») (ex. bœuf bourguignon : environ 1 animal pour 1 686 portions, estimation basse) : formulation à valider.
- [ ] **Classement CIRC** (`pipeline/iarc_meat.csv`, 318 aliments) : relire, en particulier 28700 « Jambon de porc à cuire » (classé « transformée » par son sous-groupe Ciqual alors qu'il peut être frais), les pâtés, et l'exclusion des abats et du gibier.
- [ ] **Texte santé** : « Le groupe du CIRC indique la solidité des preuves qu'un aliment peut causer un cancer, pas l'ampleur du risque » (`data/sante.json`) — phrase de lecture habituelle du CIRC, à confirmer avec la page Q&R du CIRC.
- [ ] **Open Prices** : médianes 2026 — carotte 2,15 €/kg (60 relevés), oignon 2,83 €/kg (55), citron 3,99 €/kg (38). Le citron est appliqué à la chair (prix du fruit entier). Rappel ODbL : la table `prices` dérivée doit rester sous ODbL et citer Open Prices.
- [ ] **Coût climat** : bœuf bourguignon 1,29 € (2025) et 2,83 € (2050) par portion, contre 0,17 € et 0,36 € pour la version maison.

## Étape E — Simulateur

- [ ] Vérifier à la main un résultat : bœuf bourguignon → bourguignon maison, 1 fois par semaine, 1 an = (5,03 − 0,647) × 52 ≈ 228 kg CO₂e ; 10 ans ≈ 2 280 kg.
- [ ] « Animaux épargnés » est une estimation basse (facteurs par kg de carcasse) et peut être une fraction d'animal (ex. 0,03 par an) : formulation à valider.
- [ ] Le texte de partage (« j'éviterais environ … kg CO₂e ») : ton et exactitude.
- [ ] « Si 10 % des Français… » : à activer seulement avec une fréquence de consommation sourcée (INCA 3, ANSES) et la population de référence (Insee).
- [ ] Badge HENI « usage non commercial à vérifier » : à confirmer quand la licence des données HENI sera connue.

## Étape F — GitHub Actions

- [ ] **Ajouter le secret** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clé publique, déjà visible dans le navigateur) : `gh secret set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` puis coller la clé. Sans lui, la CI saute l'étape de construction (avertissement). Ne **jamais** y mettre `SUPABASE_SECRET_KEY`.
- [ ] Lancer une fois la veille à la main (onglet Actions → « Sources watch » → *Run workflow*) pour vérifier les droits d'écriture des issues.
- [ ] Quand une issue de veille s'ouvre : vérifier la source, relancer le script du pipeline, mettre à jour `/sources`, puis `python pipeline/sources_watch.py --update`.

## Pilier Animaux — facteurs manquants (session 11)

- [ ] **Calcul à la main, poulet rôti** (150 g de poulet par portion) : animaux 0,150 × 0,625801 = 0,0939 ; jours de vie 0,0939 × 38 = 3,57 jours (+ 0,00023 jour pour 5 g de beurre) ; douleur atroce 0,0939 × 30 s = 2,8 s par portion. Vérifié dans la vue `dish_animal_impacts` le 2026-11-01.
- [ ] **Poulet, douleur** : seules les secondes de douleur atroce sont publiées en unité utilisable par OWID ; les trois autres intensités sont « donnée manquante ». Chercher les heures dans le livre Welfare Footprint (page exacte) si on veut les afficher.
- [ ] **Poules** : valeurs par poule importées (volière sans cage : 2 077 h gênante, 1 742 h pénible, 156 h invalidante, 0,04 h atroce ; borne haute = cages aménagées), phase de ponte seulement. **Question** : quelle durée de ponte sourcer pour rapporter au kg d'œufs ? welfarefootprint.org indique une phase de ponte supposée de 40 à 60 semaines (page « laying hens ») : suffisant ?
- [ ] **Question** : faut-il un facteur `animals_killed_land` pour les œufs et le lait (poules et vaches de réforme, poussins mâles, veaux) ? Rien n'a été créé.
- [ ] **Âges d'abattage** : poulet 38 jours (LA 07/85, p. 3/11), porc 6 mois = 182,6 jours (fiche du ministère, p. 1 ; données 2017), lapin 70 jours (LA 13/97, p. 4/30). Vérifier que ces « produits courants » représentent bien la moyenne française.
- [ ] **Veau** : 994 169 têtes et 142 497 tec en 2024 (Agreste SAA, PRA, ligne 18) = 6,977 veaux par tonne de carcasse. Ce sont des veaux « finis produits » dans l'année, pas des abattages : acceptable ? Sens du `STATUT_QUALITE` = 1 à vérifier dans la note méthodologique Agreste.
- [ ] **Lait** : 365 / 7 871 kg = 0,0464 jour de vie par kg (FAOSTAT 2024), appliqué aussi au beurre et aux fromages au poids du produit (sous-estimation forte pour un fromage).
- [ ] **Licences** : `commercial_use` à vérifier pour `dir-1999-74-ce`, `label-rouge-la-07-85`, `label-rouge-la-13-97`, `agri-bien-etre-porcs`, `agreste-saa`. Welfare Footprint : CC BY 4.0 « unless otherwise stated » (pied de page de welfarefootprint.org), citation affichée.
- [ ] **Fishcount** : toujours HTTP 401 depuis l'environnement de travail ; accessible depuis GitHub (issue #11).

## Lot A — S12 Santé

- [ ] **Repères PNNS** (`data/sante.json`, texte recopié du PDF de Santé publique France, pages imprimées 32, 33, 35 et 49) : relire les citations. Bœuf bourguignon : 125 g de viande = 25 % du repère hebdomadaire de 500 g ; 20 g de lardons = 13 % des 150 g de charcuterie.
- [ ] **Classement pour les repères** (`lib/compare/config.ts`) : viande = bovin, veau, porc, agneau, cheval, hors charcuterie (le PNNS inclut les abats et, p. 49, chèvre, sanglier, biche : le gibier n'est pas compté) ; poisson = catégories poissons (fruits de mer non comptés, alors que le tableau p. 49 dit « Poisson et fruits de mer ») ; légumes secs = sous-groupe Ciqual « légumineuses » hors aliments « frais/fraîche » (la farine de pois chiche et le quinoa, cité p. 49, ne sont pas comptés). Alternative : une liste d'aliments relue à la main.
- [ ] **Poisson et légumes secs** : affichés en grammes par portion, sans pourcentage (le repère est une fréquence, pas une quantité). Alternative : « compte pour 1 des 2 fois par semaine », mais le PNNS ne définit pas de portion minimale.
- [ ] **Licence du PDF PNNS** : non indiquée dans le document ; `commercial_use = null`.
- [x] **EAT-Lancet 2025** : The Lancet inaccessible (403). Faut-il accepter le *Summary Report 2025* d'EAT Forum comme source ? → **Décision de Matt (2026-11-01)** : accepté comme source provisoire, chaque chiffre cité avec sa page, `commercial_use = null`.
- [ ] **EAT-Lancet** : à recouper avec l'article du Lancet.
- [ ] **HENI** : non intégré (pas de licence ouverte). Le badge du simulateur dit désormais « HENI · usage non commercial » et la valeur reste « donnée manquante ». Demander une autorisation aux auteurs ?

## Lot A — S13 Prix réels

- [ ] **Médianes importées** (12 derniers mois) : carotte 1,95 €/kg, oignon 2,28 €/kg, steak haché 15 % cru 17,53 €/kg (RNM, moyennes mensuelles) ; tofu nature 10,36 €/kg (47 relevés), tofu fumé 17,25 (25), tempeh 22,58 (10), seitan 23,61 (9), beurre doux 11,94 (286), flocons d'avoine 3,98 (61), ketchup 4,80 (235) (Open Prices). Vérifier quelques relevés à la main.
- [ ] **Correspondances catégories** : « en:plain-tofu » ↔ 20904 tofu nature, « en:unsalted-butters » ↔ 16400 beurre 80 % doux (inclut-il des beurres allégés ?), « en:ketchup » ↔ 11008. Alternative : liste de codes-barres relue.
- [x] **Prix total des plats** (→ **décision de Matt** : recettes en poids cuits ; rendements de cuisson USDA en session S17b, sinon donnée manquante) : jamais affiché (couverture de 0 à 53 %). Le blocage principal est l'absence de rendement de cuisson sourcé pour les ingrédients cuits. Décider d'une source (ex. USDA, domaine public) ou d'utiliser des codes crus dans les recettes.
- [ ] **Ordre des sources** RNM > Open Prices : à valider. Alternative : médiane commune.
- [ ] **ODbL** : la table `prices` contient maintenant des prix Open Prices dérivés (prix au kg calculés) ; elle doit être partagée sous ODbL si elle est rediffusée.

## Lot A — S14 Corrections et cohérence

- [ ] **404** : `/compare/xxx` renvoie maintenant 404 (HTML de `/introuvable`, `noindex`). La page `/introuvable` elle-même répond 200 si on la visite directement. Alternative : `global-not-found` (expérimental).
- [ ] **Valeur carbone** : année de référence unique 2025 (0,256 €/kg) partout, y compris pour 10 ans dans le simulateur. Alternative : valeur de chaque année (plus élevée dans le temps). Ancien point « l'année affichée est 2026 » (étape C) : caduc.
- [x] **Conseil B2** (`data/conseils.json`, version 0.3) : **validé par Matt le 2026-11-01**. Texte : « statut en vitamine B2 plus faible chez les végétariens comparés aux individus qui consomment de la chair animale » (p. 30) ; « Parmi les lacto-ovovégétariens, ceux qui limitent leur consommation de lait et de produits laitiers frais, ont un apport plus faible en vitamine B2 » (p. 23) ; groupe « levures et autres » ≈ 15 g/j pour les végétaliens (p. 24).
- [ ] **Reclassements** : 24048 (sablé « autre que pur beurre ») et 23399 (pâte brisée, aliment moyen) passés en `mixte` sur présomption ; alternative : les laisser `is_animal = false` avec une note. Les 8 autres sont prouvés par le détail Agribalyse.
- [x] **Quiche du commerce** (**acceptée par Matt le 2026-11-01**) : désormais à la pâte filo (316 g par portion, 22,0 g de protéines, −60 % de CO₂e). Recette réaliste ?
- [x] **Formulations** (→ **décision de Matt** : « Au moins 1 animal tué pour N portions (estimation basse) » partout) : « soit 1 animal pour N portions au plus (le nombre d'animaux est une estimation basse) » et, dans le simulateur, « Abattages évités, en moyenne (au moins) — moyenne statistique, pas un animal précis épargné ». Alternative : « contribue à l'abattage d'environ 1 animal toutes les N portions ».
- [ ] **Lait** : le facteur jours de vie ne s'applique plus qu'à 64 aliments (lait liquide hors poudre et lait concentré, yaourts et laits fermentés). Poulet rôti : 3,567 jours par portion (le beurre ne compte plus) ; lasagnes : 75 g de lait × 0,04637 = 0,0035 jour.
- [ ] **Douleur du poulet** (gênante, pénible, invalidante) : toujours « donnée manquante » ; le livre n'a pas pu être consulté (voir `TODO_SOURCES.md`).
- [ ] **CALNUT** : ciqual.anses.fr toujours en maintenance (503).

## Lot B — EAT-Lancet (suite de S12, décision de Matt)

- [ ] **EAT-Lancet 2025** : repères recopiés de la figure 01, p. 11 du *Summary Report* (EAT Forum), lus par position dans le PDF (pas de rendu image disponible) : bœuf, porc ou agneau 15 g/j (0-30), volaille 30 (0-60), poisson et fruits de mer 30 (0-100), œufs 15 (0-25). Vérifier sur la figure. À recouper avec l'article du Lancet.
- [ ] **Non comparés** : produits laitiers 250 g/j (0-500) et légumineuses 75 g/j (0-150), car le résumé ne dit pas s'il s'agit d'équivalent lait / de poids sec ou cuit. Alternative : les afficher avec cette réserve.
- [ ] **Correspondances** : « bœuf, porc ou agneau » inclut le veau et la charcuterie de ces espèces (lardons, jambon) ; volaille hors œufs ; poisson et fruits de mer = poissons, crustacés, mollusques, céphalopodes.

## Lot B — S15 Recherche sur tout le catalogue

- [ ] **Règles d'alternatives** (`pipeline/auto_alternatives_rules.csv`, 25 règles) : relire le « même rôle » de chaque famille. Exemples à contrôler : quenelle de volaille → spécialité végétale type pâté ; emmental → spécialité végétale type fromage (0,25 g de protéines pour 100 g contre 27,9 g : écart affiché) ; beurre → huiles ; poisson → seitan / tempeh / tofu fumé (pas d'EPA ni de DHA, signalé dans la règle).
- [ ] **Résultat** : 3 664 alternatives pour 1 253 aliments animaux (`pipeline/auto_alternatives.csv`). Les plats composés sans équivalent végétal du même type n'ont pas d'alternative (ex. lasagnes bolognaise préemballées, pizza bolognaise, croque-monsieur) : seule la paire vérifiée existe.
- [ ] **Recherche** : fautes légères tolérées (« quiche lorene »), mais pas les mots courts très déformés (« lazagne ») ; synonymes dans `search_synonyms` à compléter.
- [ ] **Portion type** : non sourcée, la page aliment compare pour 100 g. À ajouter si une source (INCA 3) est intégrée.
- [ ] **Libellé du verdict** sur `/aliment` : « le plat animal fait mieux » est réutilisé pour un aliment ; alternative : « l'aliment d'origine fait mieux ».
- [ ] **Correction de `fetch_all`** (pipeline) : les scripts déjà exécutés ont été revérifiés (CIRC, lait, classement animal : identiques).

## Lot B — S16 « Analyse ta recette »

- [x] **Table de substitutions** (→ **relecture de Matt appliquée le 2026-11-01** : beurre → huile à quantité de matière grasse égale, viande crue → seitan avec le rendement de cuisson USDA ; les 14 autres règles validées) (`pipeline/substitutions.csv`) : relire chaque remplacement et sa justification (viande hachée → lentilles vertes cuites, viande → seitan, poisson et œuf → tofu ferme, charcuterie → tofu fumé, lait → boisson soja enrichie, crème → crème de soja, beurre → huile de colza, fromage → spécialités végétales, yaourt → dessert au soja nature). Ratio 1 (même masse) partout : à ajuster ? *En cours de relecture par Matt (2026-11-01) : ne bloque pas les lots C et D.*
- [ ] **Vérification faite** : bolognaise de test (400 g de bœuf haché 15 % cuit, 100 g de lardons fumés cuits, 350 g de pâtes cuites, 350 g de coulis, 4 portions) : 4,908 kg CO₂e et 34,4 g de protéines par portion ; version végétale 0,261 kg CO₂e et 21,0 g de protéines. Identique au calcul à la main.
- [x] **Connexion par e-mail** : à tester en production. Il faut que `https://veganizer.vercel.app/recette` soit dans les « Redirect URLs » de Supabase Auth (tableau de bord, non vérifiable d'ici) et que l'envoi d'e-mails soit configuré (le service par défaut de Supabase est très limité en volume). **Décision de Matt (2026-11-01) : pas de compte en V1**, enregistrement masqué (« bientôt ») ; nom de domaine + SMTP personnalisé dans « Hors V1 ».
- [ ] **Ingrédients sans remplacement** (ex. miel) : gardés et signalés. Faut-il des règles supplémentaires ?


## Lot B — S17 Paires vérifiées en nombre

30 nouvelles paires (40 au total), **toutes à relire** : recettes rédigées par Claude (aucune base de recettes externe utilisée), choisies parmi les plats les plus consommés d'INCA 3 (groupes « plats composés », œufs, sandwichs, pizzas…), pour tous les moments de repas (petit-déjeuner, déjeuner, dîner, goûter). Critères vérifiés automatiquement pour les 90 plats : portion 300-500 g, protéines ≥ 70 % du plat animal, couverture 1,00.

- [x] **Relire chaque recette** (→ **relecture de Matt appliquée le 2026-11-01**, `RELECTURE_RECETTES.md` ; voir « Relecture du lot C-D ») (`pipeline/pairs.csv`, colonne `note`) : réalisme des proportions et des portions. Cas à surveiller : gratin dauphinois végétal avec pois chiches dans la salade (pour atteindre 70 % des protéines) ; tartiflette végétale avec haricots blancs ; steak frites remplacé par 700 g de galettes pour 4 ; pot-au-feu au tempeh (650 g pour 4) ; « cordon bleu » de tempeh ; crêpes du commerce à la boisson au soja aromatisée. *En cours de relecture par Matt (2026-11-01) : ne bloque pas les lots C et D.*
- [ ] **Conventions de codes** reprises des 10 premières paires : carottes, endives, poireaux et chair à saucisse au code cru (cuits dans le plat) ; œufs au code « œuf cru » ; pain grillé (7004) comme chapelure.
- [x] **Règle 9 et produits du commerce** : des produits végétaux transformés classés « plats composés » par Ciqual sont utilisés comme ingrédients des versions « du commerce » (galette blé-soja 25593, nuggets 25227_1, boulettes 25589_1, bâtonnets panés 25229 ; déjà présents : haché végétal 30181, pavé de soja 20914). Interprétation retenue : la règle vise les ingrédients qui rendraient les impacts animaux incalculables (aliments `mixte`, plats contenant des produits animaux) ; un produit végétal transformé est admis. À valider, sinon ces versions doivent être réécrites. **Décision de Matt (2026-11-01) : exception acceptée**, vérification notée dans `pairs.csv` (colonne `rule9_check`) et règle ajoutée à `CLAUDE.md`.
- [ ] **Objectif 100+ non atteint** : 40 paires. Prochaine série (60+) à prévoir, idéalement après relecture de celles-ci.

Chiffres clés par portion (nouvelles paires, mis à jour le 2026-11-01 après la relecture : même méthode que le tableau de l'étape B) :

| Paire | Plat | g/portion | Protéines g | kcal | kg CO2e (fourchette) | DQR max | Couverture | Critères |
|---|---|---|---|---|---|---|---|---|
| pizza-jambon-fromage | Pizza jambon-fromage et salade verte (animal) | 328 | 25.4 | 619 | 0.80 (0.80–0.80) | 2.97 | 1.00 | OK |
| pizza-jambon-fromage | Pizza au tofu fumé, salade verte (maison) | 302 | 19.2 (75%) | 561 | 0.41 (0.41–0.41), −49 % | 2.96 | 1.00 | OK |
| pizza-jambon-fromage | Pizza aux tranches végétales et râpé végétal, salade verte (commerce) | 308 | 21.1 (83%) | 630 | 0.43 (0.43–0.43), −46 % | 2.96 | 1.00 | OK |
| gratin-dauphinois | Gratin dauphinois et salade verte (animal) | 428 | 12.7 | 478 | 0.72 (0.72–0.72) | 2.92 | 1.00 | OK |
| gratin-dauphinois | Gratin de pommes de terre à la crème de soja, salade verte (maison) | 412 | 9.0 (71%) | 353 | 0.43 (0.43–0.43), −40 % | 2.92 | 1.00 | OK |
| gratin-dauphinois | Gratin de pommes de terre au fromage végétal à tartiner, salade verte (commerce) | 438 | 11.9 (94%) | 397 | 0.48 (0.48–0.48), −34 % | 2.92 | 1.00 | OK |
| nuggets-frites | Nuggets de poulet maison et frites (animal) | 315 | 40.3 | 670 | 1.02 (1.02–1.02) | 2.9 | 1.00 | OK |
| nuggets-frites | Nuggets de protéines de soja maison et frites (maison) | 335 | 31.1 (77%) | 694 | 0.41 (0.41–0.41), −60 % | 2.9 | 1.00 | OK |
| nuggets-frites | Nuggets soja et blé et frites (commerce) | 315 | 29.1 (72%) | 712 | 0.47 (0.47–0.47), −54 % | 2.9 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich jambon-beurre, carottes râpées et pomme (animal) | 445 | 20.9 | 677 | 0.71 (0.71–0.71) | 2.97 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich au tofu fumé, carottes râpées et pomme (maison) | 442 | 19.3 (92%) | 659 | 0.34 (0.34–0.34), −52 % | 2.72 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich aux tranches végétales, carottes râpées et pomme (commerce) | 450 | 28.3 (135%) | 658 | 0.36 (0.36–0.36), −50 % | 2.72 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes de bœuf à la tomate et spaghetti (animal) | 412 | 40.8 | 679 | 4.89 (4.89–4.89) | 3.12 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes de protéines de soja à la tomate, spaghetti (maison) | 420 | 37.0 (91%) | 597 | 0.45 (0.45–0.45), −91 % | 3.91 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes végétales à la tomate, spaghetti (commerce) | 402 | 31.4 (77%) | 614 | 0.55 (0.55–0.55), −89 % | 3.12 | 1.00 | OK |
| tortilla-espagnole | Tortilla espagnole et salade verte (animal) | 389 | 19.9 | 505 | 0.55 (0.55–0.55) | 2.92 | 1.00 | OK |
| tortilla-espagnole | Tortilla à la farine de pois chiche et salade verte (maison) | 401 | 16.2 (81%) | 528 | 0.37 (0.37–0.37), −33 % | 3.91 | 1.00 | OK |
| tartiflette | Tartiflette et salade verte (animal) | 461 | 24.0 | 639 | 1.16 (1.16–1.16) | 2.92 | 1.00 | OK |
| tartiflette | Tartiflette au tofu fumé, salade verte (maison) | 449 | 19.1 (79%) | 444 | 0.62 (0.62–0.62), −47 % | 2.92 | 1.00 | OK |
| tartiflette | Tartiflette au fromage végétal et tofu fumé, salade verte (commerce) | 481 | 16.6 (69%, objectif 70 % non atteint) | 551 | 0.70 (0.70–0.70), −40 % | 2.92 | 1.00 | OK |
| paella | Paëlla au poulet, chorizo et crevettes (animal) | 422 | 42.0 | 642 | 2.37 (2.37–2.37) | 3.73 | 1.00 | OK |
| paella | Paëlla aux protéines de soja, tofu fumé et tofu (maison) | 438 | 33.2 (79%) | 628 | 0.58 (0.58–0.58), −75 % | 3.73 | 1.00 | OK |
| paella | Paëlla au seitan et saucisse végétale (commerce) | 382 | 32.0 (76%) | 558 | 0.56 (0.56–0.56), −76 % | 3.73 | 1.00 | OK |
| chili-con-carne | Chili con carne et riz (animal) | 481 | 39.0 | 625 | 4.93 (4.93–4.93) | 3.89 | 1.00 | OK |
| chili-con-carne | Chili aux protéines de soja texturées, riz (maison) | 499 | 37.2 (96%) | 562 | 0.56 (0.56–0.56), −89 % | 3.89 | 1.00 | OK |
| chili-con-carne | Chili au haché végétal, riz (commerce) | 499 | 28.9 (74%) | 554 | 0.65 (0.65–0.65), −87 % | 3.89 | 1.00 | OK |
| endives-au-jambon | Endives au jambon et pommes de terre (animal) | 465 | 23.7 | 404 | 1.00 (1.00–1.00) | 2.97 | 1.00 | OK |
| endives-au-jambon | Endives au tofu fumé, béchamel au soja et pommes de terre (maison) | 452 | 17.2 (73%) | 355 | 0.47 (0.47–0.47), −53 % | 2.92 | 1.00 | OK |
| endives-au-jambon | Endives aux tranches végétales et râpé végétal, pommes de terre (commerce) | 462 | 23.2 (98%) | 432 | 0.50 (0.50–0.50), −50 % | 2.92 | 1.00 | OK |
| tomates-farcies | Tomates farcies et riz (animal) | 436 | 21.1 | 599 | 1.08 (1.08–1.08) | 3.73 | 1.00 | OK |
| tomates-farcies | Tomates farcies aux protéines de soja et riz (maison) | 436 | 25.0 (118%) | 426 | 0.59 (0.59–0.59), −45 % | 3.73 | 1.00 | OK |
| tomates-farcies | Tomates farcies au haché végétal et riz (commerce) | 436 | 17.9 (85%) | 419 | 0.67 (0.67–0.67), −39 % | 3.73 | 1.00 | OK |
| steak-frites | Steak frites et salade verte (animal) | 386 | 48.1 | 592 | 5.75 (5.75–5.75) | 2.92 | 1.00 | OK |
| steak-frites | Protéines de soja grillées, frites et salade verte (maison) | 416 | 39.3 (82%) | 708 | 0.50 (0.50–0.50), −91 % | 2.92 | 1.00 | OK |
| steak-frites | Galettes végétales, frites et salade verte (commerce) | 411 | 34.7 (72%) | 777 | 0.64 (0.64–0.64), −89 % | 2.92 | 1.00 | OK |
| escalope-poulet-creme-riz | Escalope de poulet à la crème, riz et haricots verts (animal) | 416 | 45.2 | 579 | 1.38 (1.38–1.38) | 3.73 | 1.00 | OK |
| escalope-poulet-creme-riz | Protéines de soja à la crème de soja, riz et haricots verts (maison) | 441 | 35.9 (79%) | 578 | 0.54 (0.54–0.54), −61 % | 3.73 | 1.00 | OK |
| escalope-poulet-creme-riz | Seitan à la crème de soja, riz et haricots verts (commerce) | 441 | 38.9 (86%) | 554 | 0.62 (0.62–0.62), −55 % | 3.73 | 1.00 | OK |
| saucisse-lentilles | Saucisses de Toulouse aux lentilles (animal) | 328 | 34.7 | 513 | 1.35 (1.35–1.35) | 3.01 | 1.00 | OK |
| saucisse-lentilles | Tofu fumé aux lentilles (maison) | 328 | 30.8 (89%) | 398 | 0.34 (0.34–0.34), −75 % | 3.01 | 1.00 | OK |
| saucisse-lentilles | Saucisses végétales aux lentilles (commerce) | 328 | 43.0 (124%) | 484 | 0.37 (0.37–0.37), −72 % | 3.01 | 1.00 | OK |
| coquillettes-jambon | Coquillettes au jambon, emmental et petits pois (animal) | 358 | 33.2 | 591 | 0.91 (0.91–0.91) | 3.12 | 1.00 | OK |
| coquillettes-jambon | Coquillettes au tofu fumé et petits pois (maison) | 342 | 25.5 (77%) | 546 | 0.45 (0.45–0.45), −50 % | 3.12 | 1.00 | OK |
| coquillettes-jambon | Coquillettes aux tranches végétales, râpé végétal et petits pois (commerce) | 358 | 31.5 (95%) | 636 | 0.49 (0.49–0.49), −46 % | 3.12 | 1.00 | OK |
| poisson-pane-puree | Poisson pané maison et purée (animal) | 398 | 37.9 | 546 | 1.68 (1.68–1.68) | 2.96 | 1.00 | OK |
| poisson-pane-puree | Tofu pané maison et purée (maison) | 420 | 27.9 (74%) | 617 | 0.46 (0.46–0.46), −73 % | 2.87 | 1.00 | OK |
| poisson-pane-puree | Bâtonnets panés soja et blé et purée (commerce) | 368 | 29.8 (79%) | 571 | 0.51 (0.51–0.51), −70 % | 2.48 | 1.00 | OK |
| galette-complete | Galette complète (jambon, œuf, emmental) et salade verte (animal) | 384 | 31.4 | 598 | 0.88 (0.88–0.88) | 3.38 | 1.00 | OK |
| galette-complete | Galette de sarrasin au tofu fumé et tofu brouillé, salade verte (maison) | 356 | 22.6 (72%) | 524 | 0.35 (0.35–0.35), −60 % | 3.38 | 1.00 | OK |
| galette-complete | Galette de sarrasin aux tranches végétales et râpé végétal, salade verte (commerce) | 331 | 23.2 (74%) | 555 | 0.35 (0.35–0.35), −61 % | 3.38 | 1.00 | OK |
| pates-carbonara | Pâtes à la carbonara (animal) | 310 | 28.1 | 675 | 0.90 (0.90–0.90) | 3.12 | 1.00 | OK |
| pates-carbonara | Pâtes « carbonara » au tofu fumé (maison) | 310 | 24.1 (86%) | 563 | 0.40 (0.40–0.40), −56 % | 3.91 | 1.00 | OK |
| pates-carbonara | Pâtes « carbonara » aux tranches végétales (commerce) | 308 | 28.4 (101%) | 599 | 0.41 (0.41–0.41), −55 % | 3.12 | 1.00 | OK |
| flammekueche | Flammekueche et salade verte (animal) | 361 | 18.8 | 663 | 0.86 (0.86–0.86) | 2.92 | 1.00 | OK |
| flammekueche | Flammekueche au tofu fumé et salade verte (maison) | 369 | 18.9 (101%) | 585 | 0.49 (0.49–0.49), −44 % | 2.92 | 1.00 | OK |
| flammekueche | Flammekueche aux tranches végétales et salade verte (commerce) | 361 | 26.4 (141%) | 637 | 0.50 (0.50–0.50), −42 % | 2.92 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois et parmesan (animal) | 375 | 18.0 | 573 | 0.63 (0.63–0.63) | 3.73 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois (maison) | 352 | 11.8 (65%, objectif 70 % non atteint) | 483 | 0.44 (0.44–0.44), −30 % | 3.73 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois et râpé végétal (commerce) | 372 | 11.8 (66%, objectif 70 % non atteint) | 537 | 0.49 (0.49–0.49), −23 % | 3.73 | 1.00 | OK |
| couscous-poulet-merguez | Couscous poulet et merguez (animal) | 445 | 45.5 | 611 | 2.66 (2.66–2.66) | 3.11 | 1.00 | OK |
| couscous-poulet-merguez | Couscous aux protéines de soja (maison) | 449 | 37.8 (83%) | 536 | 0.45 (0.45–0.45), −83 % | 3.11 | 1.00 | OK |
| couscous-poulet-merguez | Couscous au seitan et saucisses végétales (commerce) | 420 | 38.0 (83%) | 493 | 0.50 (0.50–0.50), −81 % | 3.11 | 1.00 | OK |
| poulet-curry-coco | Poulet au curry et lait de coco, riz (animal) | 369 | 40.7 | 590 | 1.13 (1.13–1.13) | 4.21 | 1.00 | OK |
| poulet-curry-coco | Curry de protéines de soja au lait de coco, riz (maison) | 391 | 32.0 (79%) | 634 | 0.46 (0.46–0.46), −59 % | 4.21 | 1.00 | OK |
| poulet-curry-coco | Curry de seitan au lait de coco, riz (commerce) | 391 | 34.7 (85%) | 613 | 0.53 (0.53–0.53), −53 % | 4.21 | 1.00 | OK |
| pot-au-feu | Pot-au-feu (animal) | 392 | 42.2 | 332 | 4.37 (4.37–4.37) | 2.86 | 1.00 | OK |
| pot-au-feu | Pot-au-feu aux protéines de soja (maison) | 415 | 29.0 (69%, objectif 70 % non atteint) | 341 | 0.43 (0.43–0.43), −90 % | 2.64 | 1.00 | OK |
| pot-au-feu | Pot-au-feu au seitan (commerce) | 415 | 31.7 (75%) | 320 | 0.50 (0.50–0.50), −89 % | 2.64 | 1.00 | OK |
| pates-saumon-epinards | Pâtes au saumon, crème et épinards (animal) | 355 | 30.0 | 606 | 0.95 (0.95–0.95) | 3.12 | 1.00 | OK |
| pates-saumon-epinards | Pâtes au tofu fumé, crème de soja et épinards (maison) | 355 | 25.1 (84%) | 502 | 0.46 (0.46–0.46), −52 % | 3.12 | 1.00 | OK |
| pates-saumon-epinards | Pâtes aux lanières végétales, crème de soja et épinards (commerce) | 330 | 28.8 (96%) | 500 | 0.41 (0.41–0.41), −57 % | 3.12 | 1.00 | OK |
| salade-cesar | Salade César au poulet (animal) | 345 | 39.1 | 466 | 1.01 (1.01–1.01) | 3.16 | 1.00 | OK |
| salade-cesar | Salade César aux protéines de soja et tofu grillés (maison) | 352 | 27.9 (71%) | 448 | 0.36 (0.36–0.36), −65 % | 3.16 | 1.00 | OK |
| salade-cesar | Salade César au seitan (commerce) | 355 | 30.5 (78%) | 448 | 0.45 (0.45–0.45), −55 % | 3.16 | 1.00 | OK |
| oeufs-brouilles-tartines | Petit-déjeuner : œufs brouillés, tartines et jus d'orange (animal) | 375 | 23.5 | 507 | 0.61 (0.61–0.61) | 2.44 | 1.00 | OK |
| oeufs-brouilles-tartines | Petit-déjeuner : tofu brouillé, tartines et jus d'orange (maison) | 360 | 23.8 (101%) | 498 | 0.44 (0.44–0.44), −29 % | 2.37 | 1.00 | OK |
| crepes-compote | Goûter : crêpes et compote (animal) | 358 | 17.3 | 568 | 0.51 (0.51–0.51) | 3.09 | 1.00 | OK |
| crepes-compote | Goûter : crêpes à la boisson au soja et compote (maison) | 342 | 14.4 (83%) | 542 | 0.27 (0.27–0.27), −47 % | 3.91 | 1.00 | OK |
| cordon-bleu-puree | Cordon bleu maison et purée (animal) | 425 | 52.0 | 646 | 1.58 (1.58–1.58) | 2.97 | 1.00 | OK |
| cordon-bleu-puree | « Cordon bleu » de protéines de soja au tofu fumé et purée (maison) | 450 | 40.6 (78%) | 659 | 0.57 (0.57–0.57), −64 % | 2.87 | 1.00 | OK |
| cordon-bleu-puree | « Cordon bleu » de seitan aux tranches végétales et purée (commerce) | 428 | 38.8 (75%) | 642 | 0.62 (0.62–0.62), −61 % | 2.87 | 1.00 | OK |
| roti-porc-pommes-de-terre | Rôti de porc, pommes de terre rôties et haricots verts (animal) | 380 | 43.9 | 415 | 1.31 (1.31–1.31) | 2.86 | 1.00 | OK |
| roti-porc-pommes-de-terre | Protéines de soja rôties, pommes de terre rôties et haricots verts (maison) | 405 | 33.7 (77%) | 436 | 0.45 (0.45–0.45), −65 % | 2.55 | 1.00 | OK |
| roti-porc-pommes-de-terre | Seitan rôti, pommes de terre rôties et haricots verts (commerce) | 405 | 36.7 (84%) | 412 | 0.53 (0.53–0.53), −59 % | 2.55 | 1.00 | OK |
| cabillaud-pommes-vapeur | Cabillaud, pommes de terre vapeur et épinards (animal) | 422 | 39.2 | 377 | 2.61 (2.61–2.61) | 3.68 | 1.00 | OK |
| cabillaud-pommes-vapeur | Tofu au citron, pommes de terre vapeur et épinards (maison) | 450 | 29.8 (76%) | 492 | 0.51 (0.51–0.51), −81 % | 3.68 | 1.00 | OK |
| cabillaud-pommes-vapeur | Pavé de soja, pommes de terre vapeur et épinards (commerce) | 418 | 28.9 (74%) | 583 | 0.65 (0.65–0.65), −75 % | 3.68 | 1.00 | OK |

## Lot B — S17b Rendements de cuisson

- [ ] **Correspondance** 6254 (steak haché 15 % cru) → 6255 (cuit) avec la ligne USDA NDB 23574 « Beef, ground, medium fat (12%-22%), patty », Pan-broiled, 73 % (70,78-75,97 %, n = 4) : la poêle correspond-elle bien à la cuisson de Ciqual ? Prix dérivé : 17,53 ÷ 0,73 = 24,01 €/kg (fourchette 22,09-25,08).
- [ ] **Effet** : la couverture des prix des plats au bœuf haché monte (burger 33 %, lasagnes 30 %, hachis 25 %, boulettes 24 %, chili 21 %) mais reste sous 95 % : aucun prix total n'est encore affiché.
- [ ] **Suite** : ajouter des prix crus au détail pour d'autres viandes (sans os) et des rendements pour pâtes, riz, légumineuses (pas de source exploitable trouvée : l'Agriculture Handbook 102 n'existe qu'en images scannées).

## Lot C — S18 Scores et vainqueurs

- [ ] **Validation des sens par un·e diététicien·ne** (`data/score_rules.json`, catégorie Nutrition) : protéines, fibres ↑ ; sel, acides gras saturés, sucres ↓ (composantes du Nutri-Score, page Santé publique France mise à jour le 19 mars 2026) ; fer, calcium, zinc, B12, iode, vitamine D, B2 ↑ (références ANSES 2025) ; oméga-3 ALA, EPA, DHA ↑ (ANSES, « Les lipides », 2021). « Plus = mieux » ignore la limite supérieure de sécurité (LSS) : simplification à valider.
- [ ] **Validation des sens par une personne experte en ACV** : les 16 indicateurs Agribalyse « moins = mieux » ; score unique EF et sous-parties du changement climatique (fossile, biogénique, affectation des sols) affichés, non comptés (pour ne pas compter deux fois). Les valeurs négatives (ex. utilisation des sols) sont comparées telles que publiées.
- [x] **Sucres** (→ **validé par Matt le 2026-11-01**) : comptés « moins = mieux » (sucres totaux, comme le Nutri-Score), conformément à DESIGN.md § 5. Cela remplace la décision de l'étape C (« sucres totaux affichés sans verdict »). Alternative : ne pas les compter (les repères visent les sucres ajoutés).
- [x] **Vitamine B2** (→ **validé par Matt le 2026-11-01**) : ajoutée aux indicateurs comptés (absente de la liste de DESIGN.md § 5) pour ne pas retirer du score un point où le plat animal fait souvent mieux (règle 3). Alternative : l'afficher sans la compter.
- [x] **Oméga-3** (→ **décision de Matt, 2026-11-01** : deux indicateurs, ALA d'un côté et EPA + DHA de l'autre, somme ingrédient par ingrédient des valeurs Ciqual ; `fa_epa_dha_g` dans `data/score_rules.json` 1.1) : trois indicateurs (ALA, EPA, DHA), car l'ANSES donne trois références.
- [ ] **Données partielles non comptées** : un indicateur dont les données couvrent moins de 95 % de la masse d'un plat n'est pas compté (même règle que les verdicts existants). Pour les animaux, une valeur partielle est une borne basse (> 0 contre 0 pour le végétal) qui suffirait à départager ; alternative : compter ces cas.
- [ ] **Santé** : grammes de viande transformée (CIRC groupe 1) et de viande rouge (groupe 2A) par portion, « moins = mieux ». Les repères PNNS, fondés sur les mêmes grammes, ne sont pas comptés (double compte) ; EAT-Lancet (source provisoire) non compté.
- [ ] **Économie** : le coût climat est proportionnel au CO₂e déjà compté en environnement (double compte voulu par DESIGN.md § 5). Alternative : ne compter que le prix.
- [ ] **Bases** : le verdict global et les cartes sont calculés par portion ; seul l'onglet Nutrition suit l'unité choisie (portion, 100 kcal, 10 g de protéines).

## Lot C — S19 Système de design

- [ ] **Contrastes** : 27 couples texte/fond ≥ 4,5:1 et 9 couples marque/fond (séries, anneau de focus) ≥ 3:1, vérifiés par `tests/contrast.test.ts` (formule WCAG 2). Les fonds translucides du bandeau (`rgba(255,255,255,0.08)` sur `ink`) sont calculés par mélange.
- [ ] **Anneau de focus sur le bandeau sombre** : `#0B6E5D` sur `#0F2724` serait trop peu visible ; le bandeau utilise `plant-on-dark` (`#3FC1A3`). Alternative : anneau blanc.
- [ ] **Tutoiement** : les nouveaux textes suivent les maquettes (« Ton plat… », « Et si je change ? », « Analyser ma recette »). Les anciennes pages au vouvoiement sont passées au tutoiement là où elles sont refaites. Alternative : vouvoiement partout.
- [ ] **Favicon** : `app/icon.svg` (logo) remplace le `favicon.ico` par défaut de Next.js ; vieux navigateurs sans SVG : pas d'icône. Alternative : ajouter un `favicon.ico` généré depuis le logo.
- [ ] **Images de partage** : rendu de `/opengraph-image` et `/compare/<plat>/opengraph-image` (titres longs, accents) à regarder.

## Lot C — S20 Refonte des pages

- [x] **Nutrition du bœuf bourguignon : « Plat animal, provisoire, 1–0 »** (→ **décisions de Matt, 2026-11-01** : « < x » de Ciqual comptés comme fourchette [0 ; x], ingrédients identiques des deux côtés mis de côté pour le verdict, point seulement si les fourchettes ne se chevauchent pas ; résultat à regarder sur la prévisualisation après l'import, voir « Relecture du lot C-D »). Seules les protéines sont comparables : fibres, sel, AGS, sucres, fer… ne sont connus que pour 83 à 87 % de la masse (un ingrédient sans valeur Ciqual pour ces constituants, a priori le vin rouge, 250 g sur 1 620 g) et la règle des 95 % les écarte. C'est le résultat strict de la méthode (et celui de la maquette) ; à rediscuter avec la personne diététicienne (ex. seuil de couverture, ou valeurs « traces » de Ciqual). Même effet attendu sur d'autres paires.
- [x] **Coût climat : 2025 seulement** (→ **validé par Matt le 2026-11-01** ; 2030 et 2050 retirés de DESIGN.md) dans l'onglet Économie, alors que DESIGN.md § 4 cite 2025 / 2030 / 2050. La règle S14 (une seule année de référence partout) a été gardée. Alternative : afficher 2030 et 2050 comme projections, sans les compter.
- [ ] **Paire mise en avant sur l'accueil** : bœuf bourguignon (celle des maquettes), choix éditorial. Alternative : paire au hasard ou la plus récente.
- [ ] **Liste des paires de l'accueil** : triée par CO₂e du plat animal (décroissant), barres à la même échelle, version maison.
- [ ] **Onglets** : seul l'onglet actif est rendu dans le HTML (les autres sont vides tant qu'on ne les ouvre pas). `?onglet=` est lu dans le navigateur : la page reste statique, l'URL partagée ouvre le bon onglet après chargement (bref affichage de la vue d'ensemble).
- [ ] **`/aliment/[code]`** : pas de score ni de vainqueur (comparaison simplifiée, sans recette : santé et économie non calculables). Mêmes tableaux et encadrés que `/compare`.
- [ ] **« Télécharger les données »** : `/compare/<plat>/donnees` renvoie un JSON (valeurs par portion, sources, licences, mention ODbL pour les prix Open Prices). Vérifier que ce format convient.
- [ ] **Accessibilité** : axe (WCAG 2.1 AA) sans erreur sur toutes les pages et tous les onglets en 375 et 1 280 px (`npm run test:e2e`, serveur lancé) ; navigation clavier des onglets testée.

## Lot D — S21 Finitions techniques et légales

- [ ] **Mentions légales et confidentialité** (→ **complétées le 2026-11-01** ; directeur de la publication = VeganFlemme ; adresse : régime des éditeurs non professionnels, article 1-1, II de la LCEN, en vigueur depuis le 23 mai 2024 : nom, adresse et contact de l'hébergeur affichés. **Condition à confirmer par Matt** : avoir communiqué ses éléments d'identification à Vercel (compte) ; avec les informations de Matt : éditeur VeganFlemme, contact veganflemme@gmail.com, signalements conservés 12 mois ; le responsable du traitement est l'éditeur. plus rien n'est « [à compléter par Matt] ») : à compléter par Matt (`app/mentions-legales/page.tsx`, `app/confidentialite/page.tsx`, marqués « [à compléter par Matt] ») : éditeur, adresse, contact, directeur de la publication, responsable du traitement et adresse pour exercer les droits, durée de conservation des signalements.
- [ ] **Hébergeurs** : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723 (page « Privacy Policy » de Vercel, mise à jour le 1er juin 2026) ; Supabase Pte. Ltd., contact privacy@supabase.com (page « Privacy » de Supabase, aucune adresse postale publiée), serveurs à Francfort. À relire.
- [ ] **Confidentialité** : le formulaire de signalement n'enregistre que la page, le message et la date (`error_reports`, `created_by` reste vide sans compte). Les hébergeurs « peuvent » garder des journaux techniques : formulation prudente, à confirmer.
- [ ] **Bandeau cookies : aucun.** Vérifié sur le build de production : aucun en-tête `Set-Cookie`, aucun cookie après navigation (accueil, comparaison, recette, aliment), aucune requête vers un autre domaine (police servie par le site).
- [ ] **Lighthouse mobile** (build de production local, Lighthouse 12) : accueil 94, `/compare/boeuf-bourguignon` 97, `/aliment/6255` 96, `/recette` 99 (après correction d'un décalage de mise en page), `/methodologie` 98 ; accessibilité, bonnes pratiques et SEO à 100 partout. À refaire sur la prévisualisation Vercel (réseau réel).
- [ ] **axe** : 0 erreur WCAG 2.1 AA sur 15 pages et onglets × 2 largeurs, navigation clavier des onglets (`npm run test:e2e`, 31 tests). Pas encore lancé en CI (il faut un serveur et la clé publique).
- [ ] **Référencement** : `sitemap.xml` (pages fixes + 40 paires), `robots.txt` (exclut `/api/`, `/etat`, `/introuvable`), titres et descriptions, `canonical`, données structurées (`WebSite` sur l'accueil, `WebPage` + sources `Dataset` sur `/compare`), images de partage. Les 3 684 pages `/aliment` ne sont pas dans le plan du site (comparaisons simplifiées) : à décider.
- [ ] **Base Supabase** : 97 Mo, soit 19 % des 500 Mo du plan Free (sous le seuil d'alerte de 60 %). Plus grosses tables : `food_nutrients` 35 Mo, `food_impact_ingredients` 32 Mo, `food_impacts` 13 Mo.
- [x] **Captures** (42 JPEG) : relues par Matt et retirées du dépôt (2026-11-01) ; elles restent consultables par les liens de la PR #15 et se régénèrent avec `npm run captures`.

## Relecture du lot C-D (décisions de Matt, 2026-11-01 : `CORRECTIONS_LOT_CD.md`, `RELECTURE_RECETTES.md`)

**À faire par un humain avant de fusionner** (non exécuté : l'écriture dans la base Supabase de production a été refusée par les permissions de l'environnement de travail) :
- [x] (→ **fait le 2026-11-01**, suite V1 étape 0) `supabase db push` : migration `20261103000000_review_lot_cd.sql` (vue `dish_nutrients` avec fourchettes « < x », colonne `ingredient_substitutions.ratio_basis`). **Avant** de fusionner : sans elle, `/api/recette/donnees` échoue (colonne `ratio_basis` absente).
- [x] (→ **fait le 2026-11-01** : résumé de `pairs.py` identique ligne à ligne au tableau calculé hors ligne, 116 plats) `.venv/bin/python pipeline/pairs.py` puis `.venv/bin/python pipeline/substitutions.py` : import des recettes revues ; les versions retirées sont dépubliées (paire et plat, jamais supprimés). Comparer le résumé imprimé avec le tableau « Chiffres clés » ci-dessus (calculé hors ligne).
- [x] (→ **passés le 2026-11-01**, avec un test SQL de plus pour les fourchettes « < x » et un pour la purge des signalements) `npm run test:db` et `npm run test:db:scoring` sur la base liée, puis regarder `/compare/boeuf-bourguignon` (onglet Nutrition) sur la prévisualisation.

Couverture des nutriments :
- [ ] **« traces »** : la documentation officielle de Ciqual 2025 (`ciqual_2025_doc_FR.pdf`, p. 10, § 3.2.3 « Traces » et § 3.2.4) définit les traces (constituant détecté sans pouvoir être quantifié, ou estimé très faible sans pouvoir être considéré nul ; valeurs < 0,00001 remplacées par « traces ») mais **ne dit rien des calculs de recettes**. Consigne appliquée : « traces » reste une donnée manquante. ciqual.anses.fr était toujours en maintenance (503) le 2026-11-01 : vérifier s'il existe une recommandation en ligne. Alternative : fourchette [0 ; 0,00001] pour les seules traces d'arrondi (impossible à distinguer des traces analytiques dans le fichier).
- [ ] **« < x »** : intervalle [0 ; x] (« une valeur maximale », documentation Ciqual 2025, p. 21). Exemple : 250 g de vin rouge à « < 2 » g de sel pour 100 g ajoutent jusqu'à 5 g de sel à la recette (borne haute) ; comme le vin est identique des deux côtés, il ne pèse pas dans le verdict. Une valeur seulement connue en fourchette n'a pas de valeur centrale : l'écart en % n'est pas calculé pour elle.
- [ ] **Ingrédients identiques** : mis de côté pour le verdict **par portion seulement** ; pour 100 kcal et pour 10 g de protéines, leur contribution ne s'annule plus (dénominateurs différents) : ils restent comptés. Alternative : les mettre de côté aussi sur ces bases (inexact).
- [ ] **Fourchettes et verdicts** : la règle « pas de point si les fourchettes se chevauchent » vaut pour tous les indicateurs, y compris les facteurs animaux (fourchettes FAOSTAT min-max 2020-2024) et le prix (min-max des relevés).

Affichage :
- [ ] **Arrondis** : kg CO₂e avec 2 décimales partout, y compris le total du simulateur (« 208,00 kg ») ; une valeur non nulle plus petite que 0,005 s'écrit « < 0,01 » (ex. sous-parties du CO₂e). Euros : 2 décimales (le simulateur affichait des euros entiers). Autres unités : 3 chiffres significatifs. Le facteur par kg de la page Méthodologie passe de 4 à 3 chiffres significatifs.
- [ ] **Animaux épargnés** (simulateur) : « au moins 0,03 animal épargné » ; arrondi vers le bas à 2 chiffres significatifs (estimation basse), pluriel à partir de 2. Le tableau par portion garde 3 chiffres significatifs.
- [ ] **Carte Santé** : nom de l'aliment Ciqual jusqu'à la première virgule, en minuscules (« lardon fumé », « bœuf »). Alternative : un nom court relu à la main par aliment.
- [ ] **Sources** : licence affichée seulement quand elle est connue ; l'usage commercial seulement quand il est renseigné (`commercial_use` non nul). Les sources « à vérifier » restent suivies ici et dans `public.sources`.
- [x] **Signalements** (→ **fait le 2026-11-01** : fonction `purge_old_error_reports()` et tâche pg_cron quotidienne `purge-error-reports`, migration `20261103010000`, expliqué sur `/confidentialite`) : la durée de 12 mois est annoncée, mais aucune suppression automatique n'existait.

Recettes (règles appliquées à **toutes** les paires, y compris les 10 premières, contrôlées par `pairs.py` et `npm run test:pipeline`) :
- [x] **« Source de protéines »** (→ **acceptée par Matt le 2026-11-01**) (colonne `protein_source` de `pairs.csv`) : viande, charcuterie, poisson, fruits de mer, œufs mangés comme tels, fromage quand il est un élément principal (croque, pizza, tartiflette, burger, cordon bleu), et leurs remplaçants végétaux. **Pas** : un œuf de liaison ou de panure, un fromage râpé de garniture (parmesan, emmental gratiné), une matière grasse. Le plafond (+20 %) se compare aux sources de protéines du plat animal et aux ingrédients qu'elles remplacent (colonne `replaces`), ce qui compte la panure d'un produit pané prêt à l'emploi (nuggets, bâtonnets). Ces choix reproduisent les exemples de la relecture (César : 450 g de poulet + œufs ; cordon bleu : +17 %). Relire.
- [x] **Huiles de cuisson** (→ **acceptées par Matt le 2026-11-01**) liées à une protéine végétale alors que le plat animal n'en a pas (steak-frites maison, carbonara maison et commerce, burger maison, couscous maison) : gardées comme partie du remplacement (colonne `replaces` = la viande). Alternative stricte : les retirer (règle « pas d'ajout »).
- [ ] **Retirés comme ajouts hors recette** : pois chiches (gratin, pizza), haricots blancs (tartiflette), tofu fumé (risotto maison), saucisse végétale (risotto commerce), lentilles en plus du haché végétal (lasagnes et parmentier du commerce), sauce soja (poulet rôti, saumon, rôti de porc maison), paprika (paëlla maison), râpé végétal (quiche du commerce, plat d'origine sans fromage).
- [ ] **Ingrédients végétaux remis à l'identique** (règle 5) : huile de tournesol du bourguignon, huile d'olive du saumon-riz, des tomates farcies, de la saucisse-lentilles et du rôti de porc, haricots rouges du chili, pois chiches du couscous (150 g gardés, 200 g ajoutés à la place des merguez), eau de la blanquette, farine et lait/boisson de la béchamel du croque, compote des crêpes du commerce.
- [ ] **Versions du commerce supprimées** (pas de produit prêt à l'emploi adapté dans Ciqual/Agribalyse : aucun tofu brouillé ni substitut d'œuf) : omelette (tofu ferme, ingrédient de base : règle 4 appliquée aussi à cette paire non citée dans la relecture), tortilla, œufs brouillés. Ces trois paires n'ont plus qu'une version maison.
- [ ] **Cabillaud du commerce** : les bâtonnets panés sont remplacés par le pavé de soja 20914 (non pané, déjà utilisé pour le saumon) ; nouvelle version `pave-soja-pommes-vapeur-commerce`.
- [ ] **Risotto maison** : seul le beurre est remplacé (huile d'olive) ; le parmesan n'a pas de remplaçant « fait maison » parmi les aliments purs disponibles. Alternative : levure maltée, absente de Ciqual/Agribalyse avec impacts.
- [x] **Crêpes du commerce** (→ **décision de Matt, 2026-11-01 : supprimée**, dépubliée par `pairs.py`) : après le retour à la compote, elles ne diffèrent de la version maison que par la boisson au soja aromatisée. Selon la règle 4, ce n'est pas vraiment une version « du commerce » : la supprimer ?
- [x] **Pizza et croque maison** (→ **acceptés par Matt le 2026-11-01**) : le tofu fumé remplace aussi le fromage (250 g et 310 g pour 4) pour garder une portion d'au moins 300 g. Alternative : accepter une portion plus petite.
- [ ] **Blanquette maison et du commerce** : crème → crème de soja (150 g), eau de cuisson gardée, jaunes d'œufs non remplacés (avant : 300 g de boisson au soja pour crème, jaunes et eau).
- [ ] **Objectif de 70 % des protéines** non atteint pour 19 versions végétales (la suite V1, étape 1, revoit les recettes avec des protéines plus denses) (de 46 % pour la blanquette maison à un peu moins de 70 % pour les boulettes maison) : l'écart apparaît dans « Là où le plat animal fait mieux » et dans le score Nutrition.
- [ ] **Substitutions** : le ratio est calculé dans le navigateur (`lib/compare/recipe.ts`) avec les lipides Ciqual de l'aliment réellement saisi (beurre doux, demi-sel…) et le rendement USDA du produit cru ; une seule correspondance de rendement existe aujourd'hui (steak haché 15 % cru, 73 %). Pour les autres viandes crues : même masse, écrit dans la justification.


## S22 — Protéines denses et vue « à protéines égales »

- [ ] **PST partout** : la plupart des versions maison reposent maintenant sur les protéines de soja texturées réhydratées (code unique 20591_2, sans distinction haché ou gros morceaux). Les recettes deviennent plus uniformes ; le tempeh n'est plus utilisé. Alternative : alterner PST et tempeh selon le plat.
- [ ] **Objectif de 70 % non atteint** pour 7 versions : blanquette maison (64 %, au plafond), lasagnes et parmentier du commerce (haché végétal 30181 à 11,5 g/100 g, au plafond), tartiflette du commerce (69 %), risotto maison et du commerce (plat sans viande), pot-au-feu maison (69 %, au plafond).
- [ ] **Vue « à protéines égales »** : le prix suit le facteur (linéaire) ; la couverture ne change pas. Les fourchettes « < x » sont multipliées aussi. Sur `/recette`, la vue est gardée dans l'URL mais pas l'onglet.
- [ ] **Sources ANSES citées** sur `/methodologie` : page « Protéines » (mise à jour le 22/12/2025, 0,83 g/kg/j ; « les apports énergétiques et protéiques atteignent les références nutritionnelles ») ; rapport « Actualisation des repères du PNNS », 2016, p. 22 du PDF (AS de 30 g de fibres par jour) ; dossier de presse INCA 3, 2017, p. 11 du PDF (20 g/j de fibres chez les adultes). Numéros de page du PDF, pas de la pagination imprimée.
- [ ] **Encadrés par catégorie** : les avantages santé et économie (CIRC, prix, coût climat) viennent des scores, sans conseil sourcé pour l'instant (« Pas encore de conseil sourcé pour ce point »).

## S23 — Données manquantes complétées

- [ ] **Fromage** : jours de vie par kg = jours par kg de lait (FAOSTAT) × 100 / 13 (FAO TCF, France, 1992-1996, p. 545 imprimée) = 0,357 jour par kg ; 135 fromages au lait de vache. Tout le lait attribué au fromage (lactosérum non compté). Données anciennes (1992-1996). Beurre et crème : non appliqués (4,6 % et 12 %), coproduits. Alternative : allocation par la matière grasse (non sourcée).
- [ ] **Œufs** : jours de vie = 365 / (257 œufs × 60 g) = 23,7 jours par kg ; douleur par kg = douleur par poule ÷ 18 kg (300 œufs par cycle, fiche du ministère p. 1, × 60 g). Vérification : omelette (150 g d'œufs par portion) = 3,55 jours et 17,3 h de douleur gênante par portion. Les deux méthodes (an de ponte FAOSTAT et cycle du ministère) donnent des ordres de grandeur proches (23,7 et 21,9 jours par kg). Fiche du ministère : licence non lue (`commercial_use` à vérifier). Fourchette UE (règlement 589/2008) non appliquée : EUR-Lex bloque l'environnement de travail.
- [ ] **Poissons** : saumon d'élevage 0,185 poisson par kg (0,157-0,212), cabillaud 0,75 (0,25-1,25), lieu noir 0,338 (0,222-0,455) ; valeur centrale = milieu des bornes (comme les estimations médianes de l'article). Cabillaud et lieu noir limités à leurs aliments (`scope` = espèce, nouvelle colonne). Poids du poisson entier appliqué au filet cuit : estimation basse. Crevettes : donnée manquante (Mood et al. ne couvrent que les poissons à nageoires).
- [ ] **Prix INSEE** : priorité 2 (après RNM, avant Open Prices, passé en 3). Le citron applique le prix du fruit entier à la chair (comme avant).
- [ ] **Masses volumiques FAO/INFOODS** : densités relatives (specific gravity) prises comme g/ml ; huile de tournesol 0,96 g/ml telle que publiée (source « RC »), plus élevée que les autres huiles (0,92) : à confirmer. Résultats : colza 2,34 €/kg, olive 14,85 €/kg, tournesol 2,22 €/kg, vin rouge 8,78 €/kg, sauce soja 16,47 €/kg (Open Prices).
- [ ] **Rendements de cuisson (pâtes, riz, légumineuses, pommes de terre)** : candidat Bognár (2002), *Tables on weight yield of food and retention factors*, BFE Karlsruhe (ISSN 0933-5463, publikationen.bibliothek.kit.edu) : pâtes sans œuf ×2,10 (p. 39), riz rond poli ×3,19 (p. 38), lentilles ×2,73 (p. 31), pommes de terre à l'eau avec peau ×0,98 (p. 32). Licence non indiquée et la table `cooking_yields` limite les rendements à 200 % : non appliqué. **Méthode proposée (non appliquée)** par bilan de matière sèche : rendement = (100 − eau du cru) / (100 − eau du cuit), avec les teneurs en eau Ciqual du code cru et du code cuit (ex. pâtes sèches et pâtes cuites) ; hypothèse : aucune perte de matière sèche à la cuisson. À valider.
- [ ] **Âges d'abattage** : rien de nouveau de citable ; la fiche du ministère dit « vers l'âge de 35 jours » pour le poulet standard, contre 38 jours retenus (label rouge, colonne « produit courant ») : garder 38 ?
- [ ] **Animaux par portion** « pour 1 000 portions » quand la valeur est inférieure à 1 (onglet Protection animale).
- [ ] **EAT-Lancet 2025** : le rapport annoncé par Matt n'est pas dans `~/Downloads` (seuls les articles de Mood et al. y sont) : à déposer dans `pipeline/raw/eat-lancet/`.

## S24 — Version végétale complétée

- [ ] **Liste blanche** (`data/complements.json`) et **quantités maximales par portion** (lin 10 g, noix 15 g, sésame 10 g, amandes 20 g, boisson au soja enrichie 250 g, sel iodé 1 g) : choix éditoriaux à valider par un·e diététicien·ne. Pas d'aliment enrichi en B12 dans Ciqual avec impacts Agribalyse (seule une boisson énergisante) : B12 et EPA + DHA restent des conseils.
- [ ] **Limites de sécurité** (ANSES, page du 21/02/2025) : calcium 2 500 mg/j, fer 40 mg/j (valeur d'apport sans risque EFSA 2024), zinc 25 mg/j (tableau peu lisible sur la page, à vérifier), iode 600 µg/j, vitamine D 100 µg/j ; appliquées au total d'une portion.
- [ ] **« Les besoins se couvrent sur la journée »** : la page ANSES ne le dit pas en ces termes ; nous citons que les références sont des apports par jour et que la LSS est « l'apport journalier chronique maximal ». L'avis ANSES 2019 sur les végétariens ne contient pas non plus de phrase « pas plat par plat ». Formulation à valider.
- [ ] **Sel iodé** : il comble l'iode mais augmente le sel (compté) ; alternative : le retirer de la liste.
- [ ] **Exemple** (bœuf bourguignon, version maison) : 10 g de lin, 15 g de noix et 10 g de sésame par portion comblent protéines, fer et ALA ; le zinc reste non comblé. Côté plat animal, le lin comble l'écart de fibres.

## S24d — Affichage sur ordinateur, version complétée, pages d'aliments

- [ ] **Chiffre de 1,4 g/kg/j** : absent de la page ANSES « Protéines » (mise à jour le 22/12/2025, qui dit seulement que « les apports énergétiques et protéiques atteignent les références nutritionnelles ») ; cité d'après le rapport AFSSA « Apport en protéines : consommation, qualité, besoins et recommandations », 2007, p. 111 du PDF, note 13 (étude INCA 1, 1998-1999 : donnée ancienne).
- [ ] **Version complétée** : seule la protéine principale est augmentée (règle : plus forte contribution en protéines parmi les ingrédients différents du plat animal) ; ex. bourguignon maison, protéines de soja texturées. Si cette protéine est un produit pané ou un plat composé, l'augmentation porte aussi sur sa panure. Alternative : augmenter toute la recette (ancienne vue « à protéines égales »).
- [ ] **Nutrition « écarts comblés par construction »** : catégorie retirée du total du verdict dans la version complétée (« 3 sur 4 » au lieu de « 3 sur 5 »). Alternative : la garder affichée comme égalité.
- [ ] **Pages d'aliments** : portion de 100 g (INCA 3 non utilisé, licence non spécifiée) ; les aliments sans alternative gardent un affichage simple (nutrition et environnement pour 100 g).
- [ ] **`/recette`** : saisie à gauche et remplacements à droite ; la comparaison complète reste en pleine largeur dessous (le tableau de bord se règle sur la largeur de la fenêtre, pas d'une colonne). Alternative : requêtes de conteneur.
- [ ] **Coche verte** retirée de la mention en tête de page (elle suggérait une vérification).
- [ ] **Score Protection animale (décision de Matt, 17 h 40)** : version végétale sans ingrédient animal identifié = catégorie gagnée sans « provisoire », même si toutes les valeurs du plat animal manquent (la règle s'applique aussi quand aucun indicateur n'est comparable). Condition testée sur les données : tous les ingrédients de la version végétale ont `is_animal = false` (un ingrédient absent de `foods` empêche la règle) et le plat animal a au moins un ingrédient animal.
- [ ] **« provisoire »** : désormais seulement si les indicateurs non comptés pourraient inverser le vainqueur (toutes les issues essayées). Une égalité est donc provisoire dès qu'un indicateur manque.
- [ ] **Relecture du sous-agent designer, points non appliqués** : conteneur de 1 440 px gardé (spécification de Matt ; le designer proposait environ 1 760 px à 1 920 px) ; score « x sur 5 » affiché à plusieurs endroits (en-tête, colonne de gauche, vue d'ensemble, exigé par la spécification) ; version complétée notée « x sur 4 » (Nutrition hors total), le designer suggérait de garder « /5 ».
- [ ] **Seconde passe du sous-agent designer, corrigé** : tableau des facteurs de `/methodologie` (adresses longues coupées), Nutrition en pleine largeur dès 1 280 px (encadrés dessous), « par semaine » / « par jour » sans césure (PNNS, EAT-Lancet), recettes alignées en grille (nom long aligné sur lui-même), « pour 1 000 portions » sous la valeur, noms de sources lisibles, barre d'écart alignée sur le pourcentage, titre « Au moins 1 animal tué… » plus petit avec « (estimation basse) » en sous-texte, sommaire de `/sources` en fondu, marge haute et carte fixe sur `/recette`, bas des pages `/compare` aligné sur la colonne de contenu, pastille du vainqueur sur la 1re ligne, titres de l'accueil sur une ligne. Test e2e ajouté : aucun tableau caché dans une boîte à défilement horizontal dès 1 280 px.
- [ ] **Seconde passe, non corrigé (mineur)** : mini-barres et « DQR » de l'onglet Environnement légèrement décalés de la ligne de base ; barre « Coût climat » de l'Économie ; cartes Santé et Économie de la vue d'ensemble plus hautes que leur contenu ; « Environ-nement » coupé dans le bandeau verdict à 375 px ; sur téléphone, les boutons « Alternative » et « Version » occupent 4 lignes (la mise en page téléphone reste volontairement inchangée).

## S24b — Recettes issues des plats officiels (étape 3 bis)

- [ ] **Recettes officielles, source** : les masses des recettes Agribalyse ne sont pas dans les jeux 3.2 de l'ADEME (annexe 9 du rapport méthodologique 3.2 : « The detail of the recipes is available only in LCA softwares »), mais la base **3.0 complète** est rediffusée sur data.gouv.fr (jeu « Agribalyse », Licence Ouverte 2.0, export openLCA du 20 juin 2020, producteur : compte supprimé, rediffusion communautaire ; piste trouvée par la relectrice). Table `TBL_EXCHANGES` : masse de chaque intrant par kg de plat « at plant ». Exemple de la page vérifié : aïoli = 728 g d'huile d'olive, 108 g d'ail (plus 78,3 g de jus de citron et 82,9 g de jaune d'œuf). Source `agribalyse-3.0-openlca` ajoutée.
- [ ] **Correspondance des intrants** (`pipeline/agribalyse_recipe_ingredients.csv`, 140 intrants, relue par Claude, à relire) : nom 3.2 de l'ingrédient et code Ciqual. Hypothèses : bœuf haché 15 % MG, porc = épaule crue, porc maigre = filet mignon, agneau = épaule, veau = rôti, bœuf sans os = bœuf à bourguignon, légumineuses en masse sèche (le rapport 3.2, § 3.3.2, convertit les ingrédients cuits en cru), tomate pelée = tomate chair appertisée, « Pepper, green » = poivron vert (nommé « Poivre » dans le détail 3.2). Sans code (jamais deviné) : champignon de Paris (pas d'impact, règle 11), fromage frais crémeux, olives, bouillon, sauces composées, mayonnaise, omelette (règle 9), abats, riz paddy, maïs grain, fécule, moules et langoustines avec coquille, fruits de mer, frites crues, pain à hamburger, choucroute, cornichon, croûtons, « poisson cuit moyen ».
- [ ] **Contrôles** (`pipeline/agribalyse_recipes.py`, rapport `pipeline/reports/agribalyse_recipes_check.csv`) sur les 285 plats composés : 93 sans recette 3.0 du même nom (plats ajoutés ou renommés après la 3.0), 21 avec une liste d'ingrédients différente du détail 3.2, 69 avec moins de 95 % de la masse couverte par un code : **102 retenus**, importés dans `official_recipes`.
- [ ] **Impact recalculé** (somme des kg × impact 3.2 par kg de chaque ingrédient, comme le fait le site) / impact 3.2 publié du plat, changement climatique : Hachis Parmentier 0,98, Pot-au-feu 0,96, Lasagnes bolognaise 0,84 ; médiane des 102 plats 0,81 (0,10 à 1,22). L'écart vient des étapes du plat lui-même (cuisson à l'usine, emballage, transport, stockage : « Autres étapes » du détail 3.2 ; corrélation 0,63) ; rapporté à la seule somme des ingrédients du détail 3.2, le recalcul donne une médiane de 1,13 (chaque ingrédient acheté seul porte aussi son emballage et son transport). Extrêmes à regarder : cassoulet appertisé 0,19, tofu nature 0,10 (plat sans ingrédient animal, non utilisé), fougasse 0,47.
- [ ] **Conséquence pour les comparaisons** : un plat recalculé à partir de sa recette est sous-estimé d'environ 19 % (médiane) par rapport au plat Agribalyse. Les deux côtés d'une comparaison doivent être calculés de la même façon (recette contre recette), jamais un plat officiel contre une recette recalculée.
- [ ] **Points 3 et 5 appliqués à l'étape 3 ter** : la version végétale suit la règle de remplacement unique de la décision de 17 h 25 et le choix de la protéine par le visiteur, que l'étape 3 ter construit (`lib/scoring/substitute.ts`). Remplacer maintenant les recettes animales des paires casserait les contrôles de `pairs.py` (seul ce qui est animal est remplacé) jusqu'à ce moteur. Paires concernées (recette officielle retenue) : hachis parmentier (25009), lasagnes bolognaise (25081), pot-au-feu (25013), pâtes carbonara (25135), croque-monsieur (25400), endives au jambon (25073), sandwich jambon-beurre (25517), pizza jambon-fromage (25435), galette complète (25562), poulet curry coco (25174) ; non retenues : bœuf bourguignon (champignon sans code), et les autres paires sans plat Agribalyse équivalent.
- [ ] **Calcul inverse** (point 2) : testé avant que la source ci-dessus soit connue, sur la seule recette publiée trouvée (« Pain soufflé à texture de céréales », 7353, tableau 13 du rapport) : proportions retrouvées à 6 % près, masses deux fois trop faibles (pertes du champ à l'usine incluses dans les inventaires, 20 à 60 % selon le rapport CTCPA pour Agribalyse 3.1, doi:10.57745/ZRJUYN). Plus nécessaire.
- [ ] **Les 23 « plats végétariens »** d'Agribalyse sont des substituts (galettes, nuggets, haché, boulettes ; 8 contiennent blanc d'œuf, fromage ou mayonnaise), pas des plats entiers : candidats au choix de la protéine (étape 3 ter), pas des alternatives entières.
- [ ] **Œufs, erreur signalée par l'ADEME** (notice du tableur Agribalyse 3.2, 21/08/2025) : impacts des œufs et de tous les produits qui en contiennent « sous-évalués », mise à jour en cours. Avertissement affiché dans l'onglet Environnement de chaque comparaison dont une recette contient un aliment du sous-groupe Ciqual « oeufs » (13 plats animaux) et section `/methodologie#oeufs-agribalyse`. Les produits du commerce dont le détail Agribalyse contient « Blanc d'oeuf » ne sont pas détectés (aucun dans nos recettes végétales, règle 10). Quinoa FR : impacts sur-évalués selon la même notice ; aucune de nos recettes n'en contient.
- [ ] **Agribalyse « 4 »** : l'ADEME publie sur data.ademe.fr trois jeux nommés « AGRIBALYSE 4 » (synthèse, étapes, ingrédients), dont la description dit encore « v3.2 ». Version non changée (règle 8) : à vérifier avant tout import.

## S24c — Choix de la protéine par le visiteur

- [ ] **Protéine par défaut = la plus proche en protéines**, sans distinction de forme : pour le bœuf bourguignon, « fines tranches végétales » (29,7 g/100 g contre 34 g pour le bœuf cuit) passe avant le seitan. La règle « même rôle dans le repas d'abord » est satisfaite par construction (toutes les candidates sont des sources de protéines), mais les données ne distinguent pas un morceau à mijoter d'une tranche. Alternatives : un rôle par sous-groupe Ciqual (substitut de viande, charcuterie végétale, légumineuse…) appairé au sous-groupe de l'ingrédient animal, ou exclure les « tranches » des plats mijotés.
- [ ] **Seuils** : candidate = « riche en protéines » (≥ 20 % de l'énergie), ingrédient principal = « source de protéines » (≥ 12 %), d'après l'annexe du règlement (CE) n° 1924/2006 (`data/protein_choice.json`). EUR-Lex n'était pas accessible depuis l'environnement de travail : valeurs à vérifier sur le texte.
- [ ] **35 candidates** (vue `protein_candidates`, contrôle `pipeline/protein_candidates.py` : règles 9, 10, 11 respectées ; familles soja 13, légumineuses 18, blé 3, autres 1). « Haricots blancs à la sauce tomate » et « Fines tranches végétales » en font partie : à garder ?
- [ ] **Recette officielle pour 8 paires** : hachis parmentier, lasagnes bolognaise, croque-monsieur, endives au jambon, sandwich jambon-beurre, pizza jambon-fromage, galette complète, poulet curry coco (accompagnements de notre recette type gardés, `data/official_pairs.json`). Exclues : pâtes carbonara (Agribalyse les modélise avec la recette des lasagnes bolognaise) et pot-au-feu (plat approché par une autre recette, annexe 10). Contrôle ajouté au pipeline : 15 plats approchés exclus (87 retenus), dépubliés dans `official_recipes`.
- [ ] **Correspondance « Chicorée »** des endives au jambon = endive (20026), pas chicorée verte (corrigé).
- [ ] **Pages des plats Agribalyse** : 100 g de plat, recette officielle recalculée des deux côtés (jamais plat officiel contre recette recalculée) ; l'écart avec l'impact publié du plat entier (médiane −19 %) sera affiché à l'étape 4 bis.
- [ ] **Protection animale avec les produits laitiers** : pas de facteur « animaux tués » pour le lait, le beurre et les fromages ; dès qu'ils dépassent 5 % de la masse, l'indicateur n'est pas compté (ex. hachis parmentier officiel : 82 % de la masse couverte).
- [ ] **Ingrédient animal sans règle** : laissé dans la version végétale avec un avertissement visible (jamais retiré en silence). Aucun cas sur nos 40 plats ; à surveiller sur les plats Agribalyse.
- [ ] **Taille des pages** : le navigateur reçoit les données de la page (≈ 0,9 Mo pour un plat, ≈ 1,5 Mo pour un aliment, contre 1,2 Mo avant pour deux versions) et recalcule la comparaison à chaque changement de protéine.
