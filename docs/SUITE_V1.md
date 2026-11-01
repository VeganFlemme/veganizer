# Suite V1 — à exécuter d'une traite (décisions de Matt, 2026-11-01)

Lis d'abord CLAUDE.md, docs/ROADMAP.md, docs/DESIGN.md, docs/DECISIONS.md et docs/A_VERIFIER.md. Exécute les étapes 0 à 4 dans l'ordre, sans attendre Matt entre les étapes.

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
   - **Âges d'abattage** : publications de l'Idele (« chiffres clés »), de l'Institut de l'élevage, de l'ITAVI et d'INRAE, en plus des cahiers des charges.
   - **EAT-Lancet et Fishcount** : si la page bloque l'environnement de travail, essaie le téléchargement par un workflow GitHub Actions manuel (comme pour Fishcount).

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

## Étape 4 — S25 : relecture automatisée (en dernier, pour relire aussi la version complétée) (remplace les tests humains et la relecture d'experts)

1. **Tests de parcours** : fais tourner `npm run test:e2e` dans la CI, avec un serveur lancé dans le workflow. Parcours, en 375 et 1 280 px : chercher un plat avec une faute de frappe, ouvrir chaque onglet, passer de maison à commerce, changer de vue (portion / protéines / avec compléments), utiliser le simulateur, analyser une recette, signaler une erreur.
2. **Visiteurs simulés** : lance 4 sous-agents indépendants, qui ne lisent ni le code ni nos documents, chacun avec un profil : omnivore sceptique, personne de 70 ans sur petit téléphone, personne daltonienne, étudiant pressé. Chacun parcourt le site en ligne avec Playwright (captures hors git) et rend la liste de ce qui l'a bloqué ou fait douter.
3. **Experts simulés** : lance 2 sous-agents indépendants.
   - Le premier joue une diététicienne : il relit recettes, portions, `data/conseils.json` et le sens des indicateurs de `data/score_rules.json`.
   - Le second joue un expert en analyse de cycle de vie : il relit l'usage d'Agribalyse, des variantes et du DQR, puis `/methodologie`.
   - Chaque remarque doit citer une source ouverte et vérifiée, sinon elle est rejetée.
4. **Audit des chiffres** : tire au hasard 50 valeurs affichées et compare-les aux fichiers officiels Ciqual et Agribalyse ; recalcule indépendamment 5 plats.
5. Corrige ce qui est justifié. Note chaque remarque dans `docs/RETOURS.md` : corrigée, refusée avec la raison, ou reportée.
6. Sur `/methodologie` et `/a-propos`, écris honnêtement : « relu par des vérifications automatisées et des agents IA indépendants ; pas encore relu par un professionnel de santé ». Retire la mention « bêta » seulement si l'audit des chiffres ne trouve aucune erreur.

## Fin

Écris le bilan final dans `docs/JOURNAL.md` : ce qui est en ligne, les PR, ce qui reste manquant et pourquoi, et les décisions à prendre. Puis arrête-toi.
