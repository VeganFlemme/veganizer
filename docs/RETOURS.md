# Retours de la relecture automatisée (suite V1, étape 4)

Relecture du 1er novembre 2026 sur le build local (version de la branche `roadmap/s25`, avant l'étape 3 quinquies). Sous-agents indépendants : 5 visiteurs simulés (qui ne lisent ni le code ni nos documents), 2 experts simulés (chaque remarque doit citer une source ouverte vérifiée), 1 spécialiste de l'expérience utilisateur. Statut de chaque remarque : **à traiter** (étape 4, après l'étape 3 quinquies), **corrigée**, **refusée** (avec la raison) ou **reportée**.

## Tests de compréhension (5 visiteurs)

| Question | Bonne réponse | Bonnes réponses | Remarque |
|---|---|---|---|
| Q1 Lentilles vertes, bourguignon : moins de CO₂e, de combien ? | Oui, −93 % par portion (5,03 → 0,37 kg) | 5/5 | Plusieurs notent que la portion végétale n'a alors que 18,8 g de protéines contre 48,6 g (masse égale). |
| Q2 Que veut dire « Version complétée » ? | Plat animal inchangé ; version végétale à protéines visées égales (protéine doublée au plus) puis manques comblés par une liste relue ; exemple, pas un conseil | 5/5 (confiance moyenne pour 2) | Le bouton n'est pas expliqué avant le clic ; listes « sauf : … » contradictoires. |
| Q3 Pourquoi des données manquantes ? | Valeur non publiée ou « traces », moins de 95 % de la masse couverte, pas de facteur sourcé ; jamais 0 | 5/5 | Explication trouvée seulement sur `/methodologie`, très longue. |
| Q4 Bourguignon : qui gagne en nutrition, où l'animal fait mieux ? | Plat animal, 5–3 provisoire ; protéines, sel, sucres, fer, zinc (B12 non comptée) | 5/5 | Le sens de « 5–3 » n'est compris qu'en lisant la phrase. |
| Q5 Premier écran en 5 secondes | Plat comparé, verdict 4 sur 5, −88 % CO₂e | 2/5 voient le verdict | Sur téléphone, le verdict est sous la ligne de flottaison ; « 35 protéines sur 35 » incompris ; CO₂e non expliqué. |

## Remarques des visiteurs et du spécialiste UX (regroupées)

| # | Remarque | Qui | Statut |
|---|---|---|---|
| V1 | Scores « 5 – 3 » : côté animal/végétal illisible sans couleur ; « Indicateur(s) » vs « catégories » mélangés | omnivore, senior, daltonien, analyste, UX | à traiter |
| V2 | Économie « gagnée » sans prix : le coût climat recompte le CO₂e | étudiant, omnivore, UX, analyste | à traiter |
| V3 | Protection animale gagnée d'office (0–1, 0–0) dans le « 4 sur 5 » : règle non visible à l'endroit du score | omnivore, étudiant, analyste | à traiter |
| V4 | Version complétée : « sauf : zinc, vitamine B12 » ici, « sauf : zinc » là ; « b12 » en minuscule ; « 4 sur 4 » sans explication | tous | à traiter |
| V5 | Protéine par défaut absurde en cuisine (fines tranches dans un bourguignon, seitan pour le poisson), salée, chère | omnivore, étudiant, analyste, diététicienne | à traiter (3 quinquies / rôle) |
| V6 | Ordre de la liste des protéines incompris (tri au gramme près non dit) ; aucune vue d'ensemble des protéines (CO₂e par option) | omnivore, senior, analyste | à traiter |
| V7 | Faute de frappe « bourguinon » : 0 plat comparé | senior | à traiter |
| V8 | Tableau des recettes complétées cassé à 360 px (défilement horizontal) | senior | à traiter |
| V9 | Premier écran trop chargé, verdict sous la ligne de flottaison sur téléphone | senior, étudiant | à traiter |
| V10 | Jargon non expliqué (CO₂e, DQR, CTUh, eutrophisation, Pt, m³ éq., « provisoire », « fourchette ») ; typo « éq.. » | senior, UX, analyste | à traiter |
| V11 | Valeurs illisibles (10⁻⁸, 0,000647, 0,0383 jour, « 0,03 animal », 231,02 kg) | senior, UX | à traiter |
| V12 | ✓ posés dans les 3 bases et contradictoires ; « ↑/↓ » répétés sur chaque ligne | UX | à traiter (3 quinquies : 2 bases) |
| V13 | Export JSON : `null` pour les nutriments à fourchette, prix publié alors que la page le refuse, `?vue=complete` ignoré, pas d'export sur `/aliment` | analyste | à traiter |
| V14 | Bases mélangées sur `/aliment` (« par portion » vs « pour 100 g ») | analyste, UX | à traiter |
| V15 | Barres des cartes : pas de ✓ ni de sens, une seule borne, % pas sur toutes les lignes | daltonien, analyste, UX | à traiter |
| V16 | Lignes vides ou nulles des deux côtés (douleur, poissons, PNNS 0 g) | UX, analyste | à traiter |
| V17 | Ordre des indicateurs Environnement (ozone en 2e) ; DQR identique répété 20 fois | UX, omnivore, analyste | à traiter |
| V18 | `/recette` : premières suggestions sans données ou parasites, nom écrasé à 375 px, 100 g par défaut non signalés | étudiant, UX | à traiter |
| V19 | `/methodologie` trop longue, mentions internes (« docs/A_VERIFIER.md », « depuis notre environnement ») ; `/sources` sans tri utilisées/non utilisées | omnivore, senior, étudiant | à traiter |
| V20 | Accueil : deux unités dans deux listes, « 4 sur 5 » coupé, page très longue | étudiant, daltonien | à traiter |
| V21 | Petits caractères (11–12 px) et petites cibles tactiles (liens 16 px de haut) | senior | à traiter |
| V22 | Mentions orange « Données partielles » proches de la couleur du plat animal ; gris « égalité » peu contrasté | daltonien | à traiter |

## Remarques de la diététicienne simulée (sources vérifiées dans son rapport)

| # | Remarque | Source citée | Statut |
|---|---|---|---|
| D1 | Classement : produits salés et hors rôle (fines tranches 1,62 g de sel/100 g) ; rôle par sous-groupe Ciqual, sel avant lipides | sante.fr (5 g de sel/j) | à traiter |
| D2 | Fromage « ingrédient principal » remplacé par une protéine sans calcium | ANSES 2019-SA-0118 p. 23 | à traiter |
| D3 | Spécialités type fromage : AGS équivalents, sel ×3, 0 g/j dans les régimes ANSES | ANSES 2019-SA-0118 tab. 8 p. 22 | à traiter |
| D4 | Conseil « Protéines » : analogues de viande contributeurs chez les lacto-ovo, 0 g/j chez les végétaliens | ANSES 2019-SA-0118 p. 24-25 | à traiter |
| D5 | « Protéines : plus = mieux » au-delà des besoins | ANSES Protéines ; CRESS Nutri-Score | à traiter |
| D6 | Qualité des protéines (DIAAS) du seitan | Herreman et al. 2020 | à traiter |
| D7 | Poisson → tofu/seitan : perte d'iode non signalée | ANSES Iode ; 2019-SA-0118 p. 30 | à traiter |
| D8 | Sel iodé ajouté en plus du sel du plat | sante.fr | à traiter |
| D9 | Fer et zinc sans absorption | ANSES fer ; ANSES références 21/02/2025 | à traiter |
| D10 | Sucres totaux pénalisent le lactose | ANSES sucres | à traiter |
| D11 | Trop de soja dans un plat | ANSES 2019-SA-0118 p. 31 | à traiter |
| D12 | Yaourt → dessert soja non enrichi | ANSES 2019-SA-0118 p. 24 | à traiter |
| D13 | Recettes officielles : pain en farine + eau, sans sel | Ciqual 2025 | à traiter |
| D14 | Graines de lin entières | Austria et al. 2008 | à traiter |
| D15 | « environ la moitié » → « au moins la moitié » ; calcium des oléagineux ; références pour adultes | ANSES 2019-SA-0118 p. 23-24, 31 | à traiter |

Points confirmés : textes B12, zinc, vitamine D, EPA + DHA, B2 ; limites de sécurité (zinc 25 mg/j confirmé) ; portions réalistes.

## Remarques de l'expert ACV simulé (sources vérifiées dans son rapport)

| # | Remarque | Source citée | Statut |
|---|---|---|---|
| A1 | Plats officiels : remplaçants comptés avec emballage, supermarché et cuisson alors que « Autres étapes » est gardé (≈ +14 % côté végétal sur le hachis) ; état cru « à l'usine » remplacé par prêt à manger | Tableur 3.2, notice et « Detail etape » | à traiter |
| A2 | Verdict sur valeurs centrales sans incertitude (Agribalyse ne publie pas d'écart-type) | doc.agribalyse.fr, méthodologie ACV | à traiter |
| A3 | 16 indicateurs à poids égal vs pondération EF ; robustesse III | JRC 2018 ; Zampori & Pant 2019 | à traiter |
| A4 | Avertissement ADEME sur l'information du consommateur, revue critique | doc.agribalyse.fr, information des consommateurs | à traiter |
| A5 | DQR : « moins bonne note » vs moyenne pondérée PEF ; DQR publié des plats officiels perdu ; alerte au-delà de 3 | FAQ Agribalyse n° 16 ; Zampori & Pant 2019 | à traiter |
| A6 | Masses 3.0 vs 3.2 : contrôle par ingrédient de l'impact par kg déduit | Change Report AGB 3.2 | à traiter |
| A7 | Phrase fausse : le tableur 3.2 contient les sous-parties du climat par ingrédient | Tableur 3.2 | à traiter |
| A8 | Recettes types : les ingrédients comptent déjà emballage et cuisson ; « un peu surestimé » non démontré | Tableur 3.2 ; FAQ n° 19 | à traiter |
| A9 | Valeurs négatives des sols : explication non sourcée | JRC 2018 (Fazio et al.) | à traiter |
| A10 | LUC négatif : « stockage de carbone » non documenté ; PEF exclut ce stockage | Zampori & Pant 2019 | à traiter |
| A11 | « Eau » = privation AWARE, pas un volume | Zampori & Pant 2019 | à traiter |
| A12 | Avertissement œufs incomplet (produits contenant des œufs) ; quinoa dans `/recette` | Tableur 3.2, notice | à traiter |
| A13 | Toxicité : exposition via l'environnement, pas l'aliment | Tableur 3.2 ; doc.agribalyse.fr | à traiter |
| A14 | Export 3.0 : rediffusion par un tiers ; procédés ecoinvent sous licence | data.gouv.fr ; doc.agribalyse.fr | à traiter |
| A15 | Masse de portion des plats officiels = masses d'entrée « à l'usine » | Tableur 3.2 ; FAQ n° 15 | à traiter (3 quinquies) |
