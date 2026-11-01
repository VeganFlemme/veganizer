import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from cooking_yields import find_rows  # noqa: E402

ROW = {"NDB": "23574", "Yield Description": "Beef, ground, medium fat (12%-22%), patty", "Preparation Method1": "Pan-broiled",
       " Cooking Yield %": "73", "n": "4", "Yield Minimum %": "70.78", "Yield Maximum %": "75.97", "Release Year2": "2002"}
MAP = [{"cooked_code": "6255", "raw_code": "6254", "usda_ndb": "23574", "usda_preparation": "Pan-broiled", "notes": ""}]


class FindRows(unittest.TestCase):
    def test_yield_and_bounds(self):
        (r,) = find_rows([ROW], MAP)
        self.assertEqual((r["yield_pct"], r["yield_min"], r["yield_max"]), (73.0, 70.78, 75.97))
        self.assertIn("NDB 23574", r["reference"])

    def test_missing_or_ambiguous_row_stops(self):
        with self.assertRaises(ValueError):
            find_rows([], MAP)
        with self.assertRaises(ValueError):
            find_rows([ROW, ROW], MAP)


if __name__ == "__main__":
    unittest.main()
