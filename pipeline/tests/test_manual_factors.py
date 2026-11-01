import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from manual_factors import CSV_PATH, validate  # noqa: E402
import csv  # noqa: E402

OK = {"category": "saumon d'élevage", "indicator_id": "fish_killed", "value": "0.2", "low": "", "high": "",
      "unit_basis": "par kg", "source_id": "fishcount", "source_url": "https://example.org/p", "page": "tableau 3",
      "quote": "4.5 kg", "accessed_on": "2026-11-01"}


class Validate(unittest.TestCase):
    def test_complete_row_passes(self):
        self.assertEqual(validate([OK]), [])

    def test_page_and_quote_are_mandatory(self):
        self.assertTrue(validate([{**OK, "page": ""}]))
        self.assertTrue(validate([{**OK, "quote": " "}]))

    def test_repository_file_is_valid(self):
        with open(CSV_PATH, newline="", encoding="utf-8") as fh:
            self.assertEqual(validate(list(csv.DictReader(fh))), [])


if __name__ == "__main__":
    unittest.main()
