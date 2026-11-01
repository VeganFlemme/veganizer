import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faostat import compute_factors  # noqa: E402

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


if __name__ == "__main__":
    unittest.main()
