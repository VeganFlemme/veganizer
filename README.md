# Veganizer — kit de démarrage

Comparateur factuel plat animal ↔ alternative végétale : nutrition, santé, climat, animaux, coût.

## Contenu
- `CLAUDE.md` — règles du projet lues automatiquement par Claude Code.
- `supabase/migrations/20261101000000_init.sql` — schéma complet (tables, vues de calcul, sécurité RLS).
- `supabase/seed.sql` — 33 sources documentées (licence, version), 31 indicateurs, valeur carbone officielle 2025-2060.

Le schéma a été testé sur Postgres 16 : calcul par portion, fourchettes, couverture, coût climat, et règles d'accès (visiteur anonyme, utilisateur connecté).

## Démarrage
1. Crée un dépôt GitHub `veganizer` (public) et copie ces fichiers à la racine.
2. Crée un projet Supabase (plan Free), région Europe.
3. Dans le dossier du dépôt, lance Claude Code et colle les prompts du document « Veganizer — Bases de données, indicateurs et plan de construction », section 11, dans l'ordre.

## Licence
- **Code** : licence MIT (voir [`LICENSE`](LICENSE)).
- **Table des paires de plats** (`dish_pairs`, à venir) : sera publiée sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
- **Données sources** : respecter la licence de chaque source listée dans `public.sources` (notamment ODbL pour Open Food Facts et Open Prices).
