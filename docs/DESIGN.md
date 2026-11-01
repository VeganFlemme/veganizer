# Veganizer — charte de design (V1)

Direction validée par Matt le 2026-11-01 : « Toutes les données, avec scores et vainqueurs » (version 5 des maquettes).
Maquettes de référence : `docs/design/maquettes/` (`fin-home`, `fin-compare` pour le téléphone ; `fin-desktop` est remplacée par le § 4 bis « Ordinateur », suite V1, S24d). Ces fichiers servent à lire la structure, les styles et les textes ; ils ne s'ouvrent pas tels quels dans un navigateur. Les valeurs « [valeur] » des maquettes sont des emplacements : le site affiche les vraies données de la base.

## 1. Principes

1. **Tout est visible.** Chaque catégorie a son onglet avec toutes ses données. Rien n'est caché derrière une note globale.
2. **Face-à-face.** Le plat animal est toujours à gauche et en orange ; la version végétale à droite et en vert. Même ordre et mêmes couleurs partout (titres, barres, tableaux, scores).
3. **Un vainqueur par catégorie, et la preuve à côté.** Score et vainqueur sont toujours accompagnés de la phrase qui dit sur quoi ils reposent (« Gaz à effet de serre. Les 15 autres indicateurs… »).
4. **Honnêteté visible.** « Donnée manquante » écrit en clair, jamais 0. « Avantage au plat animal » montré quand c'est le cas, avec la solution (CLAUDE.md, règle 3). Fourchettes et couverture < 95 % signalées.
5. **Une seule police, une seule idée forte.** Le caractère vient de la typographie (gros chiffres serrés) et du face-à-face, pas de la décoration : ni dégradé, ni emoji, ni illustration superflue.
6. **Jamais le mot « vegan » ou « végétalien » comme étiquette d'un plat** (CLAUDE.md, règle 10) : « version végétale ».

## 2. Jetons

### Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `ground` | `#EEF2EF` | fond de page |
| `surface` | `#FFFFFF` | panneaux, cartes, barre d'onglets |
| `ink` | `#0F2724` | texte principal, bandeau sombre, onglet actif |
| `ink-2` | `#3E5550` | texte secondaire |
| `ink-3` | `#55696A` | légendes, « donnée manquante » (5,1:1 sur `ground`) |
| `line` | `#D5DEDA` | séparateurs forts, en-têtes de tableau |
| `line-soft` | `#E3EAE6` | lignes de tableau |
| `track` | `#DDE7E2` | fond des sélecteurs segmentés clairs, encadré médical |
| `animal` | `#D9662B` | **série « plat animal »** : barres, pastilles, scores |
| `plant` | `#0E8A74` | **série « version végétale »** : barres, pastilles, scores |
| `plant-on-dark` | `#3FC1A3` | pastille végétale et bouton principal sur fond `ink` |
| `action` | `#0B6E5D` (survol `#08513F`) | boutons et liens sur fond clair (6,2:1 avec du blanc) |
| `win-plant-bg` | `#E1F0EA` | fond du badge vainqueur végétal |
| `win-animal-bg` | `#FBEDE4` | fond du badge vainqueur animal, encadré « Là où le plat animal fait mieux », classement CIRC |
| `animal-note` | `#8A4A1E` | petit texte dans les zones `win-animal-bg` |
| `on-dark-1` / `on-dark-2` / `on-dark-3` | `#DCEBE5` / `#C8DCD5` / `#B9D9CF` | textes sur le bandeau `ink` |

Règles :
- `animal` + `plant` ont passé le validateur de palette (daltonismes : ΔE 8,9 ; vision normale : 25,3 ; contraste ≥ 3:1 sur blanc). Ne pas les changer sans relancer la vérification.
- **Le texte ne prend jamais la couleur d'une série** : valeurs et libellés en `ink`, l'identité vient de la pastille ou de la barre à côté.
- Tous les couples texte/fond ≥ 4,5:1 (3:1 au-delà de 24 px) : vérifier chaque nouveau couple.

### Typographie

Une seule famille : **Schibsted Grotesk** (Google Fonts, poids 400 à 900), chargée avec `next/font/google`, repli `system-ui, sans-serif`.

| Rôle | Taille / poids / approche |
|---|---|
| Chiffre héros (verdict, « −87 % ») | 56–72 px, 800, `letter-spacing: -0.05em`, interligne 0,9 |
| Titre de plat (h1) | 30 px mobile, 52 px ordinateur, 800, `-0.03em` à `-0.04em` |
| Nom de l'alternative | 22 px mobile, 32 px ordinateur, 700 |
| Titre de section / carte | 17–19 px, 800, `-0.01em` |
| Texte courant | 15–16 px, 400–600, interligne 1,5 |
| Légende, source | 12–13 px, `ink-3` |

- Chiffres proportionnels partout, y compris dans les tableaux (les chiffres tabulaires élargissaient la virgule, relecture du 2026-11-01) ; colonnes alignées à droite. Une valeur et son unité ne se coupent jamais (`white-space: nowrap` sur chaque valeur).
- Pas de libellés en majuscules, pas de police à chasse fixe.
- Nombres au format français : virgule décimale, espace insécable avant `%` et les unités.
- **Une seule règle d'arrondi par unité, partout** (décision de Matt, 2026-11-01) : kg CO₂e et euros avec 2 décimales (« 0,65 », « 1,20 », « 1,00 » ; « < 0,01 » pour une valeur non nulle plus petite) ; toutes les autres unités (nutriments compris) avec 3 chiffres significatifs. Fonctions `formatForUnit` (`lib/format.ts`) et `roundForUnit` (`lib/scoring/ranges.ts`), la même règle sert aux égalités du score. Animaux épargnés du simulateur : « au moins 0,03 animal épargné » (2 chiffres significatifs, arrondi vers le bas, estimation basse).

### Formes et espacements

- Rayons : 22 px (panneau verdict), 20 px (panneaux), 18 px (cartes), 14 px (sélecteurs), 12 px (boutons, badges), 999 px (pastilles, onglets), **4 px aux extrémités extérieures des barres**, bord droit au centre.
- Marges : 20 px sur téléphone, 32 px de 768 à 1 439 px, 48 px dès 1 440 px ; conteneur max 1 440 px (S24d).
- Ombres : carte `0 1px 0 rgba(15,39,36,0.06)` ; panneau flottant `0 1px 0 rgba(15,39,36,0.06), 0 18px 36px -20px rgba(15,39,36,0.45)`. Rien d'autre.
- Zones tactiles ≥ 44 px.

## 3. Composants (`components/ui/`)

| Composant | Rôle et règles |
|---|---|
| `Logo` | Cercle coupé verticalement, moitié gauche `animal`, moitié droite `plant`, 2 px d'écart ; mot « veganizer » en minuscules, 800, `-0.03em`. SVG : `<path d="M13 1.04A13 13 0 0 0 13 26.96z"/>` et `<path d="M15 1.04A13 13 0 0 1 15 26.96z"/>` (viewBox 28). |
| `SiteHeader` | Bandeau `ink` : logo, recherche, partage (téléphone : boutons icône 44 px avec `aria-label`). |
| `DishTitle` | Pastille `animal` + nom du plat ; pastille `plant-on-dark` + nom de l'alternative. |
| `ChipGroup` | Boutons-étiquettes à la largeur de leur texte (`aria-pressed`) : alternative (« Fait maison » / « Du commerce » ou alternatives d'un aliment), version (« Version de base » / « Version complétée », `?vue=complete`), unité. Remplace les boutons segmentés étirés. |
| `TabBar` | `role="tablist"`, onglets `role="tab"` + `aria-selected`, collante en haut, défilement horizontal sur téléphone. Ordre : Vue d'ensemble, Nutrition, Santé, Environnement, Protection animale, Économie. URL : `?onglet=nutrition` (partageable, rendu statique conservé). |
| `VerdictPanel` | « X sur 5 » + phrase + barre de 5 segments (couleur du vainqueur, gris `line` pour égalité ou données insuffisantes) + légende + phrase de méthode. |
| `CategoryCard` | Bouton entier vers l'onglet ; titre, `WinnerBadge`, `ScorePill`, une donnée clé en face-à-face, phrase de base. |
| `WinnerBadge` | Pastille + « Version végétale » / « Plat animal » / « Égalité » / « Données insuffisantes », suffixe « , provisoire » si la règle le demande (§ 5). |
| `ScorePill` | `● a – v ●` (pastille `animal` à gauche, `plant` à droite) + `aria-label="Indicateurs gagnés : plat animal a, version végétale v"`. |
| `FaceToFaceBar` | Deux barres qui partent d'un axe central (écart 2 px), animal à gauche, végétal à droite, épaisseur 8 à 18 px (≤ 24), valeurs aux extrémités extérieures en `ink`. Chaque ligne a sa propre échelle, sauf mention « même échelle pour toutes les lignes ». Valeur manquante : pas de barre, « donnée manquante ». |
| `DataTable` | Trois colonnes : indicateur, plat animal, végétal. En-tête avec pastilles. Note sous la ligne si couverture < 95 % ou avantage animal. |
| `UnitSwitch` | Par portion / pour 100 kcal / pour 10 g de protéines (règle 4). |
| `CategoryNav` | Dès 1 280 px : les catégories en colonne de gauche, fixe au défilement, avec score et vainqueur de chacune (même état et même `?onglet=` que la `TabBar`). |
| `MiniBars` | Barres face-à-face dans une cellule de tableau (colonnes riches dès 1 440 px). |
| `AnimalBetterBox` | Fond `win-animal-bg` : dans chaque onglet, seulement les points **de cette catégorie** où le plat animal fait mieux (« Là où le plat animal fait mieux en nutrition »…) + la solution sourcée (`data/conseils.json`) ; absent s'il n'y en a aucun. `AnimalBetterSummary` : récapitulatif groupé par catégorie sur la vue d'ensemble. |
| `Simulator` | Fond `ink` : fréquence (1×/mois, 1×/sem., 2×/sem.) × durée (1, 5, 10 ans) → kg CO₂e, coût climat (valeur de l'année de référence 2025), « au moins N animal épargné ». |
| `MissingValue` | « donnée manquante », italique, `ink-3`. |
| `MedicalNote` | Fond `track` : « Informations générales, pas un conseil médical… » (règle 6). |
| `SourcesFooter` | Sources de la page + liens Méthodologie, Signaler une erreur, Télécharger les données. |

## 4. Pages

### `/compare/[slug]`
1. `SiteHeader`, `DishTitle`, barre d'outils (`ChipGroup` alternative + version) dans le bandeau `ink`. Sur ordinateur, le `VerdictPanel` est dans le bandeau, à droite.
2. `TabBar` collante.
3. **Vue d'ensemble** : `VerdictPanel` (téléphone), 5 `CategoryCard` dans l'ordre des onglets, `Simulator`.
4. **Onglet détaillé** : bandeau vainqueur (`WinnerBadge` + `ScorePill` + phrase de base) puis toutes les données de la catégorie :
   - Nutrition : `UnitSwitch` + `DataTable` des nutriments du score et principaux (énergie, protéines, lipides, AGS, glucides, sucres, fibres, sel, fer, calcium, zinc, B12, iode, vitamine D, B2, oméga-3 ALA, oméga-3 EPA + DHA), puis « Tous les constituants Ciqual (N) » dans une section repliable (`<details>`, fermée par défaut, rien n'est supprimé) + `AnimalBetterBox`. Une teneur « < x » de Ciqual s'affiche en fourchette.
   - Santé : classement CIRC par ingrédient, avec le nom de l'aliment et les grammes par portion (« 20 g de lardon fumé (viande transformée, groupe 1) et 125 g de bœuf (viande rouge, groupe 2A) par portion », aussi sur la carte de la vue d'ensemble) (« le classement indique la solidité des preuves, pas l'ampleur du risque ») + repères PNNS, HENI, EAT-Lancet (« à venir » tant que non sourcés) + `MedicalNote`.
   - Environnement : chiffre héros CO₂e + `FaceToFaceBar`, CO₂e par unité (3 lignes), tableau des 16 indicateurs Agribalyse, DQR, couverture, valeurs négatives telles que publiées.
   - Protection animale : chiffre héros + tableau (animaux tués, jours de vie, heures de douleur par intensité, poissons tués).
   - Économie : coût climat de l'année de référence unique (2025, valeur de l'action pour le climat) en face-à-face, prix en magasin (par portion, pour 10 g de protéines).
5. Ordinateur : contenu à gauche (`flex: 999 1 560px`), colonne à droite (bandeau vainqueur, `AnimalBetterBox`, `MedicalNote`) qui passe dessous sur petit écran.
6. `SourcesFooter`.

### Accueil
Bandeau `ink` (titre, phrase, recherche), carte « verdict » d'une paire mise en avant qui chevauche le bandeau, liste des paires vérifiées en face-à-face (même échelle), encart « Analyser ma recette », pied de page.

### `/recette`, `/aliment/[code]`, `/methodologie`, `/sources`
Mêmes jetons et composants. `/aliment/[code]` porte le badge « Comparaison simplifiée » ; `/recette` le badge « Ta recette ».

## 5. Scores et vainqueurs (méthode V1)

**Calcul dans `lib/scoring/` (fonctions pures, testées avant le code), jamais en dur dans les composants.**

- Pour chaque catégorie, une liste d'indicateurs et un sens (`lower_is_better` ou `higher_is_better`), dans un fichier versionné et sourcé : `data/score_rules.json`.
- Un indicateur compte un point pour le plat qui fait mieux à l'unité affichée (par portion par défaut), **seulement si les fourchettes des deux plats ne se chevauchent pas** (bornes arrondies comme à l'affichage). Fourchettes qui se chevauchent ou valeurs égales après arrondi : « égalité », aucun point. Une teneur « < x » de Ciqual compte de 0 à x (jamais x/2).
- Par portion, les **ingrédients strictement identiques des deux côtés** (même code, mêmes grammes par portion) ne comptent pas dans la couverture du verdict : leur contribution s'annule. Les totaux affichés gardent leur couverture réelle et l'avertissement < 95 %.
- Valeur manquante d'un côté ou de l'autre : l'indicateur **n'est pas compté**, et la page affiche « x indicateurs comparés sur y ».
- Vainqueur de la catégorie = plus de points ; égalité = « Égalité » ; aucun indicateur comparable = « Données insuffisantes ».
- **« provisoire »** seulement quand les indicateurs non comptés pourraient inverser le vainqueur (décision de Matt, 1er novembre 2026, 17 h 40). Protection animale : gagnée par la version végétale sans « provisoire » quand elle ne contient aucun ingrédient animal identifié et que le plat animal en contient au moins un (`ScoreCategoryRule.vegetalCannotBeWorse`).
- Verdict global = nombre de catégories gagnées par chaque plat (« 4 sur 5 »). Pas de note pondérée en V1.

Indicateurs de départ (à faire valider par un·e diététicien·ne et une personne experte en ACV, session des retours d'experts) :

| Catégorie | Indicateurs et sens | Justification à citer |
|---|---|---|
| Nutrition | protéines ↑, fibres ↑, sel ↓, acides gras saturés ↓, sucres ↓ ; fer, calcium, zinc, vitamine B12, iode, vitamine D, vitamine B2 ↑ ; oméga-3 : ALA ↑ et EPA + DHA ↑ (deux indicateurs, comme les références ANSES). Énergie : affichée, **non comptée**. | Composantes du Nutri-Score (Santé publique France) pour les cinq premiers ; références nutritionnelles de l'ANSES pour les micronutriments. Vérifier et citer les pages. |
| Santé | ingrédients classés groupe 1 par le CIRC ↓, groupe 2A ↓ ; plus tard repères PNNS et HENI. | CIRC vol. 114. |
| Environnement | les 16 indicateurs Agribalyse, chacun ↓ (le score unique EF est affiché, **non compté**, pour ne pas compter deux fois). | Agribalyse 3.2. |
| Protection animale | animaux tués ↓, jours de vie en élevage ↓, heures de douleur (4 intensités) ↓, poissons tués ↓. | FAOSTAT, Agreste, Welfare Footprint, Fishcount. |
| Économie | prix en magasin ↓, coût climat pour la société ↓ (année de référence unique). | Open Prices / RNM, France Stratégie. |

Option écartée pour la V1 (à rediscuter) : une note sur 10 par catégorie, fondée sur la position du plat parmi tous les plats de la base (percentile). Plus fine, mais plus longue à construire et à expliquer.

## 6. Accessibilité et finitions

- Onglets clavier (flèches gauche/droite, `Home`/`End`), focus visible : `outline: 2px solid #0B6E5D; outline-offset: 2px`.
- Chaque graphique a son équivalent en tableau ou en texte ; aucune information portée par la couleur seule (pastilles + libellés).
- `prefers-reduced-motion` respecté ; un seul mouvement possible : apparition du verdict.
- Rendu vérifié en 375 px et 1 280 px (captures Playwright jointes aux PR).

## Formulations imposées (décisions de Matt, 2026-11-01)
- Nombre d'animaux par portion : « Au moins 1 animal tué pour N portions (estimation basse) », partout (cartes, tableaux, partages). Ne jamais écrire « ≈ 1 pour N portions ».

## 4 bis. Ordinateur (suite V1, S24d, 2026-11-01)

Sur ordinateur, une mise en page de tableau de bord ; **le téléphone ne change pas**, sauf les corrections valables partout.
- **En-tête** : titre (taille adaptée à la longueur, `text-wrap: balance`, pastille sur la première ligne), barre d'outils (alternative, version), verdict compact à droite (dès 1 024 px).
- **Navigation** : dès 1 280 px, `CategoryNav` à gauche (200 px), fixe ; la `TabBar` reste en dessous de 1 280 px.
- **Vue d'ensemble** : dès 1 024 px, chaque carte montre 3 ou 4 indicateurs en barres face-à-face ; grille de 3 colonnes dès 1 280 px, simulateur dans la grille ; à 1 440 × 900, les 5 scores visibles sans défiler (test e2e).
- **Onglets** : colonne de droite fixe (vainqueur, « Là où le plat animal fait mieux » avec conseils repliés sur leur première phrase) ; tableaux riches dès 1 440 px (écart, barre, couverture et DQR, source) ; Nutrition : les trois bases côte à côte dès 1 280 px.
- **Recettes** : côte à côte, alignées ligne par ligne, remplacements mis en évidence ; version complétée : recette végétale entière (grammes pour la recette et par portion, raison de chaque ajout), bouton « Copier la liste des ingrédients ».
- **Mention médicale** en bas du contenu. **Pages texte** (`/methodologie`, `/sources`) : sommaire fixe à gauche, lignes d'environ 70 caractères. **Accueil** : catalogue en 3 colonnes (4 dès 1 920 px), recherche large. **`/recette`** : saisie à gauche, remplacements à droite, comparaison complète en dessous.
- **`/aliment/[code]`** : même `PairView` que les plats (un ingrédient, 100 g), alternatives en `ChipGroup`.
