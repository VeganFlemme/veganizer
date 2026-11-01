# Sources à compléter

Valeurs **non saisies** faute d'avoir pu citer la page exacte de la source officielle (état au 2026-11-01). Ne rien inventer : remplir `pipeline/manual_factors.csv` (avec `page` et `quote`) ou un script dédié une fois la source consultée.

## Animaux
État au 2026-11-01 (session « facteurs manquants »).

| Indicateur | Catégories | Source visée | Blocage |
|---|---|---|---|
| `fish_killed` (poissons tués par kg) | saumon d'élevage, poisson sauvage… | Fishcount (fishcount.org.uk) | Réessayé le 2026-11-01 : HTTP 401 depuis l'environnement de travail (la page répond 200 depuis les runners GitHub, issue #11). Aucune source secondaire utilisée. |
| `pain_hours_annoying`, `pain_hours_hurtful`, `pain_hours_disabling` | poulet de chair | Welfare Footprint via OWID | OWID ne publie ces trois intensités qu'en jours (jours éveillés de 16 h), règle : jamais les colonnes en jours. S14 (2026-11-01) : livre *Quantifying Pain in Broiler Chickens* introuvable en PDF (welfarefootprint.org/broilers sans lien de téléchargement ; pain-track.org/broilers est une application JavaScript). Chiffres en heures vus seulement dans des commentaires de forum : non utilisés. |
| `pain_hours_*` | porc, bovin, autres | Welfare Footprint | Pas de jeu de données ouvert trouvé. |
| `pain_hours_*` par kg d'œufs | poule pondeuse | — | Valeurs par poule importées. Conversion par kg seulement si la durée de ponte ET le nombre ou la masse d'œufs par poule sont sourcés à la page exacte (décision de Matt, S14). welfarefootprint.org dit seulement « 40 to 60 weeks » sans page de livre ; FAOSTAT donne des œufs par poule mais pas de masse officielle récente. |
| `life_days_farmed` | bovin, agneau, dinde, canard | Agreste, FranceAgriMer, Idele, ITAVI, cahiers des charges label rouge | Aucun âge du « produit courant » trouvé avec citation. Pour la dinde, le seul trouvé (LA 10/80) vise une « dinde baby de 70 jours maximum », non représentative. |
| `life_days_farmed` | veau | — | Âge d'abattage des veaux de boucherie non trouvé. |
| `life_days_farmed` | poule pondeuse (œufs) | FAOSTAT | Le rendement officiel récent est en œufs par poule (No/An) ; le rendement en kg n'est officiel qu'en 2014. Un poids d'œuf n'est pas une conversion d'unité. |
| `animals_killed_land` | poule pondeuse (œufs), vache laitière (lait, fromages) | — | Décision de Matt (S14) : pas de facteur pour l'instant, « donnée manquante » expliquée sur `/methodologie`. |
| `life_days_farmed` par kg de fromage, beurre, crème | vache laitière | Coefficients d'équivalent lait (CNIEL, FranceAgriMer, Idele) | Les tables CNIEL-IDELE-FranceAgriMer (2020) donnent des compositions (MP, MG, MSU), pas de coefficients kg de lait par kg de produit ; en tirer un coefficient demanderait de choisir une méthode. Donnée manquante (S14). |

## Santé
| Élément | Source visée | État au 2026-11-01 |
|---|---|---|
| Repères PNNS adultes | Santé publique France (2019), PDF officiel | **Fait (S12)** : viande, charcuterie, poisson, légumes secs (p. 32-35 et 49). Licence du PDF à vérifier. |
| Repères EAT-Lancet 2025 | The Lancet, Commission EAT-Lancet 2.0 | thelancet.com renvoie HTTP 403 (article et page de la Commission). EAT Forum publie un *Summary Report 2025* (eatforum.org/eat-lancet/summary-report/) : document différent, non utilisé (question dans `docs/A_VERIFIER.md`). |
| HENI par catégorie | Stylianou, Fulgoni, Jolliet, Nature Food 2021 | Page lue : pas de licence ouverte (« Reprints and permissions »), « Data are available from the corresponding author upon reasonable request » ; données pour 167 aliments américains. Non importé ; `sources.heni-2021.commercial_use = false`. Il faudrait une autorisation écrite des auteurs. |

## Coût
| Élément | Source visée | État au 2026-11-01 |
|---|---|---|
| Prix au détail (RNM) | FranceAgriMer, stade détail GMS | **Fait (S13)** pour carotte, oignon jaune, steak haché 15 % cru. Le RNM détail ne publie que 7 viandes (souvent avec os ou label rouge/bio), des fruits et légumes ; pas de poisson, d'œufs, de fromage, de légumineuses ni de céréales au stade détail. |
| Prix des ingrédients cuits (viandes, légumineuses, pâtes, riz, pommes de terre) | Rendements de cuisson sourcés (ex. USDA « Table of Cooking Yields for Meat and Poultry », ANSES/Ciqual si disponible) | Non fait : un prix cru ne peut pas être appliqué à un poids cuit sans rendement de cuisson sourcé (ce n'est pas une conversion d'unité). Bloque l'affichage du prix total de tous les plats (couverture max 53 %). |
| Produits vendus au litre (huiles, lait, boissons végétales, vin, sauce soja) | Open Prices + Open Food Facts | Quantités en ml : conversion en grammes impossible sans masse volumique sourcée. |
| Cheddar, emmental râpé, fécule de maïs, farine de pois chiche | Open Prices (catégories OFF) | 0 à 2 relevés exploitables sur 12 mois : moins de 5, donc non publiés. |

## Nutrition
| Élément | Source visée | Blocage |
|---|---|---|
| CALNUT (compléter les valeurs manquantes de Ciqual) | ANSES, ciqual.anses.fr | Site en maintenance (503) le 2026-11-01, revérifié en S14 : toujours 503. |
