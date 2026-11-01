import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from substitutions import CSV_PATH, read_rules  # noqa: E402


class Rules(unittest.TestCase):
    def test_repository_file_is_valid_and_justified(self):
        rules = read_rules(CSV_PATH)
        self.assertGreater(len(rules), 5)
        self.assertTrue(all(r["justification"] for r in rules))

    def test_ratio_basis_of_the_reviewed_rules(self):
        rules = {r["priority"]: r for r in read_rules(CSV_PATH)}
        # Butter → oil: same quantity of fat, from the Ciqual lipids (no value in the file).
        self.assertEqual(rules["80"]["ratio_basis"], "fat_g")
        self.assertIn("même quantité de matière grasse", rules["80"]["justification"])
        # Raw meat → seitan: USDA cooking yield when published, else ratio 1 (written in the justification).
        self.assertEqual(rules["31"]["ratio_basis"], "cooking_yield")
        self.assertEqual(rules["31"]["ratio"], "1")
        self.assertIn("rendement de cuisson", rules["31"]["justification"])

    def test_bad_ratio_basis_stops(self):
        import csv
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["priority", "match_type", "match_value", "to_code", "ratio", "ratio_basis", "justification"])
            w.writerow(["1", "subgroup", "beurres", "17130", "1", "au_doigt", "j"])
        with self.assertRaises(ValueError):
            read_rules(Path(fh.name))

    def test_bad_type_stops(self):
        import csv
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["priority", "match_type", "match_value", "to_code", "ratio", "ratio_basis", "justification"])
            w.writerow(["1", "magie", "x", "20904", "1", "", "j"])
        with self.assertRaises(ValueError):
            read_rules(Path(fh.name))


if __name__ == "__main__":
    unittest.main()
