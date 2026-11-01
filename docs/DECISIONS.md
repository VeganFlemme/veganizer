# Journal des décisions

Décisions prises en mode autonome quand plusieurs options étaient possibles. Règle : l'option la plus prudente et la plus fidèle aux sources.

| Date | Étape | Décision | Raison | Source |
|---|---|---|---|---|
| 2026-11-01 | A | Étape CALNUT sautée ; vue `food_nutrients_best` non créée. | `https://ciqual.anses.fr/` et le lien direct du fichier CALNUT renvoient « 503 Maintenance en cours ». Aucune autre source officielle de CALNUT trouvée (data.gouv.fr, entrepôt Recherche Data Gouv). Consigne : sauter et continuer. | ciqual.anses.fr, consulté le 2026-11-01 |
| 2026-11-01 | B | Les recettes sont décrites dans `pipeline/pairs.csv` (ingrédients) et `pipeline/pair_dishes.csv` (nom, portions, description, justification de la paire). | Un seul CSV aurait répété les textes sur chaque ligne d'ingrédient. | — |
| 2026-11-01 | B | « Maison » = cuisiné à partir d'ingrédients de base, y compris tofu, tempeh, légumineuses ; « commerce » = produit prêt à l'emploi imitant la viande ou le fromage (haché végétal, galettes, tranches, râpé, pâte brisée prête, seitan préemballé). | Distinction lisible pour le public ; seuls des produits avec nutriments et impacts complets sont retenus. | Ciqual 2025, Agribalyse 3.2 |
| 2026-11-01 | B | Seitan préemballé (25598) utilisé comme alternative « commerce » du bourguignon, de la blanquette et du poulet rôti. | L'« émincé végétal » qui conviendrait mieux (25223) n'a pas d'impact Agribalyse ; l'émincé 25224 « ne convient pas aux véganes ». | Agribalyse 3.2 |
| 2026-11-01 | B | Pain blanc (7001) pour le burger et pain de campagne (7100) pour le croque, des deux côtés. | Le pain de mie et le pain burger sont classés `mixte` (lait/œufs) : interdits par la règle 9. Même pain des deux côtés : la comparaison reste équitable. | `pipeline/animal_categories.csv` |
| 2026-11-01 | B | Carottes au code cru (20009) dans les plats mijotés. | Aucun code « carotte cuite » n'a à la fois nutriments Ciqual et impacts Agribalyse (20008, 20209 sans nutriments ; 20352, 20305, 20306 sans impact). | Ciqual 2025, Agribalyse 3.2 |
| 2026-11-01 | B | Pas de champignons de Paris dans le bourguignon ni la blanquette. | Aucun code champignon de Paris n'a d'impact Agribalyse : les inclure ferait passer la couverture sous 0,95. | Agribalyse 3.2 |
| 2026-11-01 | B | Pas de tomate crue dans le burger. | Les variantes Agribalyse de la tomate crue (20047_1/2/3) n'ont pas de `ciqual_code` (nutriments manquants) et les codes Ciqual de tomate crue n'ont pas d'impact. | règle 11 |
| 2026-11-01 | B | Œufs au code « œuf cru » (22000) dans l'omelette et la quiche. | Pas de code « omelette nature » pur ; l'œuf cru est l'aliment pur le plus proche, à masse quasi égale après cuisson. | Ciqual 2025 |
| 2026-11-01 | B | Pâte brisée maison : farine + matière grasse, sans l'eau. | L'eau de la pâte s'évapore à la cuisson ; mêmes conventions des deux côtés. | — |
| 2026-11-01 | B | Vin rouge compté à son poids (250 g) dans le bourguignon, des deux côtés. | Pas de code « vin cuit » ; l'alcool s'évapore en partie, l'énergie est donc surestimée de la même façon des deux côtés. | Ciqual 2025 |
| 2026-11-01 | B | Salade verte en vinaigrette ajoutée à la quiche, à l'omelette et au croque (même quantité des deux côtés). | Portion consommée exigée entre 300 et 500 g ; c'est l'accompagnement habituel de ces plats. | — |
| 2026-11-01 | B | Margarine non utilisée : huile de colza ou d'olive dans les recettes végétales. | Les codes margarine avec impact Agribalyse (16614, 16615…) n'ont pas de nutriments Ciqual. | Ciqual 2025, Agribalyse 3.2 |
| 2026-11-01 | B | 9 aliments ajoutés en `mixte` dans `animal_categories.csv` (16743-16746, 25224, 20298, 23120, 42004, 42005). | Leur nom indique un ingrédient laitier ou « ne convient pas aux véganes » alors qu'ils étaient `is_animal = false`. Classement plus prudent ; aucun n'est utilisé dans les recettes. | noms Ciqual / Agribalyse |
