# Suite V1 — à exécuter d'une traite (décisions de Matt, 2026-11-01)

Lis d'abord CLAUDE.md, docs/ROADMAP.md, docs/DESIGN.md, docs/DECISIONS.md et docs/A_VERIFIER.md. Exécute les étapes 0 à 4 sans attendre Matt entre les étapes, dans cet ordre (ordre mis à jour le 1er novembre à 16 h 50) : 0, 1, 2, 3, **3 quater (affichage sur ordinateur, prioritaire)**, 3 bis, 3 ter, 4.

## Autorisations données par Matt pour toute cette suite

- **Autorisé explicitement** : `supabase db push` (migrations additives), les scripts d'import du pipeline vers la base de production, `gh pr ready` et `gh pr merge --squash --delete-branch` pour les PR de cette suite, et la création de workflows GitHub Actions.
- **Toujours interdit** : force push, modifier une migration déjà appliquée, supprimer des données (dépublier oui, supprimer non), lire ou afficher `.env` et `.env.local`, mettre `SUPABASE_SECRET_KEY` ailleurs que dans `.env.local`.
- Si le système de permissions refuse malgré tout une commande : écris la commande exacte dans `docs/JOURNAL.md` (section « Bloqué par les permissions »), puis continue avec tout ce qui n'en dépend pas.

## Règles d'enchaînement

- Une branche et une PR par étape.
- **Fusionne toi-même une PR seulement si** : la CI est verte ; `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:pipeline`, `npm run test:db` et `npm run test:db:scoring` passent ; les migrations et les imports de l'étape sont appliqués ; l'accueil, une page `/compare` et `/recette` répondent 200 sur la prévisualisation.
- Si une condition échoue : corrige. Si c'est impossible, arrête-toi et résume dans `docs/JOURNAL.md`.
- Une source inaccessible ne bloque jamais la suite : la donnée reste manquante, tu le notes dans `TODO_SOURCES.md` et tu continues.
- **Tiens `docs/JOURNAL.md` à jour** (Matt et sa relectrice le suivent) : à chaque début et fin d'étape, l'heure, ce qui est fait, le lien de la PR et l'état (en cours, fusionnée, bloquée). Commite-le avec chaque PR.

## Étape 0 — Terminer la PR #16 (relecture des lots C et D)

1. `supabase db push`, puis `.venv/bin/python pipeline/pairs.py` et `.venv/bin/python pipeline/substitutions.py`, puis `npm run test:db` et `npm run test:db:scoring`. Compare le tableau « Chiffres clés » de `docs/A_VERIFIER.md` au résumé imprimé par `pairs.py`.
2. Décisions de Matt sur tes questions :
   - Définition de « source de protéines » : acceptée telle que tu l'as écrite.
   - Huile de cuisson ajoutée côté végétal quand le plat animal n'en liste pas : acceptée.
   - Crêpes « du commerce » : presque identiques à la version maison, donc supprime cette variante (dépubliée, pas supprimée).
   - Pizza et croque maison, où le tofu fumé remplace aussi le fromage : accepté.
3. Mentions légales :
   - directeur de la publication = VeganFlemme ;
   - adresse : applique le régime des éditeurs **non professionnels** de la loi pour la confiance dans l'économie numérique (LCEN). Vérifie le texte en vigueur sur Légifrance et cite l'article. Pas d'adresse personnelle publiée ; nom, adresse et contact de l'hébergeur affichés. Si le texte en vigueur ne le permet pas, laisse « [à compléter par Matt] » et explique pourquoi dans `docs/JOURNAL.md`.
4. Suppression automatique des signalements d'erreur de plus de 12 mois : `pg_cron` sur Supabase s'il est disponible sur le plan gratuit, sinon un workflow GitHub Actions mensuel. Explique-le sur `/confidentialite`.
5. Fusionne la PR #16 selon les règles d'enchaînement.

## Étape 1 — S22 : recettes denses en protéines et vue « à protéines égales »

1. **Recettes** : dans chaque version végétale, utilise en priorité la protéine végétale la plus proche du rôle de la viande, pour approcher les protéines du plat animal à portion réaliste, sans dépasser le plafond de +20 % en masse :
   - plats à base de haché (bolognaise, chili, hachis, boulettes, burger, tomates farcies) → protéines de soja texturées (PST) réhydratées ;
   - pièces de viande (steak, rôti, escalope, pot-au-feu, bourguignon, curry, couscous) → seitan ou PST en morceaux, sinon tempeh ;
   - œufs, fromage, poisson → tofu ou autre selon le plat.

   Les PST comptent comme « fait maison ». Un produit n'est utilisé que s'il a des nutriments Ciqual et des impacts Agribalyse ; sinon la recette actuelle est gardée. Lentilles et pois chiches restent quand ils remplacent réellement la viande, jamais comme ajout pour gonfler les protéines. Note chaque changement dans `docs/DECISIONS.md` et mets à jour « Chiffres clés ».
2. **Vue « à protéines égales »** : en haut de `/compare` et de `/recette`, un sélecteur « Portion réaliste » (par défaut) | « À protéines égales », gardé dans l'URL (`?vue=proteines`).
   - La version végétale est mise à l'échelle : facteur = protéines du plat animal / protéines de la version végétale, calculé depuis les données.
   - Onglets, scores, vainqueurs et simulateur sont recalculés. Affiche le facteur et le poids obtenu.
   - L'indicateur Protéines est une égalité par construction : non compté.
   - Le verdict affiche les deux résultats (ex. « −87 % par portion, −82 % à protéines égales »).
3. **`/methodologie`** : explique pourquoi la portion réaliste reste la vue par défaut, pourquoi la vue à protéines égales existe, et la règle de choix des protéines végétales. Cite les besoins et apports moyens en protéines et en fibres uniquement depuis des sources ANSES ouvertes et vérifiées, avec la page.

4. **Ajout de Matt (16 h 07) : encadré « Là où le plat animal fait mieux » par onglet.** Aujourd'hui, le même encadré nutritionnel s'affiche sous tous les onglets (Environnement, Protection animale…), ce qui est incohérent.
   - Chaque onglet de catégorie n'affiche que les indicateurs **de cette catégorie** où le plat animal fait mieux, avec la solution sourcée quand il y en a une. Titre : « Là où le plat animal fait mieux en nutrition », « … en environnement », etc.
   - S'il n'y en a aucun dans la catégorie, l'encadré disparaît. Pas de phrase « ne fait mieux sur aucun point » répétée partout.
   - La vue d'ensemble garde un récapitulatif, regroupé par catégorie.
   - Même règle pour `/recette` et `/aliment/[code]`. Tests d'abord.

## Étape 2 — S23 : compléter les données manquantes

1. **Âges d'abattage manquants** (bovin, vache de réforme, veau, agneau, dinde, canard…) : sources officielles françaises (Idele, Agreste, FranceAgriMer, INRAE, cahiers des charges au BO agri, colonne « produit courant »).
2. **Poissons tués par kg** : Fishcount répond depuis GitHub (issue #11). Crée un workflow manuel (`workflow_dispatch`) qui télécharge les tableaux de poids moyens estimés en artefact, lance-le, puis importe les données. En plus ou à défaut : Mood et al. 2023 (Animal Welfare, accès ouvert) si la licence le permet.
3. **Douleur (Welfare Footprint)** : vérifie quelles espèces ont des données publiées exploitables (porcs, truies, poissons, heures du poulet). Pour les colonnes en jours, ne convertis en heures que si la source définit explicitement le jour (ex. 16 h éveillées). Bovins : seulement si une estimation publiée existe.
4. **CALNUT** : réessaie ciqual.anses.fr ; si le site est accessible, fais l'étape A.
5. **Prix** : étends les correspondances RNM et les rendements de cuisson USDA à tous les ingrédients possibles.
6. **Affichage** : les très petits nombres (animaux par portion) s'affichent « pour 1 000 portions ».
7. **Données encore manquantes** : mets à jour `TODO_SOURCES.md` avec la raison et la source visée pour chacune. Ajoute sur `/methodologie` une section publique « Données manquantes » qui liste ce qui manque et pourquoi.

8. **Pistes supplémentaires ajoutées par Matt (16 h 11)**. Pour chacune : vérifie la source et sa licence, cite la page ; si la piste échoue, la donnée reste manquante.
   - **Fromage, beurre, crème → équivalent lait** : facteurs de conversion techniques de la FAO (*Technical Conversion Factors for Agricultural Commodities*), taux d'extraction lait → produit laitier pour la France ou l'Europe.
   - **Masse d'un œuf** : catégories de poids réglementaires de l'UE (règlement (CE) n° 589/2008 : S, M, L, XL), utilisées comme **fourchette** et non comme valeur unique. Combinée au nombre d'œufs par poule de FAOSTAT, elle donne les kg d'œufs par poule, donc les jours de vie et la douleur des poules par kg d'œufs (seulement si la durée de ponte est aussi sourcée).
   - **Liquides vendus au litre** (huiles, lait, boissons végétales, vin, sauce soja) : masses volumiques de la *FAO/INFOODS Density Database* pour convertir les prix au litre en prix au kg.
   - **Rendements de cuisson des pâtes, du riz, des légumineuses et des pommes de terre** : cherche une table officielle ouverte (FAO/INFOODS, EuroFIR). À défaut, propose dans `docs/A_VERIFIER.md` (sans l'appliquer) une méthode par bilan de matière sèche à partir des teneurs en eau Ciqual cru/cuit.
   - **Prix** : « Prix moyens de vente de détail » de l'INSEE (data.gouv.fr, calculés à partir des relevés de l'indice des prix à la consommation, Licence Ouverte), à vérifier produit par produit (beaucoup de séries sont arrêtées : n'utiliser que les séries récentes, en citant le mois). À ajouter aux prix de FranceAgriMer (RNM) et d'Open Prices. **Pas de collecte automatique sur les sites des supermarchés** : leurs conditions d'utilisation l'interdisent, ils bloquent les robots et un magasin n'est pas représentatif.
   - **CALNUT** : si ciqual.anses.fr est toujours en maintenance, cherche CALNUT sur recherche.data.gouv.fr, où l'ANSES publie désormais la table Ciqual (miroir officiel, pas un contournement).
   - **Fichiers téléchargés par Matt** : s'il y en a dans `~/Downloads` (articles de Mood et al. sur les poissons et leurs suppléments, rapport EAT-Lancet 2025), déplace-les dans `pipeline/raw/fishcount/` et `pipeline/raw/eat-lancet/`, vérifie la licence indiquée dans chaque document, puis importe.
   - **Âges d'abattage** : publications de l'Idele (« chiffres clés »), de l'Institut de l'élevage, de l'ITAVI et d'INRAE, en plus des cahiers des charges.
   - **EAT-Lancet et Fishcount** : ne contourne jamais un blocage anti-robots (pas de workflow ni d'autre réseau). Si Matt dépose les fichiers dans `pipeline/raw/fishcount/` ou `pipeline/raw/eat-lancet/`, importe-les ; sinon la donnée reste manquante ou provisoire.

## Étape 3 — S24 : version végétale complétée (compensation automatique des écarts)

Objectif de Matt : montrer que chaque écart où le plat animal fait mieux peut être comblé, et ce que ça change en climat, en prix et pour les autres piliers.

1. **`data/complements.json`** (relu et sourcé) : une liste blanche d'aliments courants ou enrichis présents dans Ciqual **et** Agribalyse. Pour chacun : le ou les nutriments ciblés, la quantité maximale réaliste par portion et la justification ANSES (ex. boisson au soja enrichie en calcium, sel iodé, graines de lin ou noix pour l'ALA, levure alimentaire, aliments enrichis en B12 ou en vitamine D s'ils existent dans Ciqual). Ordre de préférence : aliments courants d'abord, aliments enrichis ensuite.
2. **`lib/scoring/complements.ts`** (fonctions pures, tests d'abord) : pour chaque nutriment compté au score où le plat animal fait mieux, trouve les plus petits ajouts qui comblent l'écart sans dépasser les maxima. Résous tous les écarts ensemble (un ajout peut en combler plusieurs). Ne dépasse jamais une limite supérieure de sécurité de l'ANSES quand elle existe.
3. **Écarts impossibles à combler avec des aliments** (souvent B12, EPA + DHA, vitamine D) : affiche le conseil ANSES déjà présent dans `data/conseils.json` (« complément ou aliment enrichi »), **sans dose** (règle 6), et ne l'ajoute pas au calcul.
4. **Symétrie** : fais de même pour le plat animal, sur les nutriments où la version végétale fait mieux (fibres…), avec la même liste blanche, pour que la comparaison reste équitable.
5. **Affichage** : un troisième choix de vue, « Avec compléments », à côté de « Portion réaliste » et « À protéines égales ».
   - Il montre la liste des ajouts : aliment, grammes, nutriment comblé, source.
   - Onglets, scores, vainqueurs et simulateur sont recalculés (climat, prix…).
   - Verdict du type « même complétée, la version végétale émet x % de CO₂e en moins ».
   - La vue par défaut reste la recette réelle.
6. **`/methodologie`** : la méthode, la liste blanche et ses limites. Selon l'ANSES, les besoins se couvrent sur la journée, pas plat par plat : cite la page.

## Étape 3 bis — S24b : recettes issues des plats officiels (ajout de Matt, 16 h 25)

Objectif : remplacer autant que possible les recettes écrites par l'IA par des compositions officielles.

1. **Recherche** : vérifie si l'ADEME (Agribalyse) ou l'ANSES (Ciqual) publient les recettes, c'est-à-dire les masses d'ingrédients, de leurs plats composés (documentation méthodologique, annexes, Dataverse Agribalyse, data.gouv.fr). Cite la page.
2. **Sinon, faisabilité d'un calcul inverse** : vérifie si le « détail par ingrédient » d'Agribalyse permet de retrouver la masse de chaque ingrédient par kg de plat (contribution de l'ingrédient ÷ impact par kg de cet ingrédient dans Agribalyse, au même périmètre). Teste-le sur 3 plats dont on connaît une recette publiée. Ne l'applique que si l'erreur est faible et documentée ; sinon écris le résultat dans `docs/A_VERIFIER.md` et passe.
3. **Si une composition officielle est disponible** pour un plat animal de nos paires : remplace notre recette animale par cette composition (mise à l'échelle de nos portions), puis dérive les versions végétales par les règles de substitution relues (`pipeline/substitutions.csv` et règles de la S22), en ne remplaçant que les ingrédients animaux. Marque ces paires « recette d'après Agribalyse » sur le site.
4. **Pour les plats sans composition officielle**, garde nos recettes, marquées « recette Veganizer, comparée au plat moyen Agribalyse » (contrôle croisé de l'étape 4).

## Étape 3 ter — S24c : plusieurs alternatives végétales par plat (ajout de Matt, 16 h 46)

Constat : sur 37 versions maison, presque toutes reposent sur le soja (protéines de soja texturées 19 fois, tofu fumé 15, tofu ferme 8). Dans son avis du 24 mars 2025 sur les isoflavones, l'Anses recommande de ne pas servir d'aliments à base de soja en restauration collective et de diversifier avec les légumes secs autres que le soja. Trouve l'avis sur anses.fr et cite-le ; s'il est inaccessible, note-le dans `TODO_SOURCES.md`.

1. **Jusqu'à 3 versions maison par paire**, chacune avec une protéine principale d'une famille différente :
   - `soja` : protéines de soja texturées ou tofu (les recettes actuelles) ;
   - `legumineuse` : lentilles, pois chiches, haricots, pois cassés, fèves… (sans soja) ;
   - `autre` : seitan, protéines de pois… **seulement** si l'aliment existe dans Ciqual et Agribalyse avec nutriments et impacts (règle 11). Sinon, pas de troisième version, et tu le notes dans `docs/A_VERIFIER.md`.
2. **Recettes** : même recette que la version actuelle ; seule la protéine change, sauf si le rôle en cuisine l'impose (raison écrite dans `rationale`). Règle 9, règles de relecture des recettes et version complétée (S24) s'appliquent à chaque version. Modèle de données : une colonne `protein_family` (ou équivalent) dans `pair_dishes.csv`, migration additive, contrôlée par `pairs.py`.
3. **Portions** : à protéines égales, une version aux légumineuses donne une assiette plus grosse. Affiche les grammes et les kcal tels quels. Signale « portion copieuse » seulement si un repère publié existe (portions consommées de l'enquête INCA3, déjà dans `pipeline/raw/inca3`) ; n'invente aucun seuil.
4. **Choix par défaut, jamais selon le score** (sinon on choisirait l'alternative qui fait gagner le végétal). Règle fixe, publiée sur `/methodologie` : la protéine qui joue le même rôle en cuisine (morceaux, haché, tranche, liant… d'après la colonne `replaces`) ; à rôle égal, celle sans soja. Écris le choix et sa raison pour chaque paire (colonne `default_reason`), contrôlés par `pairs.py`.
5. **Affichage** : en mode « Fait maison », des boutons « Lentilles · Soja texturé · Seitan… » dans la barre d'outils créée à l'étape 3 quater, à côté de « Fait maison / Du commerce ». Tout est recalculé : vues (portion, protéines égales, avec compléments), onglets, scores, vainqueurs, simulateur. Choix gardé dans l'URL (`?proteine=…`) pour le partage.
6. **Vue d'ensemble — « Selon l'alternative »** : pour chaque catégorie, avec combien de versions le végétal gagne (« Environnement : la version végétale gagne avec les 3 alternatives »). Si la conclusion change selon l'alternative, dis-le clairement.
7. **Onglet Santé des versions au soja** : une mention sourcée de l'avis de l'Anses sur les isoflavones, sans chiffre et sans conseil médical (règle 6). Même mention sur `/methodologie`.
8. **`/recette`** : propose les familles pour lesquelles une règle de substitution relue existe (`pipeline/substitutions.csv`).
9. **Tests** : `pairs.py` (familles, règle 9, choix par défaut), Vitest pour la sélection, e2e pour le changement d'alternative.

## Étape 3 quater — S24d : affichage sur ordinateur (ajout de Matt, 16 h 46)

Constat (captures à 1 440 et 1 920 px, 1er novembre) : sur ordinateur, la page ressemble à la version téléphone agrandie.
- À 1 920 px, le contenu tient dans une colonne de 1 200 px, avec de grandes marges vides.
- Les cartes de la vue d'ensemble sont surtout vides : 1 ou 2 chiffres chacune.
- Boutons segmentés et onglets en pastilles, comme sur téléphone ; il faut cliquer onglet par onglet pour voir les données.
- Le tableau nutrition montre une seule base à la fois (portion, 100 kcal ou 10 g de protéines).
- Colonne de droite en bloc de texte ; chiffres coupés sur deux lignes (« au moins / 0,03 » dans le simulateur) ; « Au moins 1 animal tué pour 1686 portions » en très gros, sur 3 lignes.

Constat de Matt (captures Safari sur MacBook, page de comparaison simple « Poulet, cuisse… » face à « Seitan, préemballé ») : l'affichage est disproportionné.
- Titre en 52 px sur deux lignes avec un mot seul à la ligne (« four ») ; la pastille de couleur est centrée sur les deux lignes au lieu d'être alignée sur la première.
- Le choix « Seitan / Tempeh / Tofu fumé » est un bouton segmenté étiré sur toute la largeur, avec trois cases énormes et des textes mal alignés.
- Bouton « 100 g / 100 kcal / 10 g prot. » trop gros ; colonne de droite occupée seulement par la mention médicale.
- Lignes du tableau très hautes ; fourchettes identiques affichées (« 79,2 à 79,2 », « 1,71 à 1,71 ») ; « donnée manquante » coupé sur deux lignes ; chiffres qui paraissent trop espacés autour de la virgule (vérifie `tabular-nums` et l'espacement des lettres).

Objectif : sur ordinateur (dès 1 024 px, surtout dès 1 280 px), une mise en page de tableau de bord qui utilise la largeur et montre plus de données d'un coup. **La version téléphone ne change pas**, sauf les corrections valables partout (fourchettes identiques, retours à la ligne, espacement des chiffres).

1. **Largeur** : conteneur jusqu'à 1 440 px, grille de 12 colonnes, marges 48 px dès 1 440 px, texte courant 16 px. Mets à jour `docs/DESIGN.md` (le « conteneur max 1 200 px » et la maquette `fin-desktop` sont remplacés par cette étape).
2. **En-tête plus compact** : titre, alternatives et boutons de vue sur une seule barre d'outils, verdict à droite. Le contenu commence plus haut.
3. **Navigation** : dès 1 280 px, les 5 catégories deviennent une colonne de gauche fixe au défilement, avec le score et le vainqueur de chacune. Même URL (`?onglet=`). Le téléphone garde les onglets horizontaux.
4. **Vue d'ensemble** : les 5 cartes de catégorie visibles sans défiler à 1 440 × 900, de même hauteur. Chacune montre ses 3 ou 4 indicateurs principaux en barres face-à-face, pas un seul chiffre. Le simulateur à côté. Aucune grande zone vide.
5. **Onglets de catégorie** : tableaux avec plus de colonnes : indicateur, plat animal, végétal, écart en %, barre face-à-face, fiabilité (couverture, DQR), source. Dès 1 280 px, les trois bases (par portion, par 100 kcal, par 10 g de protéines) côte à côte au lieu du bouton segmenté. Environnement : les 16 indicateurs en barres.
6. **« Là où le plat animal fait mieux »** : dans la colonne de droite, fixe au défilement. Chaque conseil est replié sur sa première phrase, avec « Lire la suite ».
7. **Recettes** : les versions côte à côte, alignées ligne par ligne (même ingrédient sur la même ligne, ingrédient remplacé mis en évidence).
8. **Chiffres** : une valeur et son unité ne se coupent jamais ; les gros chiffres s'adaptent à la largeur et tiennent sur 2 lignes au plus.
9. **Corrections valables partout** :
   - quand la borne basse égale la borne haute, une seule valeur, sans « fourchette » ;
   - titres longs : taille adaptée à la longueur, coupure équilibrée (`text-wrap: balance`), pastille alignée sur la première ligne ;
   - sélecteur d'alternative en boutons à la largeur de leur texte (comme des étiquettes), pas un bouton segmenté étiré ;
   - boutons de vue compacts ; lignes de tableau plus serrées sur ordinateur ;
   - mention médicale en bas du contenu ou dans le pied de page, pas seule dans une colonne ;
   - sur la page de comparaison simple, la colonne de droite reçoit un résumé utile (écart climat, animaux, prix), sinon le tableau prend toute la largeur.
10. **Autres pages** : la page de comparaison simple (`components/compare/FoodCompare.tsx`, mêmes règles que les pages de plats), accueil (catalogue en grille de 3 ou 4 colonnes, recherche large), `/recette` (saisie à gauche, résultat à droite), `/methodologie` et `/sources` (sommaire fixe à gauche, texte d'environ 70 caractères de large).
11. **Vérification** :
    - captures Playwright à 375, 768, 1 280, 1 440, 1 920 et 2 560 px de l'accueil, de chaque onglet d'une page `/compare`, d'une comparaison simple (poulet face au seitan) et de `/recette` (hors git) ;
    - tests e2e : aucun défilement horizontal, quelle que soit la largeur ; à 1 440 × 900, les 5 scores visibles sans défiler ; aucune valeur coupée sur deux lignes ;
    - un sous-agent « designer », qui ne lit pas le code, relit les captures à 1 440 et 1 920 px et liste ce qui fait encore « téléphone agrandi » ; corrige, puis refais une passe ;
    - téléphone : compare les captures à 375 px avant et après ; toute différence doit être voulue.

## Étape 4 — S25 : relecture automatisée (en dernier, pour relire aussi la version complétée) (remplace les tests humains et la relecture d'experts)

1. **Tests de parcours** : fais tourner `npm run test:e2e` dans la CI, avec un serveur lancé dans le workflow. Parcours, en 375, 1 280 et 1 920 px : chercher un plat avec une faute de frappe, ouvrir chaque onglet, passer de maison à commerce, changer de vue (portion / protéines / avec compléments), utiliser le simulateur, analyser une recette, signaler une erreur.
2. **Visiteurs simulés** : lance 5 sous-agents indépendants, qui ne lisent ni le code ni nos documents, chacun avec un profil : omnivore sceptique, personne de 70 ans sur petit téléphone, personne daltonienne, étudiant pressé, et (ajout de Matt) analyste sur grand écran d'ordinateur qui veut tout comparer d'un coup. Chacun parcourt le site en ligne avec Playwright (captures hors git) et rend la liste de ce qui l'a bloqué ou fait douter.
3. **Experts simulés** : lance 2 sous-agents indépendants.
   - Le premier joue une diététicienne : il relit recettes (y compris la variété des alternatives), portions, `data/conseils.json` et le sens des indicateurs de `data/score_rules.json`.
   - Le second joue un expert en analyse de cycle de vie : il relit l'usage d'Agribalyse, des variantes et du DQR, puis `/methodologie`.
   - Chaque remarque doit citer une source ouverte et vérifiée, sinon elle est rejetée.
4. **Audit des chiffres** : tire au hasard 50 valeurs affichées et compare-les aux fichiers officiels Ciqual et Agribalyse ; recalcule indépendamment 5 plats.
4 bis. **Contrôle croisé des recettes (ajout de Matt, 16 h 21)** : pour chaque plat de nos paires qui existe aussi comme plat composé dans Ciqual/Agribalyse (bœuf bourguignon, lasagnes, hachis parmentier, blanquette, quiche, paella, couscous, chili, tartiflette…), compare notre recette, ramenée à 1 kg et à 100 g, aux valeurs officielles : kg CO₂e/kg, énergie, protéines, lipides et sel pour 100 g. Fais de même pour les versions végétales quand un équivalent végétarien existe. Un écart supérieur à 25 % signale une recette à revoir ; écris le tableau complet dans `docs/RETOURS.md` et affiche-le sur `/methodologie` (« Nos recettes comparées aux plats moyens d'Agribalyse »).
5. Corrige ce qui est justifié. Note chaque remarque dans `docs/RETOURS.md` : corrigée, refusée avec la raison, ou reportée.
6. Sur `/methodologie` et `/a-propos`, écris honnêtement : « relu par des vérifications automatisées et des agents IA indépendants ; pas encore relu par un professionnel de santé ». Retire la mention « bêta » seulement si l'audit des chiffres ne trouve aucune erreur.

## Fin

Écris le bilan final dans `docs/JOURNAL.md` : ce qui est en ligne, les PR, ce qui reste manquant et pourquoi, et les décisions à prendre. Puis arrête-toi.
