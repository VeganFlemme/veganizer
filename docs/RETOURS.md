# Retours de la relecture automatisée (suite V1, étape 4)

Relecture du 1er novembre 2026 sur le build local (version de la branche `roadmap/s25`, avant l'étape 3 quinquies). Sous-agents indépendants : 5 visiteurs simulés (qui ne lisent ni le code ni nos documents), 2 experts simulés (chaque remarque doit citer une source ouverte vérifiée), 1 spécialiste de l'expérience utilisateur. Statut de chaque remarque : **corrigée**, **refusée** (avec la raison) ou **reportée** (mise à jour du 1er novembre 2026, fin de l'étape 4). Les remarques reportées sont reprises dans `docs/A_VERIFIER.md`.

## Tests de compréhension (5 visiteurs)

| Question | Bonne réponse | Bonnes réponses | Remarque |
|---|---|---|---|
| Q1 Lentilles vertes, bourguignon : moins de CO₂e, de combien ? | Oui, −93 % par portion (5,03 → 0,37 kg) | 5/5 | Plusieurs notent que la portion végétale n'a alors que 18,8 g de protéines contre 48,6 g (masse égale). |
| Q2 Que veut dire « Version complétée » ? | Plat animal inchangé ; version végétale à protéines visées égales (protéine doublée au plus) puis manques comblés par une liste relue ; exemple, pas un conseil | 5/5 (confiance moyenne pour 2) | Le bouton n'est pas expliqué avant le clic ; listes « sauf : … » contradictoires. |
| Q3 Pourquoi des données manquantes ? | Valeur non publiée ou « traces », moins de 95 % de la masse couverte, pas de facteur sourcé ; jamais 0 | 5/5 | Explication trouvée seulement sur `/methodologie`, très longue. |
| Q4 Bourguignon : qui gagne en nutrition, où l'animal fait mieux ? | Plat animal, 5–3 provisoire ; protéines, sel, sucres, fer, zinc (B12 non comptée) | 5/5 | Le sens de « 5–3 » n'est compris qu'en lisant la phrase. |
| Q5 Premier écran en 5 secondes | Plat comparé, verdict 4 sur 5, −88 % CO₂e | 2/5 voient le verdict | Sur téléphone, le verdict est sous la ligne de flottaison ; « 35 protéines sur 35 » incompris ; CO₂e non expliqué. |
| Q5 refaite après corrections (verdict et CO₂e dans l'en-tête sur téléphone, phrase des protéines réécrite) | idem | 4/5 | Le visiteur malvoyant ne voyait pas la ligne CO₂e, en bas de l'en-tête : elle est depuis placée sous le verdict, en gros (non retesté). « 35 protéines » encore lu une fois comme « 35 recettes » : phrase réécrite. Remarque de l'analyste : le « 3 sur 5 » inclut une catégorie gagnée d'office (dit sous le verdict). |

## Remarques des visiteurs et du spécialiste UX (regroupées)

| # | Remarque | Qui | Statut |
|---|---|---|---|
| V1 | Scores « 5 – 3 » : côté animal/végétal illisible sans couleur ; « Indicateur(s) » vs « catégories » mélangés | omnivore, senior, daltonien, analyste, UX | corrigée : en-tête « Chiffres : indicateurs gagnés, plat animal – version végétale », texte lu par les lecteurs d’écran |
| V2 | Économie « gagnée » sans prix : le coût climat recompte le CO₂e | étudiant, omnivore, UX, analyste | corrigée : coût climat affiché, non compté (`displayedNotCounted`, règles v1.3) |
| V3 | Protection animale gagnée d'office (0–1, 0–0) dans le « 4 sur 5 » : règle non visible à l'endroit du score | omnivore, étudiant, analyste | corrigée : note sous le verdict « Protection animale gagnée d’office… » |
| V4 | Version complétée : « sauf : zinc, vitamine B12 » ici, « sauf : zinc » là ; « b12 » en minuscule ; « 4 sur 4 » sans explication | tous | corrigée : une seule version ajustable (3 quinquies), carte d’équivalence et noms en clair |
| V5 | Protéine par défaut absurde en cuisine (fines tranches dans un bourguignon, seitan pour le poisson), salée, chère | omnivore, étudiant, analyste, diététicienne | reportée : rôle par sous-groupe Ciqual et sel dans le classement, règle à décider par Matt (avec D1) ; la protéine reste au choix du visiteur |
| V6 | Ordre de la liste des protéines incompris (tri au gramme près non dit) ; aucune vue d'ensemble des protéines (CO₂e par option) | omnivore, senior, analyste | reportée (V2) : vue d’ensemble des protéines |
| V7 | Faute de frappe « bourguinon » : 0 plat comparé | senior | corrigée : recherche tolérante aux fautes (`lib/fuzzy.ts`) |
| V8 | Tableau des recettes complétées cassé à 360 px (défilement horizontal) | senior | corrigée : tableau à largeur fixe, test e2e à 375 px avec `?ajuste=tout` |
| V9 | Premier écran trop chargé, verdict sous la ligne de flottaison sur téléphone | senior, étudiant | corrigée : ligne « Verdict : 3 sur 5 » dans l’en-tête sur téléphone (Q5 refaite) |
| V10 | Jargon non expliqué (CO₂e, DQR, CTUh, eutrophisation, Pt, m³ éq., « provisoire », « fourchette ») ; typo « éq.. » | senior, UX, analyste | corrigée en partie : DQR expliqué au survol, « Gaz à effet de serre (CO₂e) », « éq.. » ; CTUh, eutrophisation, Pt reportés |
| V11 | Valeurs illisibles (10⁻⁸, 0,000647, 0,0383 jour, « 0,03 animal », 231,02 kg) | senior, UX | reportée : formats des très petits nombres |
| V12 | ✓ posés dans les 3 bases et contradictoires ; « ↑/↓ » répétés sur chaque ligne | UX | corrigée : ✓ seulement par portion, deux bases, sens une fois par ligne |
| V13 | Export JSON : `null` pour les nutriments à fourchette, prix publié alors que la page le refuse, `?vue=complete` ignoré, pas d'export sur `/aliment` | analyste | corrigée : fourchettes exportées, prix seulement si couverture suffisante, `?ajuste` ; export de `/aliment` reporté |
| V14 | Bases mélangées sur `/aliment` (« par portion » vs « pour 100 g ») | analyste, UX | reportée |
| V15 | Barres des cartes : pas de ✓ ni de sens, une seule borne, % pas sur toutes les lignes | daltonien, analyste, UX | reportée |
| V16 | Lignes vides ou nulles des deux côtés (douleur, poissons, PNNS 0 g) | UX, analyste | reportée |
| V17 | Ordre des indicateurs Environnement (ozone en 2e) ; DQR identique répété 20 fois | UX, omnivore, analyste | reportée |
| V18 | `/recette` : premières suggestions sans données ou parasites, nom écrasé à 375 px, 100 g par défaut non signalés | étudiant, UX | reportée |
| V19 | `/methodologie` trop longue, mentions internes (« docs/A_VERIFIER.md », « depuis notre environnement ») ; `/sources` sans tri utilisées/non utilisées | omnivore, senior, étudiant | corrigée en partie : mentions internes retirées ; longueur de `/methodologie` et tri de `/sources` reportés |
| V20 | Accueil : deux unités dans deux listes, « 4 sur 5 » coupé, page très longue | étudiant, daltonien | reportée |
| V21 | Petits caractères (11–12 px) et petites cibles tactiles (liens 16 px de haut) | senior | reportée |
| V22 | Mentions orange « Données partielles » proches de la couleur du plat animal ; gris « égalité » peu contrasté | daltonien | reportée |

## Remarques de la diététicienne simulée (sources vérifiées dans son rapport)

| # | Remarque | Source citée | Statut |
|---|---|---|---|
| D1 | Classement : produits salés et hors rôle (fines tranches 1,62 g de sel/100 g) ; rôle par sous-groupe Ciqual, sel avant lipides | sante.fr (5 g de sel/j) | reportée : avec V5 |
| D2 | Fromage « ingrédient principal » remplacé par une protéine sans calcium | ANSES 2019-SA-0118 p. 23 | corrigée en partie : note de rôle (5 ter) quand l’aliment principal n’est pas surtout une protéine ; choix d’un remplaçant riche en calcium reporté |
| D3 | Spécialités type fromage : AGS équivalents, sel ×3, 0 g/j dans les régimes ANSES | ANSES 2019-SA-0118 tab. 8 p. 22 | reportée |
| D4 | Conseil « Protéines » : analogues de viande contributeurs chez les lacto-ovo, 0 g/j chez les végétaliens | ANSES 2019-SA-0118 p. 24-25 | corrigée : conseil « Protéines » réécrit (ANSES 2019-SA-0118) |
| D5 | « Protéines : plus = mieux » au-delà des besoins | ANSES Protéines ; CRESS Nutri-Score | reportée : décision de Matt (les protéines restent l’indicateur de fonction du plat) |
| D6 | Qualité des protéines (DIAAS) du seitan | Herreman et al. 2020 | reportée |
| D7 | Poisson → tofu/seitan : perte d'iode non signalée | ANSES Iode ; 2019-SA-0118 p. 30 | corrigée : justification des règles 40–43 (pas d’iode de la mer) ; l’iode figure dans « Ce qui reste à couvrir » |
| D8 | Sel iodé ajouté en plus du sel du plat | sante.fr | corrigée : sel iodé retiré de la liste blanche |
| D9 | Fer et zinc sans absorption | ANSES fer ; ANSES références 21/02/2025 | reportée |
| D10 | Sucres totaux pénalisent le lactose | ANSES sucres | reportée |
| D11 | Trop de soja dans un plat | ANSES 2019-SA-0118 p. 31 | reportée |
| D12 | Yaourt → dessert soja non enrichi | ANSES 2019-SA-0118 p. 24 | corrigée en partie : la justification dit que l’ANSES recommande un dessert enrichi |
| D13 | Recettes officielles : pain en farine + eau, sans sel | Ciqual 2025 | reportée |
| D14 | Graines de lin entières | Austria et al. 2008 | reportée |
| D15 | « environ la moitié » → « au moins la moitié » ; calcium des oléagineux ; références pour adultes | ANSES 2019-SA-0118 p. 23-24, 31 | corrigée : « au moins la moitié des huiles » |

Points confirmés : textes B12, zinc, vitamine D, EPA + DHA, B2 ; limites de sécurité (zinc 25 mg/j confirmé) ; portions réalistes.

## Remarques de l'expert ACV simulé (sources vérifiées dans son rapport)

| # | Remarque | Source citée | Statut |
|---|---|---|---|
| A1 | Plats officiels : remplaçants comptés avec emballage, supermarché et cuisson alors que « Autres étapes » est gardé (≈ +14 % côté végétal sur le hachis) ; état cru « à l'usine » remplacé par prêt à manger | Tableur 3.2, notice et « Detail etape » | reportée : limite écrite sur `/methodologie` (biais défavorable au végétal) |
| A2 | Verdict sur valeurs centrales sans incertitude (Agribalyse ne publie pas d'écart-type) | doc.agribalyse.fr, méthodologie ACV | reportée |
| A3 | 16 indicateurs à poids égal vs pondération EF ; robustesse III | JRC 2018 ; Zampori & Pant 2019 | corrigée : paragraphe « Lire les indicateurs d’Agribalyse » (pondération EF, robustesse) |
| A4 | Avertissement ADEME sur l'information du consommateur, revue critique | doc.agribalyse.fr, information des consommateurs | corrigée : avertissement de l’ADEME et absence de revue critique externe cités |
| A5 | DQR : « moins bonne note » vs moyenne pondérée PEF ; DQR publié des plats officiels perdu ; alerte au-delà de 3 | FAQ Agribalyse n° 16 ; Zampori & Pant 2019 | reportée |
| A6 | Masses 3.0 vs 3.2 : contrôle par ingrédient de l'impact par kg déduit | Change Report AGB 3.2 | reportée |
| A7 | Phrase fausse : le tableur 3.2 contient les sous-parties du climat par ingrédient | Tableur 3.2 | corrigée : phrase réécrite (le CSV importé n’a pas les sous-parties, le tableur les a) |
| A8 | Recettes types : les ingrédients comptent déjà emballage et cuisson ; « un peu surestimé » non démontré | Tableur 3.2 ; FAQ n° 19 | corrigée : paragraphe des recettes types réécrit (emballage 1 % bœuf, 48 % tofu) |
| A9 | Valeurs négatives des sols : explication non sourcée | JRC 2018 (Fazio et al.) | corrigée : explication sourcée (JRC 2018) |
| A10 | LUC négatif : « stockage de carbone » non documenté ; PEF exclut ce stockage | Zampori & Pant 2019 | corrigée : cause non documentée dite ; PEF exclut le stockage |
| A11 | « Eau » = privation AWARE, pas un volume | Zampori & Pant 2019 | corrigée : « Eau : risque de privation (AWARE) », unité « m³ éq. monde » |
| A12 | Avertissement œufs incomplet (produits contenant des œufs) ; quinoa dans `/recette` | Tableur 3.2, notice | reportée |
| A13 | Toxicité : exposition via l'environnement, pas l'aliment | Tableur 3.2 ; doc.agribalyse.fr | corrigée : exposition via l’environnement |
| A14 | Export 3.0 : rediffusion par un tiers ; procédés ecoinvent sous licence | data.gouv.fr ; doc.agribalyse.fr | corrigée : rediffusion par un tiers, données ecoinvent non utilisées |
| A15 | Masse de portion des plats officiels = masses d'entrée « à l'usine » | Tableur 3.2 ; FAQ n° 15 | documentée sur `/methodologie` (contrôle croisé) ; correction de la masse reportée |


## Contrôle croisé des recettes (point 4 bis)

Notre recette (accompagnements compris, comme sur le site), ramenée à 1 kg et à 100 g, comparée au plat moyen : kg CO₂e/kg (AGRIBALYSE 3.2, synthèse) ; énergie, protéines, lipides, sel pour 100 g (Ciqual 2025). Valeurs « nous / Agribalyse (écart) » ; une fourchette vient d'un ingrédient « < x » ; écart nul si la valeur officielle est dans la fourchette. Script : `pipeline/crosscheck.py` (données : `data/recipes_crosscheck.json`, affichées sur `/methodologie#controle-recettes`).

| Plat | Plat Agribalyse | kg CO₂e/kg | kcal/100 g | protéines g/100 g | lipides g/100 g | sel g/100 g | À revoir |
|---|---|---|---|---|---|---|---|
| Bœuf bourguignon | Boeuf bourguignon (25033) | 12.42 / 25.00 (-50 %) | 119.19 / 84.30 (+41 %) | 12.00 / 10.30 (+17 %) | 3.68–3.83 / 2.61 (+41 %) | 0.21–0.52 / 0.88 (-41 %) | oui |
| Lasagnes à la bolognaise | Lasagnes ou cannelloni à la viande (bolognaise) (25081) | 11.68 / 6.10 (+91 %) | 154.73 / 134.00 (+15 %) | 9.35 / 6.29 (+49 %) | 7.96–7.99 / 5.72 (+39 %) | 0.29 / 0.97 (-70 %) | oui |
| Hachis parmentier | Hachis Parmentier à la viande (25009) | 9.49 / 12.00 (-21 %) | 137.16 / 138.00 (-1 %) | 7.46 / 5.99 (+25 %) | 7.49–7.52 / 8.22 (-9 %) | 0.07 / 0.83 (-91 %) | oui |
| Blanquette de veau | Blanquette de veau (25001) | 7.23 / 19.50 (-63 %) | 153.46 / 113.00 (+36 %) | 11.34 / 15.40 (-26 %) | 7.16–7.23 / 4.00 (+79 %) | 0.04 / 0.74 (-95 %) | oui |
| Quiche lorraine et salade verte | Quiche lorraine (25405) | 2.97 / 4.57 (-35 %) | 230.93 / 269.00 (-14 %) | 6.14 / 8.39 (-27 %) | 17.18 / 16.40 (+5 %) | 0.39 / 1.01 (-61 %) | oui |
| Paëlla au poulet, chorizo et crevettes | Paëlla (25031) | 5.60 / 3.28 (+71 %) | 151.89 / 148.00 (+3 %) | 9.93 / 7.86 (+26 %) | 5.41 / 4.90 (+10 %) | 0.46 / 0.87 (-47 %) | oui |
| Couscous poulet et merguez | Couscous royal (avec plusieurs viandes) (25127) | 5.97 / 3.85 (+55 %) | 137.26 / 132.00 (+4 %) | 10.23 / 7.69 (+33 %) | 5.06–5.13 / 4.53 (+12 %) | 0.30 / 0.88 (-65 %) | oui |
| Chili con carne et riz | Chili con carne (25111) | 10.24 / 19.60 (-48 %) | 129.90 / 118.00 (+10 %) | 8.10 / 7.13 (+14 %) | 4.77–4.87 / 3.35 (+42 %) | 0.07 / 0.93 (-92 %) | oui |
| Tartiflette et salade verte | Tartiflette (25137) | 2.52 / 3.52 (-28 %) | 138.59 / 161.00 (-14 %) | 5.20 / 6.00 (-13 %) | 8.91 / 8.90 (+0 %) | 0.45 / 0.75 (-41 %) | oui |
| Pot-au-feu | Pot-au-feu (25013) | 11.13 / 17.70 (-37 %) | 84.69 / 77.50 (+9 %) | 10.75 / 10.90 (-1 %) | 1.45–1.55 / 2.02 (-23 %) | 0.17 / 0.32 (-45 %) | oui |
| Croque-monsieur et salade verte | Croque-monsieur (25400) | 3.29 / 4.40 (-25 %) | donnée manquante | 9.76 / 14.30 (-32 %) | 10.52 / 18.40 (-43 %) | 0.46 / 1.71 (-73 %) | oui |
| Pizza jambon-fromage et salade verte | Pizza jambon fromage (25435) | 2.48 / 3.23 (-23 %) | 163.11 / 228.00 (-28 %) | 7.35 / 10.70 (-31 %) | 9.01–9.13 / 8.49 (+6 %) | 0.47 / 1.33 (-65 %) | oui |
| Galette complète (jambon, œuf, emmental) et salade verte | Crêpe ou Galette complète (œuf, jambon, fromage) (25562) | 3.09 / 3.83 (-19 %) | 157.52 / 219.00 (-28 %) | 9.38 / 15.30 (-39 %) | 9.62 / 9.80 (-2 %) | 0.47 / 1.12 (-58 %) | oui |
| Pâtes à la carbonara | Pâtes à la carbonara (spaghetti, tagliatelles…) (25135) | 2.91 / 3.61 (-19 %) | 217.41 / 161.00 (+35 %) | 9.04 / 5.91 (+53 %) | 10.12 / 8.70 (+16 %) | 0.53 / 0.86 (-38 %) | oui |
| Endives au jambon et pommes de terre | Endive au jambon (25073) | 3.00 / 3.89 (-23 %) | 84.35 / 109.00 (-23 %) | 7.36 / 7.44 (-1 %) | 3.62–3.83 / 6.30 (-39 %) | 0.47 / 0.65 (-27 %) | oui |
| Sandwich jambon-beurre, carottes râpées et pomme | Sandwich baguette, jambon, beurre (25517) | 2.48 / 5.61 (-56 %) | 122.34 / 285.00 (-57 %) | 5.66 / 11.60 (-51 %) | 3.92–4.04 / 10.50 (-62 %) | 0.47 / 1.78 (-74 %) | oui |
| Poulet au curry et lait de coco, riz | Poulet au curry et au lait de coco (25174) | 3.36 / 5.68 (-41 %) | 148.60 / 125.00 (+19 %) | 11.61 / 10.60 (+10 %) | 5.57–5.59 / 6.90 (-19 %) | 0.12 / 1.07 (-89 %) | oui |
| Gratin dauphinois et salade verte | Gratin dauphinois (25056) | 1.68 / 2.01 (-16 %) | 111.77 / 113.00 (-1 %) | 2.96 / 3.38 (-12 %) | 6.74 / 4.20 (+61 %) | 0.09 / 0.81 (-89 %) | oui |
| Tomates farcies et riz | Tomate farcie (25103) | 2.48 / 3.47 (-28 %) | 137.40 / 127.00 (+8 %) | 4.85 / 6.00 (-19 %) | 7.92 / 9.67 (-18 %) | 0.37–0.37 / 0.70 (-47 %) | oui |
| Boulettes de bœuf à la tomate et spaghetti | Boulettes au bœuf, à la sauce tomate (25211) | 11.86 / 12.30 (-4 %) | 164.58 / 117.00 (+41 %) | 9.89 / 9.00 (+10 %) | 6.66 / 6.50 (+2 %) | donnée manquante | oui |
| Flammekueche et salade verte | Flammenkueche ou Tarte flambée aux lardons (25550) | 2.39 / 2.94 (-19 %) | 183.46 / 300.00 (-39 %) | 5.20 / 8.81 (-41 %) | 9.89 / 14.80 (-33 %) | 0.79 / 1.64 (-52 %) | oui |
| Salade César au poulet | Salade César au poulet (salade verte, fromage, croûtos, sauce) (25628) | 2.92 / 3.94 (-26 %) | 134.95 / 151.00 (-11 %) | 11.33 / 8.13 (+39 %) | 6.86–6.94 / 10.00 (-31 %) | 0.31 / 0.75 (-58 %) | oui |
| Saucisses de Toulouse aux lentilles | Petit salé ou saucisse aux lentilles (25010) | 4.13 / 1.66 (+149 %) | 156.56 / 118.00 (+33 %) | 10.59 / 8.24 (+28 %) | 7.79–7.87 / 4.87 (+60 %) | 0.55 / 0.98 (-44 %) | oui |
| Lasagnes à la bolognaise (version végétale) | Lasagnes ou cannelloni aux légumes (25131) | 1.13 / 3.23 (-65 %) | 125.37 / 120.00 (+4 %) | 7.37 / 4.38 (+68 %) | 4.51–4.53 / 5.90 (-23 %) | 0.57 / 0.60 (-6 %) | oui |
| Pizza jambon-fromage et salade verte (version végétale) | Pizza aux légumes ou Pizza 4 saisons (25472) | 1.45 / 3.42 (-58 %) | 152.06 / 206.00 (-26 %) | 5.16 / 7.58 (-32 %) | 7.51–7.63 / 7.78 (-2 %) | 0.38 / 1.06 (-64 %) | oui |

Lecture et statut :

| # | Constat | Statut |
|---|---|---|
| R1 | Sel toujours plus bas (−27 à −95 %) : nos recettes ne comptent pas le sel de cuisson ; même oubli des deux côtés, l'écart entre plats ne change pas | reportée : il faut une source de quantité de sel par plat |
| R2 | Accompagnements (riz, pommes de terre, salade) inclus chez nous : valeurs pour 100 g diluées | refusée : le plat compare le repas tel qu'on le mange (règle 4) ; écrit sur `/methodologie` |
| R3 | CO₂e par kg nettement plus haut que le plat moyen : lasagnes (+91 %), saucisses aux lentilles (+149 %), paëlla (+71 %), couscous (+55 %) ; l'avantage végétal pourrait y être surestimé | reportée, prioritaire : revoir ces 4 recettes (part et espèces de viande), décision de Matt |
| R4 | CO₂e nettement plus bas : bourguignon (−50 %), blanquette (−63 %), chili (−48 %), pot-au-feu (−37 %) ; avantage végétal plutôt sous-estimé | reportée |
| R5 | Recettes officielles : masses d'ingrédients avant cuisson, « pour 100 g » = 100 g d'ingrédients (hachis : 0,95 au lieu de 1,20 kg CO₂e pour 100 g de plat fini) | documentée sur `/methodologie` ; correction reportée (avec A15) |
| R6 | Versions végétales : pas d'équivalent Agribalyse avec remplaçant ; lasagnes et pizza aux légumes données à titre indicatif | sans suite possible |
