# Sources à compléter

Valeurs **non saisies** faute d'avoir pu citer la page exacte de la source officielle (état au 2026-11-01). Ne rien inventer : remplir `pipeline/manual_factors.csv` (avec `page` et `quote`) ou un script dédié une fois la source consultée.

## Animaux
| Indicateur | Catégories | Source visée | Blocage |
|---|---|---|---|
| `fish_killed` (poissons tués par kg) | saumon d'élevage, poisson sauvage… | Fishcount — poids moyens estimés (fishcount.org.uk) | Le site renvoie HTTP 401 (accès refusé) le 2026-11-01. |
| `pain_hours_*` (douleur cumulée) | poulet de chair, poule pondeuse, porc | Welfare Footprint Institute | Chiffres publiés dans des livres et articles : page exacte non vérifiée. |
| `life_days_farmed` (jours de vie en élevage) | toutes | Âges d'abattage (sources françaises : interprofessions, INRAE, ITAVI…) | Aucune source officielle consultée avec page exacte. |
| `animals_killed_land` | veau | FAOSTAT n'a pas de ligne « veaux » séparée | Trouver une statistique d'abattage des veaux (Agreste) avec poids carcasse. |
| `animals_killed_land` | poule pondeuse (œufs), vache laitière (lait, fromages) | — | Méthode à définir (poules et vaches de réforme, poussins mâles) et à sourcer. |

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
