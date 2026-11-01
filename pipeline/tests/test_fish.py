import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fish import CSV_PATH, fish_rows, read_weights  # noqa: E402

FOODS = [
    {"code": "26023", "name_fr": "Cabillaud, rôti/cuit au four", "animal_category": "poisson sauvage"},
    {"code": "26015", "name_fr": "Lieu noir, cuit", "animal_category": "poisson sauvage"},
    {"code": "26230", "name_fr": "Saumon, élevage, rôti/cuit au four", "animal_category": "saumon d'élevage"},
    {"code": "26999", "name_fr": "Sole, cuite", "animal_category": "poisson sauvage"},
]


class Fish(unittest.TestCase):
    def test_file_cites_pages(self):
        w = read_weights(CSV_PATH)
        self.assertEqual(len(w), 3)
        self.assertTrue(all(r["page"] and r["quote"] for r in w))

    def test_fishes_per_kg_from_estimated_mean_weights(self):
        rows = {r["scope"] or r["category"]: r for r in fish_rows(read_weights(CSV_PATH), FOODS)}
        s = rows["saumon d'élevage"]
        self.assertAlmostEqual(s["low"], 1000 / 6364)
        self.assertAlmostEqual(s["high"], 1000 / 4719)
        self.assertAlmostEqual(s["value"], (1000 / 6364 + 1000 / 4719) / 2)  # midpoint, as in the paper
        self.assertIsNone(s["food_codes"])  # whole category
        cod = rows["Gadus morhua"]
        self.assertEqual(cod["food_codes"], ["26023"])
        self.assertEqual(rows["Pollachius virens"]["food_codes"], ["26015"])
        self.assertEqual(cod["indicator_id"], "fish_killed")


if __name__ == "__main__":
    unittest.main()
