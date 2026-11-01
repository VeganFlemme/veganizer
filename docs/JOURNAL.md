# Journal de la suite V1 (`docs/SUITE_V1.md`)

Suivi étape par étape : heure, ce qui est fait, lien de la PR, état (en cours, fusionnée, bloquée).

## Étape 0 — Terminer la PR #16 (relecture des lots C et D)

- 2026-11-01 15:56 — début. PR https://github.com/VeganFlemme/veganizer/pull/16 (brouillon). État : en cours.
- `supabase db push` (migration `20261103000000`), `pairs.py` (40 paires, 116 plats, 815 ingrédients ; 7 versions dépubliées, dont les crêpes du commerce sur décision de Matt), `substitutions.py` (16 règles). Résumé de `pairs.py` identique ligne à ligne au tableau « Chiffres clés » calculé hors ligne.
- `npm run test:db` (5 tests SQL, dont 2 nouveaux : fourchettes « < x » de `dish_nutrients`, purge des signalements) et `npm run test:db:scoring` : passés.
- Mentions légales : directeur de la publication VeganFlemme ; adresse remplacée par le régime des éditeurs non professionnels, **article 1-1, II de la LCEN** (loi n° 2004-575, version en vigueur depuis le 23 mai 2024, créée par la loi n° 2024-449 du 21 mai 2024, art. 48 ; Légifrance LEGIARTI000049568614, consulté le 2026-11-01) : « peuvent ne tenir à la disposition du public, pour préserver leur anonymat, que le nom, la dénomination ou la raison sociale et l'adresse du fournisseur de services d'hébergement, sous réserve d'avoir communiqué à ce fournisseur les éléments d'identification personnelle mentionnés au I ». Hébergeur affiché : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, privacy@vercel.com. **À confirmer par Matt** : ses éléments d'identification sont bien connus de Vercel (compte).
- Purge des signalements : pg_cron disponible sur le plan Free ; fonction `purge_old_error_reports()` et tâche quotidienne (migration `20261103010000`, appliquée), expliquée sur `/confidentialite`.
- Prévisualisation Vercel protégée (redirection 302 vers la connexion Vercel) : **décision de Matt (2026-11-01)**, pour toute la suite, le contrôle « 200 sur la prévisualisation » est remplacé par : construction Vercel réussie + 200 sur un build de production local (`next build` puis `next start`) de la branche. PR #16 : `/`, `/compare/boeuf-bourguignon`, `/recette`, `/api/recette/donnees`, `/mentions-legales`, `/confidentialite` → 200 ; CI verte.
- 2026-11-01 16:04 — fin de l'étape 0 : toutes les conditions remplies, PR #16 fusionnée (squash). État : fusionnée.

## Étape 1 — S22 : recettes denses en protéines et vue « à protéines égales »

- 2026-11-01 16:05 — début, branche `roadmap/s22`. État : en cours.
- Recettes : protéines de soja texturées réhydratées dans les versions maison des plats au haché et des pièces de viande, tofu pour œufs, fromage et poisson, haché végétal pour les versions du commerce des plats au haché ; plafond +20 % respecté (`pairs.py`). `pairs.py` importé : résumé identique au tableau calculé hors ligne. Objectif de 70 % des protéines non atteint pour 7 versions (19 avant).
- Vue « À protéines égales » (`?vue=proteines`, aussi sur `/recette`) : facteur et poids affichés, protéines non comptées, verdict CO₂e double (bœuf bourguignon : « −90 % par portion, −86 % à protéines égales »).
- Point 4 ajouté par Matt (16 h 07) : encadré « Là où le plat animal fait mieux » par catégorie, absent quand vide, récapitulatif groupé sur la vue d'ensemble, une boîte par section sur `/aliment`.
- `/methodologie` : section « Portion réaliste ou à protéines égales », sources ANSES vérifiées avec page.
- Tests : `npm test` 241, lint, typecheck, `test:pipeline`, `test:db` (5 tests SQL), `test:db:scoring` ; build local et 200 sur `/`, `/compare/boeuf-bourguignon` (deux vues), `/recette`, `/aliment/6255`, `/methodologie`.

## Bloqué par les permissions

(aucune commande bloquée pour l'instant)
