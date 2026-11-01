# Veganizer — instructions pour Claude Code

## Mission
Veganizer compare **factuellement** un plat contenant des produits animaux et son alternative végétale sur cinq piliers : nutrition, santé, climat/environnement, animaux, coût financier (direct et indirect, individuel et collectif, court et long terme).
L'objectif est d'inciter par les faits. La crédibilité est l'actif n° 1 : un seul chiffre faux ou non sourcé détruit la confiance.

## Règles absolues
1. **Aucun chiffre inventé.** Toute valeur affichée vient d'une table Supabase et d'une ligne de `public.sources` (id, version, licence). Si une donnée manque, afficher « donnée manquante », jamais 0.
2. **Ne jamais coder en dur** une valeur nutritionnelle, un facteur d'émission, un nombre d'animaux ou un prix dans le code front ou les tests de production. Les seules constantes autorisées dans le code sont des conversions d'unités.
3. **Montrer aussi quand le plat animal fait mieux** (B12, DIAAS, prix…) avec la solution (complément, aliment enrichi, association de protéines).
4. **Comparer à fonction égale** : même rôle dans le repas, portion réaliste ; afficher aussi par 100 kcal et par 10 g de protéines.
5. **Afficher l'incertitude** : fourchettes (`low_per_serving`, `high_per_serving`), DQR Agribalyse, et `mass_coverage` (avertir si < 0,95).
6. **Pas de conseil médical.** Mention visible et renvoi vers un professionnel de santé.
7. **Licences** : respecter `sources.license`. Les sources avec `commercial_use = false` (IHME/GBD) ou `null` ne doivent pas servir dans une version payante sans vérification. ODbL (Open Food Facts, Open Prices) impose de partager les bases dérivées sous la même licence et de citer la source.
8. Si une source n'est pas téléchargeable ou son format a changé : **s'arrêter et demander**, ne pas improviser de valeurs.

## Stack
- Next.js (App Router) + TypeScript strict + Tailwind CSS, déployé sur Vercel (plan Hobby : usage non commercial).
- Supabase (Postgres + Auth + RLS), plan Free (500 Mo, pause après 7 jours d'inactivité).
- Moteur de calcul : `lib/scoring/` en TypeScript pur, sans dépendance réseau, testé avec Vitest.
- Pipeline de données : `pipeline/` en Python 3 (pandas), un script par source, rejouable.
- Interface en **français** ; code, noms de variables et commits en **anglais**.

## Structure du dépôt
```
app/                 pages Next.js (accueil, /compare/[slug], /recette, /methodologie, /sources)
components/          composants UI
lib/scoring/         moteur de calcul (pur, testé)
lib/supabase/        clients Supabase (serveur et navigateur)
pipeline/            scripts d'import : ciqual.py, agribalyse.py, faostat.py, open_prices.py…
pipeline/raw/        fichiers téléchargés (ignorés par git)
supabase/migrations/ schéma SQL versionné
supabase/seed.sql    sources, indicateurs, valeur carbone
tests/               tests Vitest
```

## Modèle de données (résumé)
- Clé commune : **code Ciqual** (`foods.code`), partagé par Agribalyse.
- `food_nutrients` (pour 100 g), `food_impacts` (par kg), `category_factors` (animaux, santé par catégorie), `monetization_factors` (€ par unité), `prices`.
- `dishes` + `dish_ingredients` (grammes pour la recette entière, état réellement consommé) + `dish_pairs`.
- Vues de calcul : `dish_impacts`, `dish_nutrients`, `dish_animal_impacts` (par portion, avec fourchettes et couverture).

## Formule
Impact d'un plat par portion = Σ (grammes_i / 1000 × impact_par_kg_i) / nombre_de_portions.
Écart affiché = (animal − végétal) / animal × 100.

## Commandes
- `npm run dev` — serveur local
- `npm test` — tests Vitest (doivent passer avant chaque commit)
- `npm run lint` et `npm run typecheck`
- `supabase db push` — appliquer les migrations au projet distant
- `python pipeline/<source>.py` — importer une source (lit `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SECRET_KEY` depuis `.env`, jamais commités)

## Façon de travailler
- Petites étapes, une fonctionnalité par branche, une pull request par étape.
- Écrire d'abord les tests du moteur de calcul, puis le code.
- La clé secrète (`SUPABASE_SECRET_KEY`) ne sert qu'au pipeline, jamais dans le navigateur ni dans Vercel côté client.
- Après chaque import, imprimer un résumé : nombre de lignes, valeurs manquantes, 5 exemples, et vérifier un aliment connu à la main.
- Mettre à jour `/sources` (page publique) quand une source est ajoutée ou change de version.

## Contexte du projet
- **GitHub** : compte `VeganFlemme`, dépôt public https://github.com/VeganFlemme/veganizer.
- **Supabase** : projet `vjtayhddemgcydvczunb`, URL https://vjtayhddemgcydvczunb.supabase.co, région eu-central-1 (Francfort), plan Free. Les tables ne sont **PAS** exposées automatiquement : tout accès passe par les `GRANT` de la migration.
- **Variables d'environnement** :
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — site ;
  - `SUPABASE_SECRET_KEY` — pipeline uniquement, **jamais** dans Next.js.
- **Hébergement** : Vercel Hobby tant que le projet est non commercial ; migration prévue vers Cloudflare Workers (adaptateur `@opennextjs/cloudflare`) avant l'ajout éventuel de liens affiliés Greenweez.
- **Priorité absolue** : une plateforme irréprochable qui aide la transition vegan. L'affiliation est secondaire.

### Règles de portabilité
- Aucun service propre à Vercel (KV, Blob, Edge Config, Postgres Vercel).
- Pas de runtime edge.
- Pages `/compare` générées statiquement avec revalidation.
- `next/image` en mode `unoptimized`.

### Règles pour l'affiliation future
- Un lien affilié n'influence **jamais** un calcul ni un classement.
- Il est toujours signalé « lien affilié ».
- L'alternative faite maison s'affiche toujours en premier.
- Avant toute activation, les sources avec `commercial_use = false` ou `null` doivent être remplacées ou vérifiées.
