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

    def test_bad_type_stops(self):
        import csv
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["priority", "match_type", "match_value", "to_code", "ratio", "justification"])
            w.writerow(["1", "magie", "x", "20904", "1", "j"])
        with self.assertRaises(ValueError):
            read_rules(Path(fh.name))


if __name__ == "__main__":
    unittest.main()
