import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from insee_prices import MAPPING, read_mapping, select  # noqa: E402

ROWS = [
    {"PRODUCT_ITEM": "8948", "FREQ": "M", "UNIT_MEASURE": "EUR", "OBS_STATUS": "A", "GEO": "FM", "TIME_PERIOD": f"2026-0{m}", "OBS_VALUE": "2.1"}
    for m in range(1, 10)
] + [
    {"PRODUCT_ITEM": "8948", "FREQ": "M", "UNIT_MEASURE": "EUR", "OBS_STATUS": "A", "GEO": "FM", "TIME_PERIOD": "2024-01", "OBS_VALUE": "1.9"},
    {"PRODUCT_ITEM": "8948", "FREQ": "M", "UNIT_MEASURE": "EUR", "OBS_STATUS": "P", "GEO": "FM", "TIME_PERIOD": "2026-09", "OBS_VALUE": "9"},
    {"PRODUCT_ITEM": "9999", "FREQ": "M", "UNIT_MEASURE": "EUR", "OBS_STATUS": "A", "GEO": "FM", "TIME_PERIOD": "2026-09", "OBS_VALUE": "5"},
]


class InseePrices(unittest.TestCase):
    def test_mapping_file_is_valid(self):
        m = read_mapping(MAPPING)
        self.assertTrue(all("(kg)" in r["libelle"] for r in m))

    def test_last_12_months_definitive_values_only(self):
        out = select(ROWS, [{"food_code": "20009", "product_item": "8948"}], last="2026-09")
        self.assertEqual(len(out), 9)  # 2024-01 too old, the provisional duplicate and unmapped series skipped
        self.assertEqual(out[0]["per"], "kg")
        self.assertEqual(out[0]["observed_on"], "2026-01-15")
        self.assertEqual(out[0]["external_id"], "8948|2026-01")


if __name__ == "__main__":
    unittest.main()
