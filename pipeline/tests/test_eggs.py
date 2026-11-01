import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from eggs import CSV_PATH, CYCLE_PATH, egg_factor, egg_scope, latest_yield, pain_per_kg_rows, read_cycle, read_mass  # noqa: E402

ROWS = [
    {"Item": "Hen eggs in shell, fresh", "Element": "Yield", "Unit": "No/An", "Year": "2022", "Value": "250", "Flag": "A"},
    {"Item": "Hen eggs in shell, fresh", "Element": "Yield", "Unit": "No/An", "Year": "2023", "Value": "257", "Flag": "A"},
    {"Item": "Hen eggs in shell, fresh", "Element": "Yield", "Unit": "No/An", "Year": "2024", "Value": "260", "Flag": "E"},
]


class Eggs(unittest.TestCase):
    def test_latest_official_yield(self):
        self.assertEqual(latest_yield(ROWS), (2023, 257.0))

    def test_days_of_life_per_kg_of_eggs(self):
        f = egg_factor(257.0, 2023, {"value_g": "60", "low_g": "", "high_g": "", "page": "p", "quote": "q"}, ["22000"])
        self.assertAlmostEqual(f["value"], 365 / (257 * 0.060))
        self.assertIsNone(f["low"])
        self.assertEqual(f["category"], "poule pondeuse")
        self.assertEqual(f["food_codes"], ["22000"])

    def test_mass_file_cites_the_page(self):
        m = read_mass(CSV_PATH)
        self.assertEqual(float(m["value_g"]), 60)
        self.assertTrue(m["page"] and m["quote"])

    def test_pain_per_kg_of_eggs_from_the_laying_cycle(self):
        cycle = read_cycle(CYCLE_PATH)
        self.assertEqual(float(cycle["eggs_per_hen"]), 300)
        per_hen = [{"category": "poule pondeuse", "indicator_id": "pain_hours_hurtful", "value": 1742.0, "low": None, "high": 1800.0, "per": "animal"}]
        rows = pain_per_kg_rows(per_hen, cycle, {"value_g": "60"}, ["22000"])
        self.assertEqual(len(rows), 1)
        self.assertAlmostEqual(rows[0]["value"], 1742 / (300 * 0.060))
        self.assertAlmostEqual(rows[0]["high"], 1800 / 18)
        self.assertIsNone(rows[0]["low"])
        self.assertEqual((rows[0]["per"], rows[0]["food_codes"], rows[0]["source_id"]), ("kg", ["22000"], "agri-bien-etre-poules"))

    def test_scope_is_hen_eggs(self):
        foods = [{"code": "22000", "animal_category": "poule pondeuse", "food_subgroup": "oeufs"},
                 {"code": "9", "animal_category": "poule pondeuse", "food_subgroup": "pâtes"}]
        self.assertEqual(egg_scope(foods), ["22000"])


if __name__ == "__main__":
    unittest.main()
