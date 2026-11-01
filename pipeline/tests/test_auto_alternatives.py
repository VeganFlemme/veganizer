import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from auto_alternatives import RULES, build_rows, read_rules  # noqa: E402


def f(code, name, sub, animal=False, protein=10.0, kcal=100.0, ghg=1.0):
    return {"code": code, "name_fr": name, "is_animal": animal, "food_subgroup": sub, "protein": protein, "kcal": kcal, "ghg": ghg}


class BuildRows(unittest.TestCase):
    rules = read_rules()

    def test_closest_protein_first_at_most_three(self):
        foods = [f("A", "Boeuf, cuit", "viandes cuites", animal=True, protein=26),
                 f("T", "Tofu nature", "ingrédients pour végétariens", protein=13),
                 f("S", "Seitan", "ingrédients pour végétariens", protein=21),
                 f("P", "Tempeh", "ingrédients pour végétariens", protein=16),
                 f("L", "Lentille verte, bouillie/cuite à l'eau", "légumineuses", protein=10)]
        rows = build_rows(foods, self.rules)
        self.assertEqual([r["plant_code"] for r in rows], ["S", "P", "T"])

    def test_raw_legumes_and_animal_or_incomplete_candidates_excluded(self):
        foods = [f("A", "Oeuf cru", "oeufs", animal=True, protein=13),
                 f("L1", "Lentille, sèche", "légumineuses", protein=25),
                 f("L2", "Lentille, bouillie/cuite à l'eau", "légumineuses", protein=10),
                 f("X", "Tofu mystère", "ingrédients pour végétariens", protein=13, ghg=None),
                 f("M", "Galette au fromage", "ingrédients pour végétariens", animal=True, protein=13)]
        rows = build_rows(foods, self.rules)
        self.assertEqual([r["plant_code"] for r in rows], ["L2"])

    def test_name_pattern_rule(self):
        foods = [f("A", "Lait demi-écrémé", "laits", animal=True, protein=3.4),
                 f("B", "Boisson au soja, nature", "boissons sans alcool", protein=3.2),
                 f("C", "Jus d'orange", "boissons sans alcool", protein=0.7)]
        self.assertEqual([r["plant_code"] for r in build_rows(foods, self.rules)], ["B"])

    def test_same_family_and_shared_words_first_for_composed_dishes(self):
        foods = [f("A", "Lasagnes à la bolognaise", "plats composés", animal=True, protein=6),
                 f("G", "Galette de céréales", "plats composés", protein=6),
                 f("L", "Lasagnes aux légumes", "plats composés", protein=4),
                 f("V", "Lasagnes végétariennes", "plats végétariens", protein=6)]
        self.assertEqual([r["plant_code"] for r in build_rows(foods, self.rules)], ["L", "V"])

    def test_composed_dish_without_same_type_gets_no_alternative(self):
        foods = [f("A", "Pizza bolognaise", "pizzas, tartes et crêpes salées", animal=True, protein=9),
                 f("G", "Galette ou pavé au soja", "plats végétariens", protein=13)]
        self.assertEqual(build_rows(foods, self.rules), [])

    def test_rules_file_parses(self):
        self.assertIn("viandes cuites", read_rules(RULES))


if __name__ == "__main__":
    unittest.main()
