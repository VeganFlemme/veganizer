import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faostat import compute_dairy, compute_factors, dairy_scope  # noqa: E402

MAP = [{"animal_category": "porc", "item_code_cpc": "21113.01", "item": "Meat of pig", "notes": ""}]


def row(element, year, value, unit, flag="A", cpc="'21113.01"):
    return {"Area Code": "68", "Item Code (CPC)": cpc, "Item": "Meat of pig", "Element": element,
            "Year": str(year), "Unit": unit, "Value": str(value), "Flag": flag}


class ComputeFactors(unittest.TestCase):
    def test_heads_over_carcass_kg_with_range(self):
        rows = [row("Producing Animals/Slaughtered", 2023, 200, "An"), row("Production", 2023, 20, "t"),
                row("Producing Animals/Slaughtered", 2024, 300, "An"), row("Production", 2024, 20, "t")]
        f = compute_factors(rows, MAP)[0]
        self.assertAlmostEqual(f["value"], 300 / 20000)
        self.assertAlmostEqual(f["low"], 200 / 20000)
        self.assertAlmostEqual(f["high"], 300 / 20000)
        self.assertEqual(f["_year"], 2024)

    def test_thousand_heads_unit(self):
        rows = [row("Producing Animals/Slaughtered", 2024, 2, "1000 An"), row("Production", 2024, 1, "t")]
        self.assertAlmostEqual(compute_factors(rows, MAP)[0]["value"], 2.0)

    def test_only_official_years_with_both_figures(self):
        rows = [row("Producing Animals/Slaughtered", 2024, 300, "An", flag="E"), row("Production", 2024, 20, "t"),
                row("Producing Animals/Slaughtered", 2023, 100, "An"), row("Production", 2023, 10, "t"),
                row("Production", 2022, 10, "t")]
        f = compute_factors(rows, MAP)[0]
        self.assertEqual(f["_year"], 2023)
        self.assertEqual(f["low"], f["high"])

    def test_no_data_means_no_factor_never_zero(self):
        self.assertEqual(compute_factors([], MAP), [])

    def test_unknown_unit_stops(self):
        with self.assertRaises(ValueError):
            compute_factors([row("Production", 2024, 1, "kg"), row("Producing Animals/Slaughtered", 2024, 1, "An")], MAP)


class DairyScope(unittest.TestCase):
    def test_liquid_milk_and_yogurts_only(self):
        foods = [
            {"code": "1", "name_fr": "Lait demi-écrémé, UHT", "animal_category": "vache laitière", "food_subgroup": "laits"},
            {"code": "2", "name_fr": "Lait en poudre, entier", "animal_category": "vache laitière", "food_subgroup": "laits"},
            {"code": "3", "name_fr": "Yaourt nature", "animal_category": "vache laitière", "food_subgroup": "produits laitiers frais"},
            {"code": "4", "name_fr": "Emmental", "animal_category": "vache laitière", "food_subgroup": "fromages"},
            {"code": "5", "name_fr": "Beurre doux", "animal_category": "vache laitière", "food_subgroup": "beurres"},
            {"code": "6", "name_fr": "Lait de chèvre", "animal_category": "chèvre laitière", "food_subgroup": "laits"},
        ]
        self.assertEqual(dairy_scope(foods), ["1", "3"])


class ComputeDairy(unittest.TestCase):
    def test_days_per_kg_from_latest_official_yield(self):
        rows = [row("Yield/Carcass Weight", 2023, 7300, "kg/An", cpc="'02211"),
                row("Yield/Carcass Weight", 2024, 7300, "kg/An", flag="E", cpc="'02211")]
        (f,) = compute_dairy(rows)
        self.assertAlmostEqual(f["value"], 365 / 7300)
        self.assertEqual((f["_year"], f["per"], f["indicator_id"]), (2023, "kg", "life_days_farmed"))

    def test_unknown_yield_unit_stops(self):
        with self.assertRaises(ValueError):
            compute_dairy([row("Yield/Carcass Weight", 2024, 1, "hg/An", cpc="'02211")])


if __name__ == "__main__":
    unittest.main()
