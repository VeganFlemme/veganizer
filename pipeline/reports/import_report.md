# Rapport d'import Ciqual 2025 + Agribalyse 3.2 — 2026-11-01

## Lignes par table

| Table | Lignes |
|---|---|
| sources | 33 |
| foods | 3684 |
| nutrients | 74 |
| food_nutrients | 257816 |
| indicators | 43 |
| food_impacts | 49020 |
| food_impact_ingredients | 104737 |

## Valeurs manquantes (sur 3484 aliments Ciqual)

| Nutriment | Valeur numérique | « - » (absente) | « traces » | « < x » | % sans valeur numérique |
|---|---|---|---|---|---|
| protein_g | 3451 | 29 | 4 | 0 | 0.9 % |
| vit_b12_ug | 2030 | 1328 | 8 | 118 | 41.7 % |
| fe_mg | 2459 | 831 | 6 | 188 | 29.4 % |
| ca_mg | 2676 | 784 | 1 | 23 | 23.2 % |
| fiber_g | 3239 | 70 | 45 | 130 | 7.0 % |

## Correspondances

- Aliments Agribalyse absents de Ciqual 2025 (sans nutriments) : **152** → `agribalyse_absent_de_ciqual.csv`
- Variantes Agribalyse sans aliment Ciqual équivalent (nutriments « donnée manquante ») : **18** / 48 → `variantes_sans_nutriments.csv`
- Aliments Ciqual sans données Agribalyse : **1233** / 3484 → `ciqual_sans_agribalyse.csv`
- Codes Ciqual nus dont Agribalyse ne publie que des variantes, sans variante par défaut : **21** → `codes_nus_sans_impact.csv`

  - 1029 Spécialité végétale type fromage en tranche ou râpé, sans soja, préemballée (variantes : 1029_1, 1029_2)
  - 13014 Fraise, crue (variantes : 13014_1, 13014_2, 13014_3)
  - 13024 Clémentine ou mandarine, chair sans peau, sans pépins, crue (variantes : 13024_1, 13024_2)
  - 13025 Mangue, chair sans peau, sans noyau, crue (variantes : 13025_1, 13025_2)
  - 13167 Céréales instantanées, poudre à reconstituer, dès 4/6 mois (variantes : 13167_1, 13167_2)
  - 13168 Céréales instantanées, poudre à reconstituer, dès 6 mois (variantes : 13168_1, 13168_2)
  - 18152 Chicorée, poudre soluble (variantes : 18152_1, 18152_2)
  - 19012 Lait de croissance infantile, liquide (aliment lacté destiné aux enfants en bas âge) (variantes : 19012_1, 19012_2)
  - 20061 Haricot vert, cru (variantes : 20061_1, 20061_2)
  - 20591 Protéine de soja texturée, réhydratée (variantes : 20591_1, 20591_2)
  - 25227 Nuggets ou croquette panée de soja et blé (convient aux véganes ou végétaliens), préemballé (variantes : 25227_1, 25227_2)
  - 25232 Saucisse végétale au blé ou seitan, préemballé (variantes : 25232_1, 25232_2)
  - 25233 Galette de céréales au fromage (sans soja), préemballée (variantes : 25233_1, 25233_2)
  - 25415 Double cheeseburger, de restauration rapide (variantes : 25415_1, 25415_2)
  - 25589 Boulette végétale au soja et/ou blé, préemballée (variantes : 25589_1, 25589_2)
  - 25597 Galette ou pavé au soja, fromage et légumes, préemballé (variantes : 25597_1, 25597_2)
  - 3000 Lait 1er âge, poudre soluble (préparation pour nourrissons) (variantes : 3000_1, 3000_2)
  - 3002 Lait 2e âge, poudre soluble (préparation de suite) (variantes : 3002_1, 3002_2)
  - 7815 Tortilla souple (à garnir), à base de blé (variantes : 7815_1, 7815_2)
  - 9340 Quinoa, cru (variantes : 9340_1, 9340_2)
  - 9341 Quinoa, bouilli/cuit à l'eau, sans sel ajouté (variantes : 9341_1, 9341_2)

## Valeurs complètes à comparer aux sites Ciqual et Agribalyse

### 6255 — Boeuf, steak haché 15% MG cuit

is_animal = True, animal_category = bovin

| Nutriment (pour 100 g) | Valeur | Unité | Qualificatif |
|---|---|---|---|
| Alcool (éthanol) | 0.0 | g |  |
| Alpha-tocophérol (vitamine E) | 0.12 | mg |  |
| Cendres | 1.16 | g |  |
| Beta-Carotène | 0.0 | µg |  |
| Calcium | 15.0 | mg |  |
| Glucides | 0.0 | g |  |
| Cholestérol | 76.3 | mg |  |
| Chlorure | 61.0 | mg |  |
| Cuivre | 0.078 | mg |  |
| Energie, Règlement UE N° 1169/2011 | 239.0 | kcal |  |
| Energie, Règlement UE N° 1169/2011 | 996.0 | kJ |  |
| Energie, N x facteur Jones, avec fibres | 239.0 | kcal |  |
| Energie, N x facteur Jones, avec fibres | 996.0 | kJ |  |
| AG 10:0, caprique | 0.0 | g |  |
| AG 12:0, laurique | 0.01 | g |  |
| AG 14:0, myristique | 0.41 | g |  |
| AG 16:0, palmitique | 3.12 | g |  |
| AG 18:0, stéarique | 2.36 | g |  |
| AG 18:1 9c (n-9), oléique | 5.35 | g |  |
| AG 18:2 9c,12c (n-6), linoléique | 0.43 | g |  |
| AG 18:3 c9,c12,c15 (n-3), alpha-linolénique | 0.032 | g |  |
| AG 20:4 5c,8c,11c,14c (n-6), arachidonique | 0.017 | g |  |
| AG 20:5 5c,8c,11c,14c,17c (n-3) EPA | 0.0022 | g |  |
| AG 22:6 4c,7c,10c,13c,16c,19c (n-3) DHA | 0.00073 | g |  |
| AG 4:0, butyrique | 0.0 | g |  |
| AG 6:0, caproïque | 0.0 | g |  |
| AG 8:0, caprylique | 0.0 | g |  |
| AG monoinsaturés | 6.67 | g |  |
| AG polyinsaturés | 0.48 | g |  |
| AG saturés | 5.9 | g |  |
| Lipides | 16.1 | g |  |
| Fer | 2.6 | mg |  |
| Fibres alimentaires | 0.0 | g |  |
| Folates intrinsèques | donnée manquante | µg |  |
| Acide folique (enrichissement) | donnée manquante | µg |  |
| Fructose | donnée manquante | g |  |
| Galactose | donnée manquante | g |  |
| Glucose | donnée manquante | g |  |
| Iode | 6.1 | µg |  |
| Potassium | 318.0 | mg |  |
| Lactose | donnée manquante | g |  |
| Maltose | donnée manquante | g |  |
| Magnésium | 29.5 | mg |  |
| Manganèse | 0.06 | mg |  |
| Sodium | 84.3 | mg |  |
| Acides organiques | 0.0 | g |  |
| Phosphore | 198.0 | mg |  |
| Polyols totaux | 0.0 | g |  |
| Protéines, N x facteur de Jones | 23.6 | g |  |
| Protéines, N x 6.25 | 23.6 | g |  |
| Rétinol | 3.0 | µg |  |
| Sel chlorure de sodium | 0.21 | g |  |
| Sélénium |  | µg | < 5 |
| Amidon | 0.0 | g |  |
| Saccharose | donnée manquante | g |  |
| Sucres | 0.0 | g |  |
| Activité vitaminique A, équivalents rétinol | 3.0 | µg |  |
| Vitamine B12 | 2.3 | µg |  |
| Vitamine B1 ou Thiamine | 0.046 | mg |  |
| Vitamine B2 ou Riboflavine | 0.18 | mg |  |
| Vitamine B3 ou PP ou Niacine | 5.2 | mg |  |
| Vitamine B5 ou Acide pantothénique | 0.66 | mg |  |
| Vitamine B6 | 0.29 | mg |  |
| Vitamine B9 ou Folates totaux, équivalents folates alimentaires, DFE | donnée manquante | µg |  |
| Vitamine B9 ou Folates totaux | 9.0 | µg |  |
| Vitamine C | 0.0 | mg |  |
| Vitamine D2 (ergocalciférol) | 0.0 | µg |  |
| Vitamine D3 (cholécalciférol) | 0.0 | µg |  |
| Vitamine D | 0.0 | µg |  |
| Vitamine E | donnée manquante | mg |  |
| Vitamine K1 | 1.2 | µg |  |
| Vitamine K2 | 5.1 | µg |  |
| Eau | 59.1 | g |  |
| Zinc | 4.9 | mg |  |

DQR Agribalyse : 2.9

| Indicateur (par kg de produit) | Valeur | Unité |
|---|---|---|
| Acidification | 0.626 | mol H+ éq. |
| Écotoxicité eau douce | 229.0 | CTUe |
| Score unique environnemental EF | 4.25 | mPt |
| Eutrophisation eau douce | 0.00196 | kg P éq. |
| Eutrophisation marine | 0.133 | kg N éq. |
| Eutrophisation terrestre | 2.77 | mol N éq. |
| Gaz à effet de serre (100 ans) | 45.2 | kg CO2e |
| Gaz à effet de serre — émissions biogéniques | 33.0 | kg CO2e |
| Gaz à effet de serre — émissions fossiles | 12.3 | kg CO2e |
| Gaz à effet de serre — changement d'affectation des sols | -0.0777 | kg CO2e |
| Toxicité humaine, effets cancérogènes | 1.81e-08 | CTUh |
| Toxicité humaine, effets non cancérogènes | 6.56e-07 | CTUh |
| Rayonnements ionisants | 2.21 | kBq U-235 éq. |
| Utilisation des sols (indice de qualité des sols) | 2940.0 | Pt |
| Appauvrissement de la couche d'ozone | 2.08e-07 | kg CFC-11 éq. |
| Particules fines | 4.24e-06 | incidence |
| Formation photochimique d'ozone | 0.0675 | kg COVNM éq. |
| Épuisement des ressources énergétiques | 118.0 | MJ |
| Épuisement des ressources minérales | 5.98e-05 | kg Sb éq. |
| Eau (pondérée par la raréfaction) | 3.77 | m³ éq. |

### 20587 — Lentille verte, bouillie/cuite à l'eau

is_animal = False, animal_category = nan

| Nutriment (pour 100 g) | Valeur | Unité | Qualificatif |
|---|---|---|---|
| Alcool (éthanol) | 0.0 | g |  |
| Alpha-tocophérol (vitamine E) | 0.53 | mg |  |
| Cendres | 0.81 | g |  |
| Beta-Carotène | 16.8 | µg |  |
| Calcium | 39.5 | mg |  |
| Glucides | 16.2 | g |  |
| Cholestérol | 0.0 | mg |  |
| Chlorure | 17.0 | mg |  |
| Cuivre | 0.25 | mg |  |
| Energie, Règlement UE N° 1169/2011 | 125.0 | kcal |  |
| Energie, Règlement UE N° 1169/2011 | 527.0 | kJ |  |
| Energie, N x facteur Jones, avec fibres | 125.0 | kcal |  |
| Energie, N x facteur Jones, avec fibres | 527.0 | kJ |  |
| AG 10:0, caprique |  | g | < 0.01 |
| AG 12:0, laurique |  | g | < 0.01 |
| AG 14:0, myristique |  | g | < 0.01 |
| AG 16:0, palmitique | 0.075 | g |  |
| AG 18:0, stéarique | 0.017 | g |  |
| AG 18:1 9c (n-9), oléique | 0.13 | g |  |
| AG 18:2 9c,12c (n-6), linoléique | 0.15 | g |  |
| AG 18:3 c9,c12,c15 (n-3), alpha-linolénique | 0.032 | g |  |
| AG 20:4 5c,8c,11c,14c (n-6), arachidonique |  | g | < 0.01 |
| AG 20:5 5c,8c,11c,14c,17c (n-3) EPA |  | g | < 0.01 |
| AG 22:6 4c,7c,10c,13c,16c,19c (n-3) DHA |  | g | < 0.01 |
| AG 4:0, butyrique |  | g | < 0.01 |
| AG 6:0, caproïque |  | g | < 0.01 |
| AG 8:0, caprylique |  | g | < 0.01 |
| AG monoinsaturés | 0.13 | g |  |
| AG polyinsaturés | 0.18 | g |  |
| AG saturés | 0.093 | g |  |
| Lipides | 0.58 | g |  |
| Fer | 2.45 | mg |  |
| Fibres alimentaires | 8.45 | g |  |
| Folates intrinsèques | 50.5 | µg |  |
| Acide folique (enrichissement) | 0.0 | µg |  |
| Fructose |  | g | < 0.2 |
| Galactose | donnée manquante | g |  |
| Glucose |  | g | < 0.2 |
| Iode |  | µg | < 20 |
| Potassium | 215.0 | mg |  |
| Lactose |  | g | < 0.2 |
| Maltose |  | g | < 0.2 |
| Magnésium | 34.0 | mg |  |
| Manganèse | 0.44 | mg |  |
| Sodium | 5.8 | mg |  |
| Acides organiques | 0.094 | g |  |
| Phosphore | 160.0 | mg |  |
| Polyols totaux |  | g | < 0.5 |
| Protéines, N x facteur de Jones | 10.1 | g |  |
| Protéines, N x 6.25 | 10.1 | g |  |
| Rétinol | 0.0 | µg |  |
| Sel chlorure de sodium | 0.015 | g |  |
| Sélénium |  | µg | < 20 |
| Amidon | 15.8 | g |  |
| Saccharose | 0.2 | g |  |
| Sucres | 0.2 | g |  |
| Activité vitaminique A, équivalents rétinol | 1.4 | µg |  |
| Vitamine B12 | donnée manquante | µg |  |
| Vitamine B1 ou Thiamine | 0.094 | mg |  |
| Vitamine B2 ou Riboflavine | 0.022 | mg |  |
| Vitamine B3 ou PP ou Niacine | 0.52 | mg |  |
| Vitamine B5 ou Acide pantothénique | 0.24 | mg |  |
| Vitamine B6 | 0.11 | mg |  |
| Vitamine B9 ou Folates totaux, équivalents folates alimentaires, DFE | 50.5 | µg |  |
| Vitamine B9 ou Folates totaux | donnée manquante | µg |  |
| Vitamine C |  | mg | < 0.5 |
| Vitamine D2 (ergocalciférol) |  | µg | < 0.25 |
| Vitamine D3 (cholécalciférol) | 0.0 | µg |  |
| Vitamine D |  | µg | < 0.25 |
| Vitamine E | donnée manquante | mg |  |
| Vitamine K1 | 2.65 | µg |  |
| Vitamine K2 | donnée manquante | µg |  |
| Eau | 64.8 | g |  |
| Zinc | 1.25 | mg |  |

DQR Agribalyse : 3.01

| Indicateur (par kg de produit) | Valeur | Unité |
|---|---|---|
| Acidification | 0.00243 | mol H+ éq. |
| Écotoxicité eau douce | 60.4 | CTUe |
| Score unique environnemental EF | 0.0887 | mPt |
| Eutrophisation eau douce | 0.000243 | kg P éq. |
| Eutrophisation marine | 0.000573 | kg N éq. |
| Eutrophisation terrestre | 0.00717 | mol N éq. |
| Gaz à effet de serre (100 ans) | 0.466 | kg CO2e |
| Gaz à effet de serre — émissions biogéniques | 0.00452 | kg CO2e |
| Gaz à effet de serre — émissions fossiles | 0.454 | kg CO2e |
| Gaz à effet de serre — changement d'affectation des sols | 0.00788 | kg CO2e |
| Toxicité humaine, effets cancérogènes | 1.63e-09 | CTUh |
| Toxicité humaine, effets non cancérogènes | 1.02e-08 | CTUh |
| Rayonnements ionisants | 0.3 | kBq U-235 éq. |
| Utilisation des sols (indice de qualité des sols) | 133.0 | Pt |
| Appauvrissement de la couche d'ozone | 1.38e-08 | kg CFC-11 éq. |
| Particules fines | 2.5e-08 | incidence |
| Formation photochimique d'ozone | 0.00206 | kg COVNM éq. |
| Épuisement des ressources énergétiques | 11.7 | MJ |
| Épuisement des ressources minérales | 3.51e-06 | kg Sb éq. |
| Eau (pondérée par la raréfaction) | 0.107 | m³ éq. |

### 20904 — Tofu nature, préemballé

is_animal = False, animal_category = nan

| Nutriment (pour 100 g) | Valeur | Unité | Qualificatif |
|---|---|---|---|
| Alcool (éthanol) | 0.0 | g |  |
| Alpha-tocophérol (vitamine E) | 0.71 | mg |  |
| Cendres | 1.02 | g |  |
| Beta-Carotène |  | µg | < 5 |
| Calcium | 100.0 | mg |  |
| Glucides | 2.87 | g |  |
| Cholestérol | 0.0 | mg |  |
| Chlorure | 74.7 | mg |  |
| Cuivre | 0.24 | mg |  |
| Energie, Règlement UE N° 1169/2011 | 147.0 | kcal |  |
| Energie, Règlement UE N° 1169/2011 | 615.0 | kJ |  |
| Energie, N x facteur Jones, avec fibres | 142.0 | kcal |  |
| Energie, N x facteur Jones, avec fibres | 593.0 | kJ |  |
| AG 10:0, caprique |  | g | < 0.01 |
| AG 12:0, laurique |  | g | < 0.01 |
| AG 14:0, myristique | 0.02 | g |  |
| AG 16:0, palmitique | 0.89 | g |  |
| AG 18:0, stéarique | 0.38 | g |  |
| AG 18:1 9c (n-9), oléique | 1.79 | g |  |
| AG 18:2 9c,12c (n-6), linoléique | 4.26 | g |  |
| AG 18:3 c9,c12,c15 (n-3), alpha-linolénique | 0.55 | g |  |
| AG 20:4 5c,8c,11c,14c (n-6), arachidonique |  | g | < 0.01 |
| AG 20:5 5c,8c,11c,14c,17c (n-3) EPA |  | g | < 0.01 |
| AG 22:6 4c,7c,10c,13c,16c,19c (n-3) DHA |  | g | < 0.01 |
| AG 4:0, butyrique |  | g | < 0.01 |
| AG 6:0, caproïque |  | g | < 0.01 |
| AG 8:0, caprylique |  | g | < 0.01 |
| AG monoinsaturés | 1.91 | g |  |
| AG polyinsaturés | 4.81 | g |  |
| AG saturés | 1.35 | g |  |
| Lipides | 8.5 | g |  |
| Fer | 2.4 | mg |  |
| Fibres alimentaires |  | g | < 0.5 |
| Folates intrinsèques | donnée manquante | µg |  |
| Acide folique (enrichissement) | donnée manquante | µg |  |
| Fructose |  | g | < 0.1 |
| Galactose |  | g | < 0.1 |
| Glucose | 0.18 | g |  |
| Iode |  | µg | < 20 |
| Potassium | 140.0 | mg |  |
| Lactose |  | g | < 0.1 |
| Maltose |  | g | < 0.1 |
| Magnésium | 100.0 | mg |  |
| Manganèse | 0.93 | mg |  |
| Sodium | 10.0 | mg |  |
| Acides organiques | 0.16 | g |  |
| Phosphore | 210.0 | mg |  |
| Polyols totaux |  | g | traces |
| Protéines, N x facteur de Jones | 13.4 | g |  |
| Protéines, N x 6.25 | 14.7 | g |  |
| Rétinol | 0.0 | µg |  |
| Sel chlorure de sodium | 0.025 | g |  |
| Sélénium |  | µg | < 20 |
| Amidon |  | g | < 0.35 |
| Saccharose | 0.39 | g |  |
| Sucres | 0.57 | g |  |
| Activité vitaminique A, équivalents rétinol | 0.21 | µg |  |
| Vitamine B12 | 0.0 | µg |  |
| Vitamine B1 ou Thiamine | 0.024 | mg |  |
| Vitamine B2 ou Riboflavine |  | mg | < 0.01 |
| Vitamine B3 ou PP ou Niacine | 0.13 | mg |  |
| Vitamine B5 ou Acide pantothénique | 0.14 | mg |  |
| Vitamine B6 | 0.028 | mg |  |
| Vitamine B9 ou Folates totaux, équivalents folates alimentaires, DFE | donnée manquante | µg |  |
| Vitamine B9 ou Folates totaux | 25.1 | µg |  |
| Vitamine C |  | mg | < 0.5 |
| Vitamine D2 (ergocalciférol) |  | µg | < 0.25 |
| Vitamine D3 (cholécalciférol) |  | µg | traces |
| Vitamine D |  | µg | < 0.25 |
| Vitamine E | donnée manquante | mg |  |
| Vitamine K1 | 12.7 | µg |  |
| Vitamine K2 | donnée manquante | µg |  |
| Eau | 73.8 | g |  |
| Zinc | 1.3 | mg |  |

DQR Agribalyse : 2.04

| Indicateur (par kg de produit) | Valeur | Unité |
|---|---|---|
| Acidification | 0.00372 | mol H+ éq. |
| Écotoxicité eau douce | 6.34 | CTUe |
| Score unique environnemental EF | 0.11 | mPt |
| Eutrophisation eau douce | 0.000176 | kg P éq. |
| Eutrophisation marine | 0.00321 | kg N éq. |
| Eutrophisation terrestre | 0.0114 | mol N éq. |
| Gaz à effet de serre (100 ans) | 1.0 | kg CO2e |
| Gaz à effet de serre — émissions biogéniques | 0.0161 | kg CO2e |
| Gaz à effet de serre — émissions fossiles | 0.986 | kg CO2e |
| Gaz à effet de serre — changement d'affectation des sols | 0.00187 | kg CO2e |
| Toxicité humaine, effets cancérogènes | 4.97e-10 | CTUh |
| Toxicité humaine, effets non cancérogènes | 3.56e-08 | CTUh |
| Rayonnements ionisants | 0.703 | kBq U-235 éq. |
| Utilisation des sols (indice de qualité des sols) | -19.8 | Pt |
| Appauvrissement de la couche d'ozone | 3.3e-08 | kg CFC-11 éq. |
| Particules fines | 4.46e-08 | incidence |
| Formation photochimique d'ozone | 0.00318 | kg COVNM éq. |
| Épuisement des ressources énergétiques | 27.5 | MJ |
| Épuisement des ressources minérales | 5.15e-06 | kg Sb éq. |
| Eau (pondérée par la raréfaction) | 0.258 | m³ éq. |
