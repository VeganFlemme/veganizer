import sys
import unittest
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from open_prices import COLUMNS, select  # noqa: E402

MAP = [{"food_code": "20009", "category_tag": "en:carrots", "notes": ""}]


def obs(**kw):
    base = {"id": 1, "type": "CATEGORY", "category_tag": "en:carrots", "price": 2.0, "price_per": "KILOGRAM",
            "currency": "EUR", "date": "2026-10-01", "price_is_discounted": False, "location_osm_address_country_code": "FR"}
    base.update(kw)
    return base


class Select(unittest.TestCase):
    def test_filters(self):
        df = pd.DataFrame([obs(id=1), obs(id=2, price_per="UNIT"), obs(id=3, location_osm_address_country_code="BE"),
                           obs(id=4, price_is_discounted=True), obs(id=5, type="PRODUCT"), obs(id=6, category_tag="en:apples"),
                           obs(id=7, date="2025-09-01"), obs(id=8, currency="USD")])
        self.assertEqual(sorted(select(df, MAP)["id"]), [1])

    def test_format_change_stops(self):
        with self.assertRaises(ValueError):
            select(pd.DataFrame([{c: None for c in COLUMNS[:-1]}]), MAP)


if __name__ == "__main__":
    unittest.main()
