# Idées pour la V2 (à ne pas exécuter dans la suite V1)

Liste tenue par la relectrice. Claude Code : ne traite pas ce fichier pendant la suite V1.

- **Panier végétal « en tout point »** (Matt, 1er nov. 19 h) : pour un produit brut (dorade, œuf, fromage, steak…), chercher dans tout le catalogue végétal Ciqual et Agribalyse la combinaison d'aliments courants qui couvre tous ses nutriments, avec des portions réalistes. Contraintes : aliments courants, nombre d'ingrédients limité, quantités plausibles, jamais de dose de complément. Afficher ce qui reste à couvrir (B12…). Aujourd'hui, la version complétée ne puise que dans une liste blanche de quelques aliments.
- **Sélecteur version de base / complétée** : à réévaluer à l'usage (Matt hésitait à afficher directement la version complétée).
- **Comparaisons de produits courants mises en avant** sur l'accueil (lait / boisson d'avoine, beurre / margarine, steak / galette…).
- **Relecture par une vraie diététicienne** et vérification des licences avant toute monétisation.
- **Ajustement total et changement automatique d'alternative** (Matt, 1er nov. 19 h 41) : chaque indicateur du tableau devient réglable (égaler le plat animal, au moins, au plus, ou une valeur choisie : lipides, glucides, fibres, sucres, sel, vitamines, minéraux…). Le moteur calcule les quantités et les ajouts. Si la protéine choisie ne permet pas d'atteindre les souhaits (par exemple lentilles + moins de glucides + plus de protéines), il essaie toutes les protéines candidates et propose la plus proche des souhaits (par exemple les protéines de soja texturées), en expliquant pourquoi il a changé.
  - Contraintes : jamais de critère CO₂e, prix ou score pour ce choix, seulement les souhaits nutritionnels du visiteur ; aliments courants, quantités plausibles, nombre d'ajouts limité, pas de dose de complément ; dire clairement quand c'est impossible et pourquoi.
  - Faisable dans le navigateur : environ 35 protéines candidates × un petit programme linéaire chacune.
  - Base technique préparée en V1 (étape 3 quinquies, point 8 bis).
- **Acides aminés essentiels et qualité des protéines** (Matt, 1er nov. 20 h 07). Ciqual 2025 ne contient aucun acide aminé (vérifié) : le site ne montre aujourd'hui que le conseil qualitatif de l'Anses (céréales pauvres en lysine, légumineuses en acides aminés soufrés ; varier sur la journée suffit).
  - Piste : profils en acides aminés de l'USDA FoodData Central (domaine public, à vérifier), reliés aux codes Ciqual par une table relue, puis comparaison au profil de référence FAO 2013 (« Dietary protein quality evaluation in human nutrition ») : acide aminé limitant et indice chimique du plat, avec fourchette. DIAAS seulement si des digestibilités publiées et citables existent pour nos aliments.
  - Dans le panneau d'ajustement : un interrupteur « Compléter les acides aminés », qui ajoute une céréale à une légumineuse, ou l'inverse.
  - Prudence : la table de correspondance entre deux bases est une source d'erreurs ; la relire à la main, ou par un agent, aliment par aliment.

## Après la V2 — vision « par niveaux » (Matt, 1er nov. 20 h 52)

> Mise à jour 20 h 54 : les phases A et B (sans allergies garanties) sont intégrées à la suite de cette nuit (étapes 8 bis et 8 ter). La phase C, le goût et les acides aminés sont écartés pour l'instant (décision de Matt).

Comparer et ajuster la version végétale à quatre niveaux : un aliment, un plat (entrée, plat ou dessert), un repas complet (entrée, plat, dessert, accompagnements), une journée. Selon les objectifs du visiteur (calories, protéines, perte ou prise de poids, IMC, allergies et intolérances), avec les acides aminés. Même moteur que l'ajustement (contraintes et programme linéaire), à plus grande échelle.

Découpage proposé, du moins risqué au plus risqué :
- **Phase A, factuelle** : comparer un repas complet (somme de plats) et une journée type, animal et végétal, avec les mêmes 5 catégories. Aucun objectif personnel.
- **Phase B, objectifs choisis par le visiteur** : il entre lui-même ses cibles (calories, protéines par repas ou par jour) et le moteur ajuste. Il peut aussi exclure des aliments (goûts, allergies), avec une mention visible : « ne garantit pas l'absence d'allergènes : vérifiez toujours les étiquettes ». Proposer des alternatives proches « en usage » grâce à des règles de rôle et de texture (aucune donnée ouverte ne mesure le goût).
- **Phase C, seulement après validation par un·e diététicien·ne et une vérification juridique** : objectifs de perte ou de prise de poids, cibles calculées à partir de l'IMC, plans garantis sans allergène. C'est du conseil nutritionnel personnalisé, contraire à la règle 6 en l'état. Risques : allergies (Ciqual n'a pas de données d'allergènes ; celles d'Open Food Facts sont incomplètes) et publics fragiles (troubles alimentaires).
- **Acides aminés** : voir l'entrée plus haut.
