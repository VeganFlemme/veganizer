# Veganizer — feuille de route V1

À placer dans `docs/ROADMAP.md`. Claude Code exécute les sessions **dans l'ordre**, en autonomie, en respectant `CLAUDE.md` (règles absolues 1 à 12) à chaque étape.

## Règles de travail en autonomie

1. **Quatre lots, quatre pull requests.** Une branche par lot (`roadmap/lot-a` à `roadmap/lot-d`), créée depuis `main` à jour, et une PR **en brouillon** ouverte dès le début du lot. Chaque session = un ou plusieurs commits préfixés `[S12]`, `[S13]`… Pousse après chaque session pour que la prévisualisation Vercel se mette à jour.
2. **Ne jamais fusionner toi-même**, jamais de force push, jamais modifier une migration déjà appliquée (nouvelle migration seulement, additive).
3. Avant chaque commit : `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:pipeline` (et `npm run test:db` si le schéma change). Tout doit passer.
4. **Décisions** : si une session demande un choix qui n'est pas une donnée (formulation, ordre d'affichage…), prends l'option la plus prudente et la plus factuelle, note-la dans `docs/A_VERIFIER.md` (case à cocher, avec l'alternative) et continue. Ne t'arrête pas pour ça.
5. **Sources** : si une source est inaccessible ou si son format a changé, **ne remplace jamais par une valeur trouvée ailleurs** : mets la ligne à jour dans `TODO_SOURCES.md`, saute ce point et passe au suivant. Tu ne t'arrêtes complètement que si toute une session est impossible.
6. Après chaque import : résumé (lignes, valeurs manquantes, 5 exemples) et une vérification à la main, copiés dans la description de la PR.
7. Ne lis jamais `.env` ni `.env.local`, n'affiche jamais une clé.
8. Fin de lot : passe la PR en « prête », écris dans sa description un résumé par session, la liste des points ajoutés à `A_VERIFIER.md` et `TODO_SOURCES.md`, puis donne le lien de la PR et **arrête-toi**. Le lot suivant ne commence qu'après la fusion par l'humain.

---

## Lot A — Données et corrections (sessions 12 à 14)

### S12 — Santé
- Repères PNNS adultes (Santé publique France, 2019) : viande hors volaille, charcuterie, poisson, légumineuses, par semaine. Uniquement depuis le document officiel ; sinon TODO.
- Repères EAT-Lancet 2025 (The Lancet, Commission EAT-Lancet 2.0) : apports de référence par groupe d'aliments, avec licence.
- HENI (Stylianou, Fulgoni, Jolliet, Nature Food 2021, données supplémentaires) : minutes de vie en bonne santé par catégorie. Vérifier la licence ; si usage non commercial → `commercial_use = false` et badge « usage non commercial ».
- Affichage : position du plat par rapport aux repères (« x % du repère hebdomadaire »), jamais de conseil médical, renvoi vers un professionnel de santé.

### S13 — Prix réels
- Source principale : RNM / FranceAgriMer (prix au détail, au kg) pour les catégories des recettes (viandes, poisson, œufs, fromages, tofu, légumineuses sèches, céréales, légumes).
- Complément : Open Prices + quantités Open Food Facts (ODbL : partage à l'identique et citation).
- Afficher prix par portion, par 100 kcal et par 10 g de protéines, avec la date et le lieu des relevés. Donnée manquante ≠ 0.

### S14 — Corrections et cohérence
- Page introuvable : renvoyer un vrai statut HTTP 404.
- Coût climat : une seule année de référence de la valeur carbone (VAC) partout, affichée.
- Conseil vitamine B2 : reprendre mot pour mot la population citée par l'ANSES (avis 2019-SA-0118), vérifier dans le PDF de l'avis.
- Aliments 24048 et 42000 : reclasser selon la règle 10 (si présence d'ingrédients animaux probable sans preuve → `mixte` ou note), documenter dans `docs/DECISIONS.md`.
- Formulations « 1 animal pour N portions » et « animaux épargnés » : proposer une formulation claire et prudente, la noter dans `A_VERIFIER.md`.
- **Pilier Animaux, suites de la session 11 (PR #12)** :
  - Produits laitiers : ne plus appliquer les jours de vie « par kg de lait » au poids d'un fromage, d'un beurre ou d'une crème. Soit des coefficients officiels d'équivalent lait (kg de lait par kg de produit, source publique avec page citée : CNIEL, FranceAgriMer, Agreste…), soit « donnée manquante » pour ces produits. Le lait liquide et les yaourts gardent la valeur actuelle.
  - Œufs et lait, nombre d'animaux tués : décision de Matt = **pas de facteur pour l'instant**, « donnée manquante » assumée et expliquée sur `/methodologie`.
  - Douleur des poules rapportée au kg d'œufs : seulement si la durée de ponte ET le nombre (ou la masse) d'œufs par poule sont sourcés avec page exacte ; sinon « donnée manquante ».
  - Veau : la statistique Agreste des veaux « finis produits » est acceptée comme approximation ; l'écrire telle quelle sur `/methodologie`.
  - Douleur du poulet (gênante, pénible, invalidante) : chercher les heures dans le livre Welfare Footprint (chapitre et page exacts). Ne convertir des « jours » en heures que si la source définit explicitement le jour (ex. 16 h éveillées) pour CES données.
- CALNUT : si ciqual.anses.fr est de nouveau accessible, faire l'étape A (compléter Ciqual) ; sinon laisser dans TODO.

---

## Lot B — Catalogue : pouvoir chercher (presque) n'importe quel plat (sessions 15 à 17)

Objectif : la recherche ne doit plus se limiter aux paires publiées. Trois niveaux de fiabilité, **toujours affichés** à l'utilisateur :
- « Paire vérifiée » : recette détaillée ingrédient par ingrédient et relue (5 piliers).
- « Comparaison simplifiée » : plat Ciqual/Agribalyse comparé à une alternative végétale suggérée automatiquement (nutrition et climat ; animaux = « donnée manquante » si non calculable).
- « Ta recette » : calculée à partir des ingrédients saisis par l'utilisateur.

### S15 — Recherche sur tout le catalogue Ciqual / Agribalyse
- Rendre recherchables tous les aliments et plats déjà en base (`foods`), avec recherche tolérante (accents, fautes, synonymes courants : « bolo », « croque »…), via Postgres (`pg_trgm` / `unaccent`) : rien de payant, rien de propre à Vercel.
- Pour chaque plat contenant des produits animaux, proposer **1 à 3 alternatives végétales** prises dans le catalogue, à fonction égale : même groupe/sous-groupe Ciqual ou rôle équivalent, protéines comparables (afficher l'écart), règle 10 respectée (jamais « vegan » par défaut). Les règles de correspondance sont écrites dans un fichier relu (`pipeline/auto_alternatives.csv` ou règles documentées), pas improvisées à l'exécution.
- Page `/aliment/[code]` (ou équivalent) avec le badge « Comparaison simplifiée » et un lien « Proposer une paire vérifiée » (formulaire de signalement existant).
- Comparaison par 100 g, par portion type (si la portion est sourcée, sinon par 100 g seulement), par 100 kcal et par 10 g de protéines.

### S16 — Page `/recette` : « Analyse ta recette »
- L'utilisateur ajoute ses ingrédients (autocomplétion sur les aliments **purs** de `animal_categories.csv`, règle 9), grammes et nombre de portions. Le moteur `lib/scoring` calcule les 5 piliers, avec couverture et fourchettes.
- Bouton « Version végétale » : propose des remplacements ingrédient par ingrédient (viande hachée → lentilles/protéines de soja, crème → crème végétale, etc.) depuis une table de substitutions relue (`pipeline/substitutions.csv`, avec justification nutritionnelle), puis recalcule.
- Fonctionne sans compte ; sauvegarde possible avec un compte (tables `dishes` / `dish_ingredients` existantes, RLS).
- Aucun appel à une IA payante côté serveur.

### S17 — Paires vérifiées en nombre (objectif : 100+)
- Liste des plats prioritaires : les plats composés les plus consommés en France (INCA 3 si accessible, sinon les plats composés de Ciqual), en couvrant tous les moments de repas.
- Recettes de départ : uniquement des sources à licence vérifiée et compatible (ex. jeu « Recettes de chefs pour professionnels » sur data.gouv.fr, annoncé CC BY 4.0 : **vérifier que le producteur est bien METRO France ou autorisé par lui** avant tout usage ; Wikilivres « Livre de cuisine », CC BY-SA : respecter le partage à l'identique). **Jamais** Marmiton, 750g, CuisineAZ ou autre site sans licence ouverte.
- Pour chaque plat : version animale + version végétale maison + version commerce si possible, ingrédients purs, portions réalistes, justification dans `pair_dishes.csv`. Les recettes générées sont marquées « à relire » dans `A_VERIFIER.md` tant qu'un humain ne les a pas validées.
- Ajouter une source à `public.sources` (avec licence) pour chaque base de recettes utilisée, et l'afficher sur `/sources`.

---

## Lot C — Design et expérience utilisateur (sessions 18 et 19)

**Prérequis humain :** maquettes et charte validées par Matt (fichier `docs/DESIGN.md` + liens des maquettes). Si `docs/DESIGN.md` n'existe pas, ne commence pas le lot C : passe au lot D et signale-le.

### S18 — Système de design
- Traduire `docs/DESIGN.md` en jetons Tailwind (couleurs, typographie, espacements, rayons, ombres) dans `app/globals.css`, et en composants réutilisables dans `components/ui/` (bouton, carte, badge source, badge fiabilité « paire vérifiée / comparaison simplifiée / ta recette », badge incertitude, jauge d'écart, onglets, encadré « le plat animal fait mieux », mention « donnée manquante »).
- Logo et favicon originaux (fournis dans `DESIGN.md`) ; supprimer les SVG par défaut de Next.js dans `public/`.
- Contrastes WCAG AA vérifiés pour chaque paire texte/fond ; `prefers-reduced-motion` respecté.

### S19 — Refonte des pages
- **Mobile d'abord** (largeur 375 px), puis tablette et ordinateur.
- `/compare/[slug]` : le verdict se lit en 5 secondes (un chiffre clé par pilier, en clair), puis le détail à la demande (divulgation progressive), puis les sources. L'alternative maison toujours en premier.
- Accueil : recherche d'un plat en premier (résultats groupés par niveau de fiabilité), puis exemples de paires, puis « Analyse ta recette ».
- `/recette` : saisie rapide au pouce, résultat compréhensible sans lire la méthodologie.
- Graphiques cohérents entre pages, avec fourchettes d'incertitude visibles et lisibles sans couleur.
- `/methodologie` et `/sources` : sommaire, ancres, lecture facile.
- Vérification visuelle : captures Playwright de chaque page en 375 px et 1280 px jointes à la PR.

---

## Lot D — Finitions et lancement (sessions 20 et 21)

### S20 — Finitions techniques et légales
- Performances (Lighthouse ≥ 90 sur mobile), accessibilité (axe sans erreur), référencement (titres, descriptions, sitemap, données structurées, images de partage).
- Pages légales : mentions légales (éditeur : **à compléter par Matt**, ne rien inventer), politique de confidentialité (Supabase Auth, signalements d'erreur, recettes enregistrées), conditions d'utilisation, mention « pas de conseil médical ».
- Bandeau cookies seulement si un traceur non exempté est ajouté (sinon aucun).
- Vérifier la taille de la base Supabase (plan Free : 500 Mo) après les imports du lot B ; alerter si > 60 %.

### S21 — Retours des tests et des experts
- Intégrer les retours notés par Matt dans `docs/RETOURS.md` (tests utilisateurs et relecture d'experts). Chaque retour = corrigé, refusé avec raison, ou reporté.

---

## Hors V1 (plus tard, sur décision de Matt)
- Migration vers Cloudflare Workers (`@opennextjs/cloudflare`).
- Remplacement ou vérification des sources `commercial_use = false` ou `null`.
- Liens affiliés Greenweez (règles « affiliation future » de `CLAUDE.md`).
