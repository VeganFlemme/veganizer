# À vérifier par un humain

Points à contrôler avant de considérer une étape comme validée. Cocher quand c'est fait.

## Étape A — CALNUT (sautée)

- [ ] Le site `ciqual.anses.fr` était en maintenance (503) le 2026-11-01 : relancer l'étape A quand il est de retour (téléchargement CALNUT, import `source_id = calnut` là où Ciqual n'a pas de valeur, vue `food_nutrients_best` avec priorité ciqual-2025 > calnut > bls-4.0 > usda-fdc).
- [ ] Vérifier la licence et la version exacte de CALNUT au moment du téléchargement (la ligne `sources.calnut` n'a pas de version).

## Étape B — 10 paires de plats

Chiffres par portion (4 portions par recette), relus dans les vues `dish_nutrients` et `dish_impacts` après import. Pourcentage entre parenthèses : protéines de l'alternative rapportées au plat animal ; « −x % » : écart de CO2e.

| Paire | Plat | g/portion | Protéines g | kcal | kg CO2e (fourchette) | DQR max | Couverture | Critères |
|---|---|---|---|---|---|---|---|---|
| boeuf-bourguignon | Bœuf bourguignon (animal) | 405 | 48.6 | 483 | 5.03 (5.03–5.03) | 2.87 | 1.00 | OK |
| boeuf-bourguignon | Bourguignon de tempeh et lentilles (maison) | 498 | 35.4 (73%) | 553 | 0.65 (0.65–0.65), −87 % | 3.01 | 1.00 | OK |
| boeuf-bourguignon | Bourguignon de seitan (commerce) | 422 | 36.6 (75%) | 430 | 0.57 (0.57–0.57), −89 % | 2.87 | 1.00 | OK |
| blanquette-de-veau | Blanquette de veau (animal) | 425 | 48.2 | 652 | 3.07 (3.07–3.07) | 3.73 | 1.00 | OK |
| blanquette-de-veau | Blanquette de tofu et pois chiches (maison) | 490 | 34.2 (71%) | 626 | 0.47 (0.47–0.47), −85 % | 3.73 | 1.00 | OK |
| blanquette-de-veau | Blanquette de seitan (commerce) | 415 | 35.6 (74%) | 493 | 0.48 (0.48–0.48), −84 % | 3.73 | 1.00 | OK |
| poulet-roti-haricots-verts | Poulet rôti et haricots verts (animal) | 355 | 47.4 | 402 | 1.20 (1.20–1.20) | 2.31 | 1.00 | OK |
| poulet-roti-haricots-verts | Tofu et tempeh rôtis et haricots verts (maison) | 415 | 34.1 (72%) | 433 | 0.60 (0.60–0.60), −50 % | 2.78 | 1.00 | OK |
| poulet-roti-haricots-verts | Seitan rôti et haricots verts (commerce) | 358 | 34.9 (74%) | 327 | 0.53 (0.53–0.53), −56 % | 2.23 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes à la bolognaise (animal) | 429 | 40.1 | 663 | 5.01 (5.01–5.01) | 3.12 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes aux lentilles et tofu (maison) | 470 | 29.3 (73%) | 565 | 0.36 (0.36–0.36), −93 % | 3.12 | 1.00 | OK |
| lasagnes-bolognaise | Lasagnes au haché végétal (commerce) | 490 | 29.2 (73%) | 616 | 0.53 (0.53–0.53), −89 % | 3.12 | 1.00 | OK |
| quiche-lorraine | Quiche lorraine et salade verte (animal) | 336 | 20.6 | 776 | 1.00 (1.00–1.00) | 2.92 | 1.00 | OK |
| quiche-lorraine | Quiche au tofu fumé et salade verte (maison) | 334 | 25.1 (122%) | 642 | 0.37 (0.37–0.37), −63 % | 3.48 | 1.00 | OK |
| quiche-lorraine | Quiche au tofu fumé (pâte du commerce) et salade verte (commerce) | 341 | 24.1 (117%) | 682 | 0.57 (0.57–0.57), −43 % | 3.48 | 1.00 | OK |
| hachis-parmentier | Hachis parmentier (animal) | 419 | 32.4 | 569 | 4.79 (4.79–4.79) | 2.9 | 1.00 | OK |
| hachis-parmentier | Parmentier de lentilles (maison) | 482 | 23.8 (73%) | 499 | 0.43 (0.43–0.43), −91 % | 3.01 | 1.00 | OK |
| hachis-parmentier | Parmentier au haché végétal (commerce) | 479 | 23.2 (72%) | 533 | 0.60 (0.60–0.60), −87 % | 3.01 | 1.00 | OK |
| saumon-riz | Saumon et riz (animal) | 319 | 33.3 | 583 | 1.08 (1.08–1.08) | 3.73 | 1.00 | OK |
| saumon-riz | Tofu mariné et riz (maison) | 355 | 26.5 (80%) | 551 | 0.39 (0.39–0.39), −64 % | 3.73 | 1.00 | OK |
| saumon-riz | Pavé de soja et riz (commerce) | 319 | 25.1 (75%) | 630 | 0.50 (0.50–0.50), −54 % | 3.73 | 1.00 | OK |
| omelette | Omelette et pommes de terre rôties (animal) | 368 | 23.7 | 483 | 0.52 (0.52–0.52) | 2.92 | 1.00 | OK |
| omelette | Omelette à la farine de pois chiche et pommes de terre rôties (maison) | 368 | 17.9 (76%) | 495 | 0.26 (0.26–0.26), −49 % | 3.91 | 1.00 | OK |
| omelette | Tofu brouillé et pommes de terre rôties (commerce) | 372 | 24.9 (105%) | 502 | 0.36 (0.36–0.36), −31 % | 2.92 | 1.00 | OK |
| burger | Burger et frites (animal) | 395 | 41.3 | 892 | 4.93 (4.93–4.93) | 2.9 | 1.00 | OK |
| burger | Burger aux haricots rouges et tofu et frites (maison) | 418 | 29.3 (71%) | 856 | 0.41 (0.41–0.41), −92 % | 3.93 | 1.00 | OK |
| burger | Burger à la galette végétale et frites (commerce) | 405 | 30.4 (74%) | 864 | 0.56 (0.56–0.56), −89 % | 2.9 | 1.00 | OK |
| croque-monsieur | Croque-monsieur et salade verte (animal) | 302 | 27.8 | 560 | 0.83 (0.83–0.83) | 2.97 | 1.00 | OK |
| croque-monsieur | Croque au tofu fumé et salade verte (maison) | 315 | 20.5 (74%) | 524 | 0.34 (0.34–0.34), −59 % | 2.92 | 1.00 | OK |
| croque-monsieur | Croque aux tranches végétales et salade verte (commerce) | 325 | 25.7 (93%) | 606 | 0.37 (0.37–0.37), −55 % | 2.92 | 1.00 | OK |

Tous les critères sont respectés.

À contrôler :
- [ ] **Recettes** : proportions réalistes pour la cuisine française courante (fichier `pipeline/pairs.csv`, colonne `note`). En particulier : 500 g de bœuf cuit pour 4 (≈ 750 g cru) ; 450 g de veau cuit pour 4 ; tempeh 550 g pour 4 dans le bourguignon (portion végétale de 498 g, proche de la limite de 500 g) ; 12 œufs pour 4 dans l'omelette.
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

- [ ] **Table de substitutions** (`pipeline/substitutions.csv`) : relire chaque remplacement et sa justification (viande hachée → lentilles vertes cuites, viande → seitan, poisson et œuf → tofu ferme, charcuterie → tofu fumé, lait → boisson soja enrichie, crème → crème de soja, beurre → huile de colza, fromage → spécialités végétales, yaourt → dessert au soja nature). Ratio 1 (même masse) partout : à ajuster ? *En cours de relecture par Matt (2026-11-01) : ne bloque pas les lots C et D.*
- [ ] **Vérification faite** : bolognaise de test (400 g de bœuf haché 15 % cuit, 100 g de lardons fumés cuits, 350 g de pâtes cuites, 350 g de coulis, 4 portions) : 4,908 kg CO₂e et 34,4 g de protéines par portion ; version végétale 0,261 kg CO₂e et 21,0 g de protéines. Identique au calcul à la main.
- [x] **Connexion par e-mail** : à tester en production. Il faut que `https://veganizer.vercel.app/recette` soit dans les « Redirect URLs » de Supabase Auth (tableau de bord, non vérifiable d'ici) et que l'envoi d'e-mails soit configuré (le service par défaut de Supabase est très limité en volume). **Décision de Matt (2026-11-01) : pas de compte en V1**, enregistrement masqué (« bientôt ») ; nom de domaine + SMTP personnalisé dans « Hors V1 ».
- [ ] **Ingrédients sans remplacement** (ex. miel) : gardés et signalés. Faut-il des règles supplémentaires ?


## Lot B — S17 Paires vérifiées en nombre

30 nouvelles paires (40 au total), **toutes à relire** : recettes rédigées par Claude (aucune base de recettes externe utilisée), choisies parmi les plats les plus consommés d'INCA 3 (groupes « plats composés », œufs, sandwichs, pizzas…), pour tous les moments de repas (petit-déjeuner, déjeuner, dîner, goûter). Critères vérifiés automatiquement pour les 90 plats : portion 300-500 g, protéines ≥ 70 % du plat animal, couverture 1,00.

- [ ] **Relire chaque recette** (`pipeline/pairs.csv`, colonne `note`) : réalisme des proportions et des portions. Cas à surveiller : gratin dauphinois végétal avec pois chiches dans la salade (pour atteindre 70 % des protéines) ; tartiflette végétale avec haricots blancs ; steak frites remplacé par 700 g de galettes pour 4 ; pot-au-feu au tempeh (650 g pour 4) ; « cordon bleu » de tempeh ; crêpes du commerce à la boisson au soja aromatisée. *En cours de relecture par Matt (2026-11-01) : ne bloque pas les lots C et D.*
- [ ] **Conventions de codes** reprises des 10 premières paires : carottes, endives, poireaux et chair à saucisse au code cru (cuits dans le plat) ; œufs au code « œuf cru » ; pain grillé (7004) comme chapelure.
- [x] **Règle 9 et produits du commerce** : des produits végétaux transformés classés « plats composés » par Ciqual sont utilisés comme ingrédients des versions « du commerce » (galette blé-soja 25593, nuggets 25227_1, boulettes 25589_1, bâtonnets panés 25229 ; déjà présents : haché végétal 30181, pavé de soja 20914). Interprétation retenue : la règle vise les ingrédients qui rendraient les impacts animaux incalculables (aliments `mixte`, plats contenant des produits animaux) ; un produit végétal transformé est admis. À valider, sinon ces versions doivent être réécrites. **Décision de Matt (2026-11-01) : exception acceptée**, vérification notée dans `pairs.csv` (colonne `rule9_check`) et règle ajoutée à `CLAUDE.md`.
- [ ] **Objectif 100+ non atteint** : 40 paires. Prochaine série (60+) à prévoir, idéalement après relecture de celles-ci.

Chiffres clés par portion (nouvelles paires) :

| Paire | Plat | g/portion | Protéines g | kcal | kg CO2e (fourchette) | DQR max | Couverture | Critères |
| boeuf-bourguignon | Bœuf bourguignon (animal) | 405 | 48.6 | 483 | 5.03 (5.03–5.03) | 2.87 | 1.00 | OK |
| pizza-jambon-fromage | Pizza jambon-fromage et salade verte (animal) | 328 | 25.4 | 619 | 0.80 (0.80–0.80) | 2.97 | 1.00 | OK |
| pizza-jambon-fromage | Pizza au tofu fumé et pois chiches, salade verte (maison) | 330 | 20.5 (80%) | 618 | 0.41 (0.41–0.41), −49 % | 2.96 | 1.00 | OK |
| pizza-jambon-fromage | Pizza aux tranches végétales et râpé végétal, salade verte (commerce) | 308 | 21.1 (83%) | 630 | 0.43 (0.43–0.43), −46 % | 2.96 | 1.00 | OK |
| gratin-dauphinois | Gratin dauphinois et salade verte (animal) | 428 | 12.7 | 478 | 0.72 (0.72–0.72) | 2.92 | 1.00 | OK |
| gratin-dauphinois | Gratin de pommes de terre à la crème de soja, salade aux pois chiches (maison) | 450 | 12.1 (95%) | 409 | 0.45 (0.45–0.45), −37 % | 2.92 | 1.00 | OK |
| gratin-dauphinois | Gratin de pommes de terre au fromage végétal à tartiner, salade verte (commerce) | 438 | 11.9 (94%) | 397 | 0.48 (0.48–0.48), −34 % | 2.92 | 1.00 | OK |
| nuggets-frites | Nuggets de poulet maison et frites (animal) | 315 | 40.3 | 670 | 1.02 (1.02–1.02) | 2.9 | 1.00 | OK |
| nuggets-frites | Nuggets de tofu maison et frites (maison) | 365 | 28.9 (72%) | 735 | 0.40 (0.40–0.40), −61 % | 2.9 | 1.00 | OK |
| nuggets-frites | Nuggets soja et blé et frites (commerce) | 315 | 29.1 (72%) | 712 | 0.47 (0.47–0.47), −54 % | 2.9 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich jambon-beurre, carottes râpées et pomme (animal) | 445 | 20.9 | 677 | 0.71 (0.71–0.71) | 2.97 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich au tofu fumé, carottes râpées et pomme (maison) | 442 | 19.3 (92%) | 659 | 0.34 (0.34–0.34), −52 % | 2.72 | 1.00 | OK |
| sandwich-jambon-beurre | Sandwich aux tranches végétales, carottes râpées et pomme (commerce) | 450 | 28.3 (135%) | 658 | 0.36 (0.36–0.36), −50 % | 2.72 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes de bœuf à la tomate et spaghetti (animal) | 412 | 40.8 | 679 | 4.89 (4.89–4.89) | 3.12 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes de lentilles et tofu à la tomate, spaghetti (maison) | 425 | 29.0 (71%) | 584 | 0.38 (0.38–0.38), −92 % | 3.91 | 1.00 | OK |
| boulettes-tomate-spaghetti | Boulettes végétales à la tomate, spaghetti (commerce) | 402 | 31.4 (77%) | 614 | 0.55 (0.55–0.55), −89 % | 3.12 | 1.00 | OK |
| tortilla-espagnole | Tortilla espagnole et salade verte (animal) | 389 | 19.9 | 505 | 0.55 (0.55–0.55) | 2.92 | 1.00 | OK |
| tortilla-espagnole | Tortilla à la farine de pois chiche et salade verte (maison) | 401 | 16.2 (81%) | 528 | 0.37 (0.37–0.37), −33 % | 3.91 | 1.00 | OK |
| tortilla-espagnole | Tortilla au tofu et salade verte (commerce) | 376 | 20.1 (101%) | 522 | 0.43 (0.43–0.43), −22 % | 3.91 | 1.00 | OK |
| tartiflette | Tartiflette et salade verte (animal) | 461 | 24.0 | 639 | 1.16 (1.16–1.16) | 2.92 | 1.00 | OK |
| tartiflette | Tartiflette au tofu fumé et haricots blancs, salade verte (maison) | 466 | 17.2 (72%) | 452 | 0.58 (0.58–0.58), −50 % | 3.26 | 1.00 | OK |
| tartiflette | Tartiflette au fromage végétal et tofu fumé, salade verte (commerce) | 486 | 17.3 (72%) | 559 | 0.71 (0.71–0.71), −39 % | 2.92 | 1.00 | OK |
| paella | Paëlla au poulet, chorizo et crevettes (animal) | 422 | 42.0 | 642 | 2.37 (2.37–2.37) | 3.73 | 1.00 | OK |
| paella | Paëlla aux pois chiches, tofu fumé et tempeh (maison) | 466 | 32.0 (76%) | 680 | 0.66 (0.66–0.66), −72 % | 4.63 | 1.00 | OK |
| paella | Paëlla au seitan et saucisse végétale (commerce) | 382 | 32.0 (76%) | 558 | 0.56 (0.56–0.56), −76 % | 3.73 | 1.00 | OK |
| chili-con-carne | Chili con carne et riz (animal) | 481 | 39.0 | 625 | 4.93 (4.93–4.93) | 3.89 | 1.00 | OK |
| chili-con-carne | Chili aux haricots rouges, lentilles et tofu, riz (maison) | 494 | 27.9 (71%) | 533 | 0.48 (0.48–0.48), −90 % | 3.89 | 1.00 | OK |
| chili-con-carne | Chili aux protéines de soja texturées, riz (commerce) | 481 | 34.0 (87%) | 536 | 0.54 (0.54–0.54), −89 % | 3.89 | 1.00 | OK |
| endives-au-jambon | Endives au jambon et pommes de terre (animal) | 465 | 23.7 | 404 | 1.00 (1.00–1.00) | 2.97 | 1.00 | OK |
| endives-au-jambon | Endives au tofu fumé, béchamel au soja et pommes de terre (maison) | 455 | 17.6 (74%) | 359 | 0.48 (0.48–0.48), −52 % | 2.92 | 1.00 | OK |
| endives-au-jambon | Endives aux tranches végétales et râpé végétal, pommes de terre (commerce) | 462 | 23.2 (98%) | 432 | 0.50 (0.50–0.50), −50 % | 2.92 | 1.00 | OK |
| tomates-farcies | Tomates farcies et riz (animal) | 436 | 21.1 | 599 | 1.08 (1.08–1.08) | 3.73 | 1.00 | OK |
| tomates-farcies | Tomates farcies aux lentilles et riz (maison) | 438 | 17.8 (84%) | 421 | 0.53 (0.53–0.53), −51 % | 3.73 | 1.00 | OK |
| tomates-farcies | Tomates farcies aux protéines de soja et riz (commerce) | 425 | 22.7 (107%) | 419 | 0.58 (0.58–0.58), −47 % | 3.73 | 1.00 | OK |
| steak-frites | Steak frites et salade verte (animal) | 386 | 48.1 | 592 | 5.75 (5.75–5.75) | 2.92 | 1.00 | OK |
| steak-frites | Tempeh et tofu fumé grillés, frites et salade verte (maison) | 416 | 34.0 (71%) | 725 | 0.67 (0.67–0.67), −88 % | 2.92 | 1.00 | OK |
| steak-frites | Galettes végétales, frites et salade verte (commerce) | 411 | 34.7 (72%) | 777 | 0.64 (0.64–0.64), −89 % | 2.92 | 1.00 | OK |
| escalope-poulet-creme-riz | Escalope de poulet à la crème, riz et haricots verts (animal) | 416 | 45.2 | 579 | 1.38 (1.38–1.38) | 3.73 | 1.00 | OK |
| escalope-poulet-creme-riz | Tempeh et tofu à la crème de soja, riz et haricots verts (maison) | 466 | 34.1 (75%) | 620 | 0.66 (0.66–0.66), −52 % | 3.73 | 1.00 | OK |
| escalope-poulet-creme-riz | Seitan à la crème de soja, riz et haricots verts (commerce) | 454 | 41.4 (92%) | 570 | 0.64 (0.64–0.64), −54 % | 3.73 | 1.00 | OK |
| saucisse-lentilles | Saucisses de Toulouse aux lentilles (animal) | 328 | 34.7 | 513 | 1.35 (1.35–1.35) | 3.01 | 1.00 | OK |
| saucisse-lentilles | Tofu fumé aux lentilles (maison) | 330 | 30.8 (89%) | 420 | 0.34 (0.34–0.34), −75 % | 3.01 | 1.00 | OK |
| saucisse-lentilles | Saucisses végétales aux lentilles (commerce) | 328 | 43.0 (124%) | 484 | 0.37 (0.37–0.37), −72 % | 3.01 | 1.00 | OK |
| coquillettes-jambon | Coquillettes au jambon, emmental et petits pois (animal) | 358 | 33.2 | 591 | 0.91 (0.91–0.91) | 3.12 | 1.00 | OK |
| coquillettes-jambon | Coquillettes au tofu fumé et petits pois (maison) | 345 | 25.9 (78%) | 550 | 0.46 (0.46–0.46), −50 % | 3.12 | 1.00 | OK |
| coquillettes-jambon | Coquillettes aux tranches végétales, râpé végétal et petits pois (commerce) | 358 | 31.5 (95%) | 636 | 0.49 (0.49–0.49), −46 % | 3.12 | 1.00 | OK |
| poisson-pane-puree | Poisson pané maison et purée (animal) | 398 | 37.9 | 546 | 1.68 (1.68–1.68) | 2.96 | 1.00 | OK |
| poisson-pane-puree | Tofu pané maison et purée (maison) | 420 | 27.9 (74%) | 617 | 0.46 (0.46–0.46), −73 % | 2.87 | 1.00 | OK |
| poisson-pane-puree | Bâtonnets panés soja et blé et purée (commerce) | 368 | 29.8 (79%) | 571 | 0.51 (0.51–0.51), −70 % | 2.48 | 1.00 | OK |
| galette-complete | Galette complète (jambon, œuf, emmental) et salade verte (animal) | 384 | 31.4 | 598 | 0.88 (0.88–0.88) | 3.38 | 1.00 | OK |
| galette-complete | Galette de sarrasin au tofu fumé et tofu brouillé, salade verte (maison) | 356 | 22.6 (72%) | 524 | 0.35 (0.35–0.35), −60 % | 3.38 | 1.00 | OK |
| galette-complete | Galette de sarrasin aux tranches végétales et râpé végétal, salade verte (commerce) | 331 | 23.2 (74%) | 555 | 0.35 (0.35–0.35), −61 % | 3.38 | 1.00 | OK |
| pates-carbonara | Pâtes à la carbonara (animal) | 310 | 28.1 | 675 | 0.90 (0.90–0.90) | 3.12 | 1.00 | OK |
| pates-carbonara | Pâtes « carbonara » au tofu fumé (maison) | 313 | 24.5 (87%) | 567 | 0.40 (0.40–0.40), −56 % | 3.91 | 1.00 | OK |
| pates-carbonara | Pâtes « carbonara » aux tranches végétales (commerce) | 308 | 28.4 (101%) | 599 | 0.41 (0.41–0.41), −55 % | 3.12 | 1.00 | OK |
| flammekueche | Flammekueche et salade verte (animal) | 361 | 18.8 | 663 | 0.86 (0.86–0.86) | 2.92 | 1.00 | OK |
| flammekueche | Flammekueche au tofu fumé et salade verte (maison) | 374 | 19.7 (105%) | 593 | 0.50 (0.50–0.50), −42 % | 2.92 | 1.00 | OK |
| flammekueche | Flammekueche aux tranches végétales et salade verte (commerce) | 361 | 26.4 (141%) | 637 | 0.50 (0.50–0.50), −42 % | 2.92 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois et parmesan (animal) | 375 | 18.0 | 573 | 0.63 (0.63–0.63) | 3.73 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois et tofu fumé (maison) | 382 | 16.2 (90%) | 532 | 0.51 (0.51–0.51), −20 % | 3.73 | 1.00 | OK |
| risotto-petits-pois | Risotto aux petits pois et saucisse végétale (commerce) | 405 | 22.0 (122%) | 617 | 0.57 (0.57–0.57), −10 % | 3.73 | 1.00 | OK |
| couscous-poulet-merguez | Couscous poulet et merguez (animal) | 445 | 45.5 | 611 | 2.66 (2.66–2.66) | 3.11 | 1.00 | OK |
| couscous-poulet-merguez | Couscous au tempeh et pois chiches (maison) | 459 | 32.0 (70%) | 557 | 0.53 (0.53–0.53), −80 % | 3.11 | 1.00 | OK |
| couscous-poulet-merguez | Couscous au seitan et saucisses végétales (commerce) | 420 | 38.0 (83%) | 493 | 0.50 (0.50–0.50), −81 % | 3.11 | 1.00 | OK |
| poulet-curry-coco | Poulet au curry et lait de coco, riz (animal) | 369 | 40.7 | 590 | 1.13 (1.13–1.13) | 4.21 | 1.00 | OK |
| poulet-curry-coco | Curry de tempeh et pois chiches au lait de coco, riz (maison) | 431 | 29.2 (72%) | 700 | 0.57 (0.57–0.57), −50 % | 4.21 | 1.00 | OK |
| poulet-curry-coco | Curry de seitan au lait de coco, riz (commerce) | 394 | 35.2 (86%) | 616 | 0.53 (0.53–0.53), −53 % | 4.21 | 1.00 | OK |
| pot-au-feu | Pot-au-feu (animal) | 392 | 42.2 | 332 | 4.37 (4.37–4.37) | 2.86 | 1.00 | OK |
| pot-au-feu | Pot-au-feu au tempeh (maison) | 442 | 30.1 (71%) | 394 | 0.64 (0.64–0.64), −85 % | 2.78 | 1.00 | OK |
| pot-au-feu | Pot-au-feu au seitan (commerce) | 430 | 34.8 (83%) | 340 | 0.52 (0.52–0.52), −88 % | 2.64 | 1.00 | OK |
| pates-saumon-epinards | Pâtes au saumon, crème et épinards (animal) | 355 | 30.0 | 606 | 0.95 (0.95–0.95) | 3.12 | 1.00 | OK |
| pates-saumon-epinards | Pâtes au tofu fumé, crème de soja et épinards (maison) | 355 | 25.1 (84%) | 502 | 0.46 (0.46–0.46), −52 % | 3.12 | 1.00 | OK |
| pates-saumon-epinards | Pâtes aux lanières végétales, crème de soja et épinards (commerce) | 330 | 28.8 (96%) | 500 | 0.41 (0.41–0.41), −57 % | 3.12 | 1.00 | OK |
| salade-cesar | Salade César au poulet (animal) | 345 | 39.1 | 466 | 1.01 (1.01–1.01) | 3.16 | 1.00 | OK |
| salade-cesar | Salade César au tempeh et tofu grillés (maison) | 392 | 30.9 (79%) | 514 | 0.50 (0.50–0.50), −50 % | 3.16 | 1.00 | OK |
| salade-cesar | Salade César au seitan (commerce) | 355 | 30.5 (78%) | 448 | 0.45 (0.45–0.45), −55 % | 3.16 | 1.00 | OK |
| oeufs-brouilles-tartines | Petit-déjeuner : œufs brouillés, tartines et jus d'orange (animal) | 375 | 23.5 | 507 | 0.61 (0.61–0.61) | 2.44 | 1.00 | OK |
| oeufs-brouilles-tartines | Petit-déjeuner : tofu brouillé, tartines et jus d'orange (maison) | 360 | 23.8 (101%) | 498 | 0.44 (0.44–0.44), −29 % | 2.37 | 1.00 | OK |
| oeufs-brouilles-tartines | Petit-déjeuner : tartines au tartinable végétal et tranches végétales, jus d'orange (commerce) | 305 | 20.3 (86%) | 417 | 0.45 (0.45–0.45), −27 % | 2.37 | 1.00 | OK |
| crepes-compote | Goûter : crêpes et compote (animal) | 358 | 17.3 | 568 | 0.51 (0.51–0.51) | 3.09 | 1.00 | OK |
| crepes-compote | Goûter : crêpes à la boisson au soja et compote (maison) | 342 | 14.4 (83%) | 542 | 0.27 (0.27–0.27), −47 % | 3.91 | 1.00 | OK |
| crepes-compote | Goûter : crêpes à la boisson au soja et dessert au soja (commerce) | 332 | 16.8 (97%) | 488 | 0.27 (0.27–0.27), −47 % | 3.91 | 1.00 | OK |
| cordon-bleu-puree | Cordon bleu maison et purée (animal) | 425 | 52.0 | 646 | 1.58 (1.58–1.58) | 2.97 | 1.00 | OK |
| cordon-bleu-puree | « Cordon bleu » de tempeh au tofu fumé et purée (maison) | 450 | 36.8 (71%) | 669 | 0.73 (0.73–0.73), −54 % | 2.87 | 1.00 | OK |
| cordon-bleu-puree | « Cordon bleu » de seitan aux tranches végétales et purée (commerce) | 428 | 38.8 (75%) | 642 | 0.62 (0.62–0.62), −61 % | 2.87 | 1.00 | OK |
| roti-porc-pommes-de-terre | Rôti de porc, pommes de terre rôties et haricots verts (animal) | 380 | 43.9 | 415 | 1.31 (1.31–1.31) | 2.86 | 1.00 | OK |
| roti-porc-pommes-de-terre | Tempeh et tofu rôtis, pommes de terre rôties et haricots verts (maison) | 438 | 32.6 (74%) | 504 | 0.59 (0.59–0.59), −55 % | 2.78 | 1.00 | OK |
| roti-porc-pommes-de-terre | Seitan rôti, pommes de terre rôties et haricots verts (commerce) | 405 | 36.7 (84%) | 412 | 0.53 (0.53–0.53), −59 % | 2.55 | 1.00 | OK |
| cabillaud-pommes-vapeur | Cabillaud, pommes de terre vapeur et épinards (animal) | 422 | 39.2 | 377 | 2.61 (2.61–2.61) | 3.68 | 1.00 | OK |
| cabillaud-pommes-vapeur | Tofu au citron, haricots blancs, pommes de terre vapeur et épinards (maison) | 470 | 29.1 (74%) | 504 | 0.50 (0.50–0.50), −81 % | 3.68 | 1.00 | OK |
| cabillaud-pommes-vapeur | Bâtonnets panés soja et blé, pommes de terre vapeur et épinards (commerce) | 418 | 31.0 (79%) | 572 | 0.59 (0.59–0.59), −77 % | 3.68 | 1.00 | OK |

## Lot B — S17b Rendements de cuisson

- [ ] **Correspondance** 6254 (steak haché 15 % cru) → 6255 (cuit) avec la ligne USDA NDB 23574 « Beef, ground, medium fat (12%-22%), patty », Pan-broiled, 73 % (70,78-75,97 %, n = 4) : la poêle correspond-elle bien à la cuisson de Ciqual ? Prix dérivé : 17,53 ÷ 0,73 = 24,01 €/kg (fourchette 22,09-25,08).
- [ ] **Effet** : la couverture des prix des plats au bœuf haché monte (burger 33 %, lasagnes 30 %, hachis 25 %, boulettes 24 %, chili 21 %) mais reste sous 95 % : aucun prix total n'est encore affiché.
- [ ] **Suite** : ajouter des prix crus au détail pour d'autres viandes (sans os) et des rendements pour pâtes, riz, légumineuses (pas de source exploitable trouvée : l'Agriculture Handbook 102 n'existe qu'en images scannées).

## Lot C — S18 Scores et vainqueurs

- [ ] **Validation des sens par un·e diététicien·ne** (`data/score_rules.json`, catégorie Nutrition) : protéines, fibres ↑ ; sel, acides gras saturés, sucres ↓ (composantes du Nutri-Score, page Santé publique France mise à jour le 19 mars 2026) ; fer, calcium, zinc, B12, iode, vitamine D, B2 ↑ (références ANSES 2025) ; oméga-3 ALA, EPA, DHA ↑ (ANSES, « Les lipides », 2021). « Plus = mieux » ignore la limite supérieure de sécurité (LSS) : simplification à valider.
- [ ] **Validation des sens par une personne experte en ACV** : les 16 indicateurs Agribalyse « moins = mieux » ; score unique EF et sous-parties du changement climatique (fossile, biogénique, affectation des sols) affichés, non comptés (pour ne pas compter deux fois). Les valeurs négatives (ex. utilisation des sols) sont comparées telles que publiées.
- [ ] **Sucres** : comptés « moins = mieux » (sucres totaux, comme le Nutri-Score), conformément à DESIGN.md § 5. Cela remplace la décision de l'étape C (« sucres totaux affichés sans verdict »). Alternative : ne pas les compter (les repères visent les sucres ajoutés).
- [ ] **Vitamine B2** : ajoutée aux indicateurs comptés (absente de la liste de DESIGN.md § 5) pour ne pas retirer du score un point où le plat animal fait souvent mieux (règle 3). Alternative : l'afficher sans la compter.
- [ ] **Oméga-3** : trois indicateurs (ALA, EPA, DHA), car l'ANSES donne trois références. Alternative : un seul indicateur « oméga-3 » (pèserait moins dans la catégorie).
- [ ] **Données partielles non comptées** : un indicateur dont les données couvrent moins de 95 % de la masse d'un plat n'est pas compté (même règle que les verdicts existants). Pour les animaux, une valeur partielle est une borne basse (> 0 contre 0 pour le végétal) qui suffirait à départager ; alternative : compter ces cas.
- [ ] **Santé** : grammes de viande transformée (CIRC groupe 1) et de viande rouge (groupe 2A) par portion, « moins = mieux ». Les repères PNNS, fondés sur les mêmes grammes, ne sont pas comptés (double compte) ; EAT-Lancet (source provisoire) non compté.
- [ ] **Économie** : le coût climat est proportionnel au CO₂e déjà compté en environnement (double compte voulu par DESIGN.md § 5). Alternative : ne compter que le prix.
- [ ] **Bases** : le verdict global et les cartes sont calculés par portion ; seul l'onglet Nutrition suit l'unité choisie (portion, 100 kcal, 10 g de protéines).
