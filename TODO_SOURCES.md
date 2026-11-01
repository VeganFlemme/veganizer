# Sources à compléter

Valeurs **non saisies** faute d'avoir pu citer la page exacte de la source officielle (état au 2026-11-01). Ne rien inventer : remplir `pipeline/manual_factors.csv` (avec `page` et `quote`) ou un script dédié une fois la source consultée.

## Animaux
État au 2026-11-01 (session « facteurs manquants »).

| Indicateur | Catégories | Source visée | Blocage |
|---|---|---|---|
| `fish_killed` (poissons tués par kg) | saumon d'élevage, cabillaud, lieu noir | Mood et al. 2023 et 2024 (*Animal Welfare*, CC BY 4.0), suppléments S4 et S3 | **Fait (S23)** à partir des fichiers fournis par Matt (`pipeline/raw/fishcount/`, cambridge.org et fishcount.org.uk bloquent l'environnement de travail). Autres poissons, crevettes, crustacés : donnée manquante (correspondances espèce par espèce à relire ; Mood et al. ne couvrent que les poissons à nageoires). |
| `pain_hours_annoying`, `pain_hours_hurtful`, `pain_hours_disabling` | poulet de chair | Welfare Footprint via OWID | OWID ne publie ces trois intensités qu'en jours (jours éveillés de 16 h), règle : jamais les colonnes en jours. S14 (2026-11-01) : livre *Quantifying Pain in Broiler Chickens* introuvable en PDF (welfarefootprint.org/broilers sans lien de téléchargement ; pain-track.org/broilers est une application JavaScript). Chiffres en heures vus seulement dans des commentaires de forum : non utilisés. |
| `pain_hours_*` | porc, bovin, poissons, autres | Welfare Footprint | Revérifié en S23 (Our World in Data) : aucune valeur publiée en heures pour ces espèces. |
| `pain_hours_*` par kg d'œufs | poule pondeuse | Ministère de l'Agriculture (fiche poules pondeuses, p. 1) + FAO TCF (60 g par œuf) | **Fait (S23)** : environ 300 œufs par cycle de ponte de 12-13 mois × 60 g = 18 kg d'œufs par poule. Masse réglementaire UE (règlement 589/2008, catégories S-XL) non vérifiée : EUR-Lex renvoie une vérification anti-robots. |
| `life_days_farmed` | bovin, vache de réforme, agneau, dinde, canard | Agreste, FranceAgriMer, Idele, ITAVI, INRAE, cahiers des charges label rouge | Recherché à nouveau en S23 : pas de « chiffres clés » Idele ou ITAVI avec un âge moyen d'abattage citable ; seuls des articles de presse agricole (Réussir) citant l'Idele, non retenus. La fiche « volailles de chair » du ministère (p. 1) donne « vers l'âge de 35 jours » pour le poulet standard (38 jours retenus, LA 07/85). |
| `life_days_farmed` | veau | — | Âge d'abattage des veaux de boucherie non trouvé. |
| `life_days_farmed` | poule pondeuse (œufs) | FAOSTAT + FAO TCF | **Fait (S23)** : 365 / (257 œufs par poule en 2023 × 60 g, poids moyen FAO pour la France). |
| `animals_killed_land` | poule pondeuse (œufs), vache laitière (lait, fromages) | — | Décision de Matt (S14) : pas de facteur pour l'instant, « donnée manquante » expliquée sur `/methodologie`. |
| `life_days_farmed` par kg de fromage | vache laitière | FAO, *Technical Conversion Factors*, France | **Fait (S23)** : coefficient d'extraction 13 % (7,7 kg de lait par kg de fromage), p. 545 imprimée. |
| `life_days_farmed` par kg de beurre, crème | vache laitière | FAO TCF (4,6 % et 12 %) | Taux trouvés mais non appliqués : coproduits du lait écrémé, pas de règle de répartition sourcée (S23). |

## Santé
| Élément | Source visée | État au 2026-11-01 |
|---|---|---|
| Repères PNNS adultes | Santé publique France (2019), PDF officiel | **Fait (S12)** : viande, charcuterie, poisson, légumes secs (p. 32-35 et 49). Licence du PDF à vérifier. |
| Repères EAT-Lancet 2025 (S23 : rapport non trouvé dans les fichiers déposés par Matt) | The Lancet, Commission EAT-Lancet 2.0 | thelancet.com renvoie HTTP 403 (article et page de la Commission). EAT Forum publie un *Summary Report 2025* (eatforum.org/eat-lancet/summary-report/) : document différent, non utilisé (question dans `docs/A_VERIFIER.md`). |
| HENI par catégorie | Stylianou, Fulgoni, Jolliet, Nature Food 2021 | Page lue : pas de licence ouverte (« Reprints and permissions »), « Data are available from the corresponding author upon reasonable request » ; données pour 167 aliments américains. Non importé ; `sources.heni-2021.commercial_use = false`. Il faudrait une autorisation écrite des auteurs. |

## Coût
| Élément | Source visée | État au 2026-11-01 |
|---|---|---|
| Prix au détail (RNM) | FranceAgriMer, stade détail GMS | **Fait (S13)** pour carotte, oignon jaune, steak haché 15 % cru. Le RNM détail ne publie que 7 viandes (souvent avec os ou label rouge/bio), des fruits et légumes ; pas de poisson, d'œufs, de fromage, de légumineuses ni de céréales au stade détail. |
| Prix des ingrédients cuits (viandes, légumineuses, pâtes, riz, pommes de terre) | Rendements de cuisson sourcés | **S17b** : table USDA (viandes) importée ; seul le steak haché 15 % a aujourd'hui un prix cru correspondant. S23 : prix crus INSEE du rôti de porc (filet) et de la bavette sans ligne USDA équivalente (désossé ou non, coupe) → non appliqués. Pâtes, riz, légumineuses, pommes de terre : candidat Bognár 2002 (BFE Karlsruhe, facteurs de rendement p. 31-39), licence non indiquée → non appliqué, question dans `docs/A_VERIFIER.md`. |
| Prix moyens de vente de détail | INSEE (data.gouv.fr, Licence Ouverte 2.0) | **Fait (S23)** : carotte, endive, poireau, pomme, citron, baguette (séries au kg encore publiées, jusqu'à 2026-09). Les autres séries récentes ne correspondent pas à un ingrédient cru des recettes. |
| Produits vendus au litre (huiles, lait, boissons végétales, vin, sauce soja) | Open Prices + FAO/INFOODS Density Database v2.0 | **Fait (S23)** pour huiles de colza, d'olive et de tournesol, vin rouge, sauce soja. Lait demi-écrémé (la table ne donne que le lait entier) et boisson au soja enrichie en calcium (catégorie Open Food Facts plus large) : donnée manquante. |
| Cheddar, emmental râpé, fécule de maïs, farine de pois chiche | Open Prices (catégories OFF) | 0 à 2 relevés exploitables sur 12 mois : moins de 5, donc non publiés. |

## Nutrition
| Élément | Source visée | Blocage |
|---|---|---|
| CALNUT (compléter les valeurs manquantes de Ciqual) | ANSES, ciqual.anses.fr | Site en maintenance (503) le 2026-11-01, revérifié en S14 et en S23 : toujours 503. |

## Recettes (S17)
| Élément | Source visée | État au 2026-11-01 |
|---|---|---|
| Base de recettes à licence ouverte | « Recettes de chefs pour professionnels » (data.gouv.fr) | Producteur non vérifiable (organisation non certifiée, sans SIREN) : non utilisée. Demander confirmation à METRO France. |
| Base de recettes à licence ouverte | Wikilivres « Livre de cuisine » (CC BY-SA) | Non utilisée : le partage à l'identique s'appliquerait à toute la table des paires. Décision à prendre (licence de `veganizer-pairs`). |
| Portions types | INCA 3 (ANSES) | Accessible, licence « non spécifiée » : utilisée seulement pour classer les plats, pas pour afficher des portions. |
