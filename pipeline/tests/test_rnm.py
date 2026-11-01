import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rnm import monthly_rows, parse_sylk, select  # noqa: E402

SYLK = "\n".join([
    "ID;PWXL;N;E", 'F;SM5;X1;Y1', 'C;K"Légumes France DETAIL GMS - RNM"',
    'F;X1;Y5', 'C;K"libellé"', 'F;X2;Y5', 'C;K"unité"', 'F;X3;Y5', 'C;K"Nove. 2025"', 'F;X4;Y5', 'C;K"Déce. 2025"',
    'C;X1;Y6;K"CAROTTE France lavée vrac"', 'C;X2;Y6;K"le kg"', 'C;X3;Y6;K1.68', 'C;X4;Y6;K1.70',
    'C;X1;Y7;K"LAITUE Batavia France"', 'C;X2;Y7;K"la pièce"', 'C;X3;Y7;K1.23',
])
MAP = [{"food_code": "20009", "market": "2502", "libelle": "CAROTTE France lavée vrac", "notes": ""}]


class Rnm(unittest.TestCase):
    def test_parse_and_select_per_kg_months(self):
        rows = monthly_rows(parse_sylk(SYLK), 2502)
        prices = select(rows, MAP)
        self.assertEqual([p["price_eur"] for p in prices], [1.68, 1.70])
        self.assertEqual(prices[0]["observed_on"], date(2025, 11, 15).isoformat())
        self.assertEqual(prices[0]["per"], "kg")

    def test_unit_other_than_kg_stops(self):
        rows = monthly_rows(parse_sylk(SYLK), 2502)
        with self.assertRaises(ValueError):
            select(rows, [{"food_code": "20031", "market": "2502", "libelle": "LAITUE Batavia France", "notes": ""}])

    def test_layout_change_stops(self):
        with self.assertRaises(ValueError):
            monthly_rows(parse_sylk(SYLK.replace("libellé", "produit")), 2502)


if __name__ == "__main__":
    unittest.main()
