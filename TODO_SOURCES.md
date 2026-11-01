# Sources à compléter

Valeurs **non saisies** faute d'avoir pu citer la page exacte de la source officielle (état au 2026-11-01). Ne rien inventer : remplir `pipeline/manual_factors.csv` (avec `page` et `quote`) ou un script dédié une fois la source consultée.

## Animaux
État au 2026-11-01 (session « facteurs manquants »).

| Indicateur | Catégories | Source visée | Blocage |
|---|---|---|---|
| `fish_killed` (poissons tués par kg) | saumon d'élevage, poisson sauvage… | Fishcount (fishcount.org.uk) | Réessayé le 2026-11-01 : HTTP 401 depuis l'environnement de travail (la page répond 200 depuis les runners GitHub, issue #11). Aucune source secondaire utilisée. |
| `pain_hours_annoying`, `pain_hours_hurtful`, `pain_hours_disabling` | poulet de chair | Welfare Footprint via OWID | OWID ne publie ces trois intensités qu'en jours (jours éveillés de 16 h), règle : jamais les colonnes en jours. Chercher les heures dans le livre *Quantifying Pain in Broiler Chickens* (page exacte). Seule la douleur atroce (secondes) est utilisée. |
| `pain_hours_*` | porc, bovin, autres | Welfare Footprint | Pas de jeu de données ouvert trouvé. |
| `pain_hours_*` par kg d'œufs | poule pondeuse | — | Valeurs par poule importées ; conversion par kg impossible tant que la durée de ponte et les animaux par kg d'œufs ne sont pas sourcés (welfarefootprint.org indique une phase de ponte supposée de 40 à 60 semaines : à confirmer, voir `docs/A_VERIFIER.md`). |
| `life_days_farmed` | bovin, agneau, dinde, canard | Agreste, FranceAgriMer, Idele, ITAVI, cahiers des charges label rouge | Aucun âge du « produit courant » trouvé avec citation. Pour la dinde, le seul trouvé (LA 10/80) vise une « dinde baby de 70 jours maximum », non représentative. |
| `life_days_farmed` | veau | — | Âge d'abattage des veaux de boucherie non trouvé. |
| `life_days_farmed` | poule pondeuse (œufs) | FAOSTAT | Le rendement officiel récent est en œufs par poule (No/An) ; le rendement en kg n'est officiel qu'en 2014. Un poids d'œuf n'est pas une conversion d'unité. |
| `animals_killed_land` | poule pondeuse (œufs), vache laitière (lait, fromages) | — | Méthode à décider (poules et vaches de réforme, poussins mâles, veaux) : question dans `docs/A_VERIFIER.md`. |

## Santé
| Élément | Source visée | Blocage |
|---|---|---|
| Repères PNNS (viande hors volaille, charcuterie, par semaine) | Santé publique France, « Recommandations relatives à l'alimentation, à l'activité physique et à la sédentarité pour les adultes » (2019) | PDF officiel non téléchargeable (redirection vers l'accueil) et mangerbouger.fr en maintenance le 2026-11-01. Les chiffres vus dans des sources secondaires ne sont pas utilisés. |
| Repères EAT-Lancet 2025 | The Lancet, EAT-Lancet Commission 2.0 | Non consulté. |
| HENI (minutes de vie en bonne santé) par catégorie | Stylianou, Fulgoni, Jolliet, Nature Food 2021 (données supplémentaires) | Article non accessible depuis l'environnement (redirection) ; licence des données à vérifier (afficher le badge « usage non commercial » si c'est le cas). |

## Coût
| Élément | Source visée | Blocage |
|---|---|---|
| Prix de la viande, du poisson, du tofu, des légumineuses… | Open Prices | L'export ne contient de prix au kg que pour des produits bruts (surtout fruits et légumes) ; les prix par code-barres n'ont pas la quantité du produit. Piste : joindre les quantités Open Food Facts (ODbL) ou utiliser le RNM (FranceAgriMer). |

## Nutrition
| Élément | Source visée | Blocage |
|---|---|---|
| CALNUT (compléter les valeurs manquantes de Ciqual) | ANSES, ciqual.anses.fr | Site en maintenance (503) le 2026-11-01 : étape A sautée. |
