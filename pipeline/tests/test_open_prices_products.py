import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from open_prices_products import DENSITIES, read_densities, select  # noqa: E402

SINCE = date(2025, 11, 1)


def item(**kw):
    product = {"code": "123", "product_quantity": 200, "product_quantity_unit": "g", "categories_tags": ["en:plain-tofu"]}
    product.update(kw.pop("product", {}))
    base = {"id": 1, "price": 2.0, "currency": "EUR", "price_is_discounted": False, "price_per": None, "date": "2026-10-01",
            "location": {"osm_address_country_code": "FR"}, "product": product}
    base.update(kw)
    return base


class Select(unittest.TestCase):
    def test_price_per_kg_from_grams(self):
        (r,) = select([item()], "20904", "en:plain-tofu", SINCE)
        self.assertAlmostEqual(r["price_eur"], 10.0)
        self.assertEqual(r["off_barcode"], "123")

    def test_filters(self):
        bad = [item(currency="USD"), item(price_is_discounted=True), item(price_per="KILOGRAM"), item(date="2025-01-01"),
               item(location={"osm_address_country_code": "BE"}), item(product={"product_quantity_unit": "ml"}),
               item(product={"categories_tags": ["en:tofu"]}), item(product={"product_quantity": None})]
        self.assertEqual(select(bad, "20904", "en:plain-tofu", SINCE), [])


class Liquids(unittest.TestCase):
    def test_ml_converted_only_with_a_reviewed_density(self):
        it = item(price=3.0, product={"product_quantity": 1000, "product_quantity_unit": "ml"})
        self.assertEqual(select([it], "17130", "en:plain-tofu", SINCE), [])  # no density: excluded
        (r,) = select([it], "17130", "en:plain-tofu", SINCE, density_g_per_ml=0.92)
        self.assertAlmostEqual(r["price_eur"], 3.0 / 920 * 1000)

    def test_density_file_cites_the_fao_infoods_row(self):
        d = read_densities(DENSITIES)
        self.assertAlmostEqual(d["17130"]["density"], 0.92)
        self.assertTrue(all(x["fao_row"] for x in d.values()))


if __name__ == "__main__":
    unittest.main()
