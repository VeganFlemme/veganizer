import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from milk_equivalents import CSV_PATH, cheese_factor, cheese_scope, read_rates  # noqa: E402


class MilkEquivalents(unittest.TestCase):
    def test_repository_file_cites_pages_and_only_cheese_applies(self):
        rates = read_rates(CSV_PATH)
        self.assertEqual({r["product"] for r in rates if r["apply"] == "yes"}, {"fromage"})
        self.assertTrue(all(r["page"] and r["quote"] for r in rates))

    def test_factor_per_kg_of_cheese(self):
        f = cheese_factor({"value": 0.05, "source_id": "faostat-qcl", "notes": "x"}, 13.0, ["C1"])
        self.assertAlmostEqual(f["value"], 0.05 * 100 / 13)
        self.assertEqual(f["food_codes"], ["C1"])
        self.assertEqual(f["per"], "kg")

    def test_scope_is_cow_cheese_only(self):
        foods = [
            {"code": "1", "name_fr": "Emmental", "animal_category": "vache laitière", "food_subgroup": "fromages et alternatives végétales"},
            {"code": "2", "name_fr": "Fromage blanc", "animal_category": "vache laitière", "food_subgroup": "produits laitiers frais et alternatives végétales"},
            {"code": "3", "name_fr": "Chèvre frais", "animal_category": "chèvre", "food_subgroup": "fromages et alternatives végétales"},
            {"code": "4", "name_fr": "Beurre", "animal_category": "vache laitière", "food_subgroup": "beurres"},
        ]
        self.assertEqual(cheese_scope(foods), ["1"])


if __name__ == "__main__":
    unittest.main()
