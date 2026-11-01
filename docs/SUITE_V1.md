# Suite V1 — à exécuter d'une traite (décisions de Matt, 2026-11-01)

Lis d'abord CLAUDE.md, docs/ROADMAP.md, docs/DESIGN.md, docs/DECISIONS.md et docs/A_VERIFIER.md. Exécute les étapes 0 à 4 sans attendre Matt entre les étapes, dans cet ordre (ordre mis à jour le 1er novembre à 16 h 50) : 0, 1, 2, 3, **3 quater (affichage sur ordinateur, prioritaire)**, 3 bis, 3 ter, 4. La décision de Matt de 17 h 25 (section suivante) s'applique à toutes les étapes restantes.

## Autorisations données par Matt pour toute cette suite

- **Autorisé explicitement** : `supabase db push` (migrations additives), les scripts d'import du pipeline vers la base de production, `gh pr ready` et `gh pr merge --squash --delete-branch` pour les PR de cette suite, et la création de workflows GitHub Actions.
- **Toujours interdit** : force push, modifier une migration déjà appliquée, supprimer des données (dépublier oui, supprimer non), lire ou afficher `.env` et `.env.local`, mettre `SUPABASE_SECRET_KEY` ailleurs que dans `.env.local`.
- Si le système de permissions refuse malgré tout une commande : écris la commande exacte dans `docs/JOURNAL.md` (section « Bloqué par les permissions »), puis continue avec tout ce qui n'en dépend pas.

## Règles d'enchaînement

- Une branche et une PR par étape.
- **Fusionne toi-même une PR seulement si** : la CI est verte ; `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:pipeline`, `npm run test:db` et `npm run test:db:scoring` passent ; les migrations et les imports de l'étape sont appliqués ; l'accueil, une page `/compare` et `/recette` répondent 200 sur la prévisualisation.
- Si une condition échoue : corrige. Si c'est impossible, arrête-toi et résume dans `docs/JOURNAL.md`.
- Une source inaccessible ne bloque jamais la suite : la donnée reste manquante, tu le notes dans `TODO_SOURCES.md` et tu continues.
- Pour les heures du journal, utilise l'heure réelle (`TZ=Europe/Paris date +%H:%M`) : certaines heures étaient en avance d'environ 40 minutes.
- **Tiens `docs/JOURNAL.md` à jour** (Matt et sa relectrice le suivent) : à chaque début et fin d'étape, l'heure, ce qui est fait, le lien de la PR et l'état (en cours, fusionnée, bloquée). Commite-le avec chaque PR.

## Décision de Matt (17 h 25) : uniquement de la comparaison automatique, à partir des bases

Aucun humain n'a relu nos paires : le mot « vérifiée » est faux et doit disparaître. Ce que Veganizer propose, c'est l'interrogation des bases officielles, rien d'autre.

1. **Plus de « Paire vérifiée »** nulle part : site, métadonnées, textes, `/methodologie`, `/a-propos`. Toutes les pages portent la même mention : « Comparaison automatique d'après Ciqual et Agribalyse · Méthode ». `/methodologie` dit honnêtement comment les recettes types ont été écrites (par une IA, puis contrôlées par des règles et des tests automatiques).
2. **Le visiteur choisit la protéine de remplacement.** Sur chaque comparaison (plat ou aliment), une liste de protéines végétales du catalogue : protéines de soja texturées, tofu, tempeh, seitan, lentilles, pois chiches, haricots, produits du commerce (haché végétal, galettes…), etc.
   - Seuls les aliments sans ingrédient animal identifié (règles 9, 10 et 11), avec nutriments et impacts, sont proposés.
   - **Classement par proximité, calculé seulement à partir des données** : même rôle dans le repas d'abord, puis protéines pour 100 g les plus proches, puis lipides et énergie. Écris la formule sur `/methodologie` et affiche la raison du classement (« la plus proche en protéines »). Jamais de classement selon le CO₂e, le prix ou le score.
   - Le premier de la liste est affiché par défaut. Le choix est gardé dans l'URL (`?proteine=<code>`).
3. **Règle de remplacement unique, sans recette écrite à la main** : l'ingrédient animal principal est remplacé par la protéine choisie à masse égale dans la version de base, et à protéines égales dans la version complétée (étape 3 quater). Les autres ingrédients animaux (beurre, crème, lardons, fromage, bouillon…) sont remplacés par les règles relues de `pipeline/substitutions.csv`. Les ingrédients végétaux ne changent pas.
4. **Plats animaux** : dès que l'étape 3 bis trouve une composition officielle (Agribalyse), elle remplace notre recette. Sinon, la recette reste, marquée « recette type rédigée par Veganizer », avec un lien « Modifier cette recette » qui ouvre `/recette` déjà remplie. Si Ciqual et Agribalyse contiennent un plat végétal entier équivalent (chili sin carne, steak végétal…), il apparaît aussi dans la liste de choix.
5. **Conséquences** :
   - le bouton « Fait maison / Du commerce » disparaît, car les produits du commerce sont dans la liste de choix ;
   - les versions maison écrites à la main (`pairs.csv`, variante `maison`) ne servent plus que de recettes types pour le plat animal ;
   - l'étape 3 ter est remplacée par cette décision (voir son nouveau texte).

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
2 bis. **Source trouvée par la relectrice (18 h 15) : les masses des recettes Agribalyse existent en données ouvertes.** Sur data.gouv.fr, le jeu « Agribalyse » (https://www.data.gouv.fr/fr/datasets/agribalyse/, Licence Ouverte 2.0) est une rediffusion de la base Agribalyse **3.0 complète**, exportée depuis openLCA : une archive 7z d'environ 24 Mo (tables CSV) et un xlsx.zip.
   - La table `TBL_EXCHANGES` donne, pour chaque processus, les quantités de chaque intrant par kg de produit. Exemple cité sur la page : la sauce aïoli consomme 728 g d'huile d'olive et 108 g d'ail pour 1 kg.
   - **À faire** :
     - télécharge l'archive dans `pipeline/raw/agribalyse-3.0-openlca/` (si data.gouv.fr bloque, arrête-toi et note-le, sans contournement) ;
     - vérifie l'exemple de l'aïoli ;
     - extrais les recettes des plats composés, avec les masses de chaque intrant par kg ;
     - relie chaque intrant à un code Ciqual par le « LCI Name » d'Agribalyse (et `agribalyse_variants.csv`), et note les intrants non reliés.
   - **Contrôles avant usage** :
     - c'est la version 3.0 et nos impacts sont en 3.2 : n'utilise une recette que si sa liste d'ingrédients correspond à celle du détail par ingrédient 3.2 du même plat ; sinon, exclus le plat et note-le ;
     - teste sur 3 plats : l'impact recalculé à partir des masses 3.0 et des impacts 3.2 doit rester proche de l'impact 3.2 publié du plat (écart documenté) ;
     - cite la source dans `public.sources` (rediffusion communautaire de la base ADEME, version 3.0, Licence Ouverte 2.0).
   - Si ces contrôles passent, applique les points 3 et 5 avec ces masses. Le calcul inverse n'est plus nécessaire.
3. **Si une composition officielle est disponible** pour un plat animal de nos paires : remplace notre recette animale par cette composition (mise à l'échelle de nos portions), puis dérive les versions végétales par les règles de substitution relues (`pipeline/substitutions.csv` et règles de la S22), en ne remplaçant que les ingrédients animaux. Marque ces paires « recette d'après Agribalyse » sur le site.
4. **Pour les plats sans composition officielle**, garde nos recettes, marquées « recette type rédigée par Veganizer, comparée au plat moyen Agribalyse » (contrôle croisé de l'étape 4).
5. **Enrichir le catalogue de plats à partir de la base (demande de Matt, 17 h 27)** : `pipeline/raw/agribalyse_3.2_detail_ingredient.csv` donne la liste des ingrédients de 285 plats composés (dont 117 plats, 45 pizzas, tartes et crêpes salées, 40 sandwichs, 26 soupes et 23 plats végétariens).
   - Chaque plat qui contient un ingrédient animal devient une page de comparaison automatique, avec la règle de remplacement de la décision de 17 h 25 et le choix de la protéine par le visiteur.
   - Le plat animal est affiché avec les valeurs officielles du plat entier : nutriments Ciqual de son code, impacts Agribalyse. Le calcul inverse ne sert qu'à estimer la masse des ingrédients animaux à remplacer, avec une fourchette.
   - Les 23 plats végétariens de la base sont proposés comme alternatives entières, dans la liste de choix, quand ils jouent le même rôle.
   - Si le calcul inverse n'est pas assez précis pour un plat (écart documenté au point 2), exclus-le et note-le dans `docs/A_VERIFIER.md`. N'invente jamais une masse.
   - Les plats sont ajoutés à la recherche et au catalogue de l'accueil, avec le même affichage que les autres.
   - Pas de recettes récupérées sur des sites de cuisine (droits d'auteur, conditions d'utilisation) et pas de nouvelles recettes écrites par l'IA.

## Étape 3 ter — S24c : choix de la protéine par le visiteur (remplace la version de 16 h 46, décision de Matt, 17 h 25)

Mets en œuvre la section « Décision de Matt (17 h 25) » en haut de ce fichier.

1. **Moteur (tests d'abord)** : `lib/scoring/proximity.ts`, fonction pure qui classe les protéines végétales candidates pour un ingrédient animal, avec la raison du classement. `lib/scoring/substitute.ts` applique la règle de remplacement (masse égale en version de base, protéines égales en version complétée), avec `pipeline/substitutions.csv` pour les autres ingrédients animaux.
2. **Données** : la liste des candidates vient de la base (vue ou requête), pas d'un fichier écrit à la main. Contrôle automatique (`pairs.py` ou un nouveau script) : chaque candidate respecte les règles 9, 10 et 11, et chaque plat a au moins 3 candidates de familles différentes (soja, légumineuses, blé…), sinon tu le notes dans `docs/A_VERIFIER.md`.
3. **Affichage** : la liste de choix est dans la barre d'outils de l'étape 3 quater. Elle se déplie, chaque ligne affichant le nom, la raison du classement et les protéines pour 100 g. Tout est recalculé : version de base et version complétée, onglets, scores, vainqueurs, simulateur. Une phrase sous la liste dit pour combien de protéines de la liste le végétal gagne sur le climat (« avec 12 protéines sur 12 »).
4. **Soja** : dans l'onglet Santé, quand la protéine choisie est à base de soja, une mention sourcée de l'avis de l'Anses du 24 mars 2025 sur les isoflavones, sans chiffre et sans conseil médical (règle 6). Trouve l'avis sur anses.fr et cite-le ; s'il est inaccessible, note-le dans `TODO_SOURCES.md`.
5. **Même chose sur les pages d'aliments et sur `/recette`.**
5 bis. **Encadré « Là où le plat animal fait mieux » dans la version complétée (remarque de Matt, 18 h 25)**. Constat en ligne (bourguignon, `?vue=complete&onglet=nutrition`) : seuls les écarts restants sont listés, ce qui est bien (zinc, B12, sucres). Mais :
   - le zinc et la B12 apparaissent deux fois : dans « À couvrir hors de ce plat » et dans l'encadré ;
   - le titre « Là où le plat animal fait mieux » contredit « Écarts comblés par construction » ;
   - « dont sucres » affiche « Pas encore de conseil sourcé pour ce point », un texte provisoire qui fait amateur.

   À faire (tests d'abord) :
   - Dans la version complétée, un seul encadré, « Ce qui reste à couvrir hors de ce plat ». Il liste les manques non comblés (B12, EPA + DHA, vitamine D, zinc si la liste ne suffit pas) avec le conseil Anses déjà présent, sans dose, et le renvoi vers un professionnel de santé. Supprime le doublon.
   - Le libellé de la catégorie Nutrition devient « Écarts comblés, sauf : zinc, B12 » quand il en reste.
   - Les indicateurs où « moins = mieux » (sucres, sel, acides gras saturés…) ne se comblent pas en ajoutant un aliment : affiche-les à part, de façon factuelle, avec les valeurs des deux plats. Ajoute les principaux ingrédients qui y contribuent, calculés à partir de Ciqual (par exemple « surtout carottes et vin »). Plus jamais « Pas encore de conseil sourcé » sur le site : sans conseil sourcé, affiche seulement les faits.
   - Vérifie la même logique dans la version de base et sur les pages d'aliments.
6. **Tests** : Vitest pour le classement et le remplacement, e2e pour le changement de protéine, et un test qui échoue si le texte « vérifiée » réapparaît sur le site.

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
   - **Décision de Matt (17 h 05) : la référence reste le plat tel qu'on le mange.** La vue par défaut et les scores restent ceux de la portion réaliste. Raisons, à écrire sur `/methodologie` : l'Anses recommande 0,83 g de protéines par kg et par jour, et les Français en consomment en moyenne 1,4 g (cite la page Anses « Protéines : rôle, sources et apports recommandés ») ; les références nutritionnelles de l'Anses sont des apports par jour, et pour les protéines l'Anses indique que varier les sources sur la journée suffit (déjà cité dans `data/conseils.json`). N'attribue pas à l'Anses la phrase « pas plat par plat » : elle ne l'écrit pas (tu l'as relevé dans `docs/A_VERIFIER.md`).
   - **Décision de Matt (17 h 12) : un sélecteur dans l'en-tête, pas de lien ni de tableau.** Dans la barre d'outils, un sélecteur : **« Version de base / Version complétée »**. « Version de base » est le choix par défaut, celui des scores actuels.
   - **Version complétée** : le plat animal ne change pas. La version végétale reçoit autant de protéines que lui (protéine principale augmentée, comme la vue « à protéines égales » actuelle) **et** ses autres manques comblés par les ajouts de `data/complements.json` (calcium, zinc, iode, oméga-3…). B12, EPA + DHA, vitamine D : conseil Anses sans dose, comme aujourd'hui.
   - Dans la version complétée, la catégorie Nutrition affiche « écarts comblés par construction » au lieu d'un score, pour rester équitable. Les autres catégories (santé, climat, animaux, prix) sont recalculées et comparées normalement. La symétrie de la S24 (compléter aussi le plat animal) n'est plus utilisée : explique pourquoi sur `/methodologie`.
   - Les vues actuelles « Portion réaliste », « À protéines égales » et « Avec compléments » sont remplacées par ce sélecteur. Explique-le sur `/methodologie`.
   - Dans la version complétée, un encadré liste les ajouts, présentés comme « exemple d'ajouts possibles », jamais comme un conseil (règle 6). Les calories des deux plats sont bien visibles.
   - **Recette complète (demande de Matt, 17 h 12)** : dans la version complétée, le bloc « Recettes » affiche la recette végétale **entière**, prête à cuisiner. Chaque ingrédient y figure avec ses grammes pour la recette et par portion. La protéine augmentée est marquée « quantité augmentée pour autant de protéines », et chaque ajout porte « ajouté pour le calcium », « … pour l'iode », etc. Le plat animal est à côté, ligne par ligne.
   - À la fin de cette recette, une ligne « À couvrir hors de ce plat » liste la B12, l'EPA + DHA ou la vitamine D quand aucun aliment ne les comble : complément ou aliment enrichi, sans dose, avec renvoi vers un professionnel de santé (règle 6).
   - Bouton « Copier la liste des ingrédients ». Pas d'étapes de préparation : nous n'avons pas de source pour les écrire.
   - **Code** : `completedVariant` part de la version à protéines égales (aujourd'hui, il part de la recette réelle). Tests d'abord. Garde le choix dans l'URL (`?vue=complete`).
   - Étape 3 ter : le résumé selon la protéine choisie tient en une seule phrase sous la liste de choix, pas un bloc en plus.
3. **Navigation** : dès 1 280 px, les 5 catégories deviennent une colonne de gauche fixe au défilement, avec le score et le vainqueur de chacune. Même URL (`?onglet=`). Le téléphone garde les onglets horizontaux.
4. **Vue d'ensemble** : les 5 cartes de catégorie visibles sans défiler à 1 440 × 900, de même hauteur. Chacune montre ses 3 ou 4 indicateurs principaux en barres face-à-face, pas un seul chiffre. Le simulateur à côté. Aucune grande zone vide.
5. **Onglets de catégorie** : tableaux avec plus de colonnes : indicateur, plat animal, végétal, écart en %, barre face-à-face, fiabilité (couverture, DQR), source. Dès 1 280 px, les trois bases (par portion, par 100 kcal, par 10 g de protéines) côte à côte au lieu du bouton segmenté. Environnement : les 16 indicateurs en barres.
6. **« Là où le plat animal fait mieux »** : dans la colonne de droite, fixe au défilement. Chaque conseil est replié sur sa première phrase, avec « Lire la suite ».
7. **Recettes** : les versions côte à côte, alignées ligne par ligne (même ingrédient sur la même ligne, ingrédient remplacé mis en évidence).
8. **Chiffres** : une valeur et son unité ne se coupent jamais ; les gros chiffres s'adaptent à la largeur et tiennent sur 2 lignes au plus.
9. **Corrections valables partout** :
   - **Logique du score Protection animale (décision de Matt, 17 h 40)** : quand la version végétale n'a aucun ingrédient animal identifié et que le plat animal en a au moins un, la version végétale ne peut pas faire moins bien sur aucun indicateur animal. Un côté vaut 0 ; l'autre ne peut pas être négatif.
     - La catégorie est donc gagnée par la version végétale, **sans « provisoire »**, même si des valeurs manquent côté animal.
     - Phrase affichée : « La version végétale ne contient aucun ingrédient animal identifié : elle ne peut pas faire moins bien sur la protection animale. »
     - Les valeurs manquantes restent « donnée manquante » : on n'invente aucun chiffre et le nombre d'indicateurs comptés ne change pas.
     - Écris le mot « identifié », jamais « vegan » (règle 10).
   - **Règle générale (`lib/scoring/score.ts`, tests d'abord)** : une catégorie n'est « provisoire » que si les données manquantes **pourraient inverser** le vainqueur. Ce n'est plus seulement une question de part d'indicateurs comparés. Explique-le sur `/methodologie`.
   - quand la borne basse égale la borne haute, une seule valeur, sans « fourchette » ;
   - titres longs : taille adaptée à la longueur, coupure équilibrée (`text-wrap: balance`), pastille alignée sur la première ligne ;
   - sélecteur d'alternative en boutons à la largeur de leur texte (comme des étiquettes), pas un bouton segmenté étiré ;
   - boutons de vue compacts ; lignes de tableau plus serrées sur ordinateur ;
   - mention médicale en bas du contenu ou dans le pied de page, pas seule dans une colonne ;
   - sur la page de comparaison simple, la colonne de droite reçoit un résumé utile (écart climat, animaux, prix), sinon le tableau prend toute la largeur.
10. **Pages d'aliments = même affichage que les pages de plats (décision de Matt, 17 h 21)** : la page `/aliment/[code]` utilise le même rendu que `/compare/[slug]`, comme `/recette` le fait déjà.
    - Même composant `PairView` : vue d'ensemble, onglets Nutrition, Santé, Environnement, Protection animale et Économie, scores, vainqueurs, simulateur, sélecteur « Version de base / Version complétée ».
    - Pour y arriver, construis le modèle avec `buildPairPage`, en traitant chaque aliment comme un plat d'un seul ingrédient. Portion : celle de l'enquête INCA3 pour cet aliment si elle existe, sinon 100 g, et dis laquelle.
    - Les choix d'aliment végétal (seitan, tempeh, tofu…) deviennent la liste de choix classée par proximité de l'étape 3 ter.
    - Une catégorie sans donnée affiche « donnée manquante », jamais 0.
    - Même mention que partout ailleurs : « Comparaison automatique d'après Ciqual et Agribalyse · Méthode » (décision de Matt, 17 h 25).
    - `FoodCompare.tsx` n'est plus utilisé : retire-le une fois la page migrée. Tests : la page aliment affiche les mêmes onglets qu'une paire, et les chiffres par 100 g ne changent pas.
11. **Autres pages** : accueil (catalogue en grille de 3 ou 4 colonnes, recherche large), `/recette` (saisie à gauche, résultat à droite), `/methodologie` et `/sources` (sommaire fixe à gauche, texte d'environ 70 caractères de large).
12. **Vérification** :
    - captures Playwright à 375, 768, 1 280, 1 440, 1 920 et 2 560 px de l'accueil, de chaque onglet d'une page `/compare`, d'une comparaison simple (poulet face au seitan) et de `/recette` (hors git) ;
    - tests e2e : aucun défilement horizontal, quelle que soit la largeur ; à 1 440 × 900, les 5 scores visibles sans défiler ; aucune valeur coupée sur deux lignes ;
    - un sous-agent « designer », qui ne lit pas le code, relit les captures à 1 440 et 1 920 px et liste ce qui fait encore « téléphone agrandi » ; corrige, puis refais une passe ;
    - téléphone : compare les captures à 375 px avant et après ; toute différence doit être voulue.

## Étape 4 — S25 : relecture automatisée (en dernier, pour relire aussi la version complétée) (remplace les tests humains et la relecture d'experts)

1. **Tests de parcours** : fais tourner `npm run test:e2e` dans la CI, avec un serveur lancé dans le workflow. Parcours, en 375, 1 280 et 1 920 px : chercher un plat avec une faute de frappe, ouvrir chaque onglet, changer de protéine de remplacement, passer de la version de base à la version complétée, utiliser le simulateur, analyser une recette, signaler une erreur.
2. **Visiteurs simulés** : lance 5 sous-agents indépendants, qui ne lisent ni le code ni nos documents, chacun avec un profil : omnivore sceptique, personne de 70 ans sur petit téléphone, personne daltonienne, étudiant pressé, et (ajout de Matt) analyste sur grand écran d'ordinateur qui veut tout comparer d'un coup. Chacun parcourt le site en ligne avec Playwright (captures hors git) et rend la liste de ce qui l'a bloqué ou fait douter.
3. **Experts simulés** : lance 2 sous-agents indépendants.
   - Le premier joue une diététicienne : il relit les recettes types, la règle de remplacement, le classement par proximité, les portions, `data/conseils.json` et le sens des indicateurs de `data/score_rules.json`.
   - Le second joue un expert en analyse de cycle de vie : il relit l'usage d'Agribalyse, des variantes et du DQR, puis `/methodologie`.
   - Chaque remarque doit citer une source ouverte et vérifiée, sinon elle est rejetée.
4. **Audit des chiffres** : tire au hasard 50 valeurs affichées et compare-les aux fichiers officiels Ciqual et Agribalyse ; recalcule indépendamment 5 plats.
4 bis. **Contrôle croisé des recettes (ajout de Matt, 16 h 21)** : pour chaque plat de nos paires qui existe aussi comme plat composé dans Ciqual/Agribalyse (bœuf bourguignon, lasagnes, hachis parmentier, blanquette, quiche, paella, couscous, chili, tartiflette…), compare notre recette, ramenée à 1 kg et à 100 g, aux valeurs officielles : kg CO₂e/kg, énergie, protéines, lipides et sel pour 100 g. Fais de même pour les versions végétales quand un équivalent végétarien existe. Un écart supérieur à 25 % signale une recette à revoir ; écris le tableau complet dans `docs/RETOURS.md` et affiche-le sur `/methodologie` (« Nos recettes comparées aux plats moyens d'Agribalyse »).
4 ter. **Expérience utilisateur (ajout de Matt, 18 h 22)**
   - **Toutes les combinaisons de choix** (tests e2e et captures, hors git) : pour 5 plats variés et 2 pages d'aliments, avec les 3 premières protéines de la liste, en version de base et complétée, chaque onglet, à 375, 1 440 et 1 920 px. Vérifications automatiques :
     - jamais « NaN », « undefined », « null » ni carte vide ;
     - chaque valeur a son unité ;
     - le score d'une catégorie est le même partout (verdict, colonne de catégories, carte, onglet) ;
     - changer de protéine ou de version change bien les chiffres concernés, et seulement eux ;
     - l'état se garde dans l'URL (recharger la page redonne la même vue).
   - **Tests de compréhension** : les 5 visiteurs simulés reçoivent des tâches et des questions dont la bonne réponse est connue à l'avance, par exemple :
     - « Avec des lentilles, la version végétale du bourguignon émet-elle moins de CO₂e, et de combien ? »
     - « Que veut dire Version complétée ? »
     - « Pourquoi certaines valeurs sont-elles des données manquantes ? »
     - « Quel plat gagne en nutrition, et sur quels points le plat animal fait-il mieux ? »
     - « Qu'as-tu compris en 5 secondes sur le premier écran ? »
     Note le taux de bonnes réponses par question. Chaque erreur de compréhension entraîne une correction du texte ou de l'affichage, puis une nouvelle passe sur les questions ratées.
   - **Pertinence et lisibilité** : un 6e sous-agent, spécialiste de l'expérience utilisateur et de la visualisation de données, qui ne lit pas le code, relit chaque onglet. Il vérifie :
     - le jargon expliqué (DQR, eutrophisation, Pt, CO₂e…) ;
     - les indicateurs les plus parlants en premier ;
     - des barres face à face à la même échelle, avec le sens « moins = mieux » visible ;
     - des chiffres arrondis lisiblement ;
     - aucune information inutile ou répétée.
   - **Accessibilité** : contrôle automatique (axe-core) au niveau WCAG AA (contrastes, étiquettes, navigation au clavier), plus une simulation des daltonismes sur les captures des barres et pastilles.
5. Corrige ce qui est justifié. Note chaque remarque dans `docs/RETOURS.md` : corrigée, refusée avec la raison, ou reportée.
6. Sur `/methodologie` et `/a-propos`, écris honnêtement : « relu par des vérifications automatisées et des agents IA indépendants ; pas encore relu par un professionnel de santé ». Retire la mention « bêta » seulement si l'audit des chiffres ne trouve aucune erreur.

## Fin

Écris le bilan final dans `docs/JOURNAL.md` : ce qui est en ligne, les PR, ce qui reste manquant et pourquoi, et les décisions à prendre. Puis arrête-toi.
