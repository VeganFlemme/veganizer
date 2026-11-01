"""Reviewed match of the AGRIBALYSE 3.0 recipe inputs (step 3 bis): structure of the CSV."""

import csv
import re
import unittest
from pathlib import Path

MAPPING = Path(__file__).resolve().parents[1] / "agribalyse_recipe_ingredients.csv"
CODE = re.compile(r"^\d+(_\d+)?$")


class MappingTest(unittest.TestCase):
    def setUp(self) -> None:
        with MAPPING.open(encoding="utf-8") as f:
            self.rows = list(csv.DictReader(f))

    def test_one_row_per_flow(self) -> None:
        flows = [r["flow"] for r in self.rows]
        self.assertEqual(len(flows), len(set(flows)))

    def test_codes_are_ciqual_or_agribalyse_codes(self) -> None:
        for r in self.rows:
            if r["code"]:
                self.assertRegex(r["code"], CODE, r["flow"])

    def test_an_input_without_code_says_why(self) -> None:
        # Never a guessed code: an empty code always carries the reason (rules 9 and 11).
        for r in self.rows:
            if not r["code"]:
                self.assertTrue(r["note"].strip(), r["flow"])

    def test_an_input_without_code_says_whether_it_may_be_animal(self) -> None:
        for r in self.rows:
            if not r["code"]:
                self.assertIn(r["unmapped_is_animal"], ("true", "false"), r["flow"])
            else:
                self.assertEqual(r["unmapped_is_animal"], "", r["flow"])

    def test_known_matches(self) -> None:
        by = {r["flow"]: r for r in self.rows}
        self.assertEqual(by["Ground beef, fresh, for processing/FR U"]["code"], "6254")
        self.assertEqual(by["Pepper, green, peeled, at processing/FR U"]["code"], "20085")  # poivron, not pepper
        self.assertEqual(by["Mushroom, peeled, at processing/FR U"]["code"], "")  # no impact (rule 11)


if __name__ == "__main__":
    unittest.main()
