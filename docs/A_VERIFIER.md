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
- [ ] **Lecture « 1 animal pour N portions »** (ex. bœuf bourguignon : environ 1 animal pour 1 686 portions, estimation basse) : formulation à valider.
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
