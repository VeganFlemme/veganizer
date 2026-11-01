import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from welfare_footprint import compute  # noqa: E402


def ind(unit, entities):
    meta = {"name": "x", "unit": unit, "catalogPath": "p", "origins": [{"citationFull": "c"}],
            "dimensions": {"entities": {"values": [{"id": n, "name": name} for n, (name, _) in enumerate(entities)]}}}
    data = {"entities": list(range(len(entities))), "values": [v for _, v in entities], "years": [2021] * len(entities)}
    return meta, data


class Compute(unittest.TestCase):
    def test_broiler_seconds_to_hours_fast_growing(self):
        (r,) = compute({791314: ind("seconds", [("Fast-growing", 36), ("Slower-growing", 7.2)])})
        self.assertAlmostEqual(r["value"], 0.01)
        self.assertEqual(r["per"], "animal")
        self.assertIn("non utilisé", r["notes"])

    def test_hens_aviary_value_and_furnished_high(self):
        (r,) = compute({789454: ind("hours", [("Battery cages", 9), ("Cage-free aviary", 2), ("Furnished cages", 6)])})
        self.assertEqual((r["value"], r["low"], r["high"]), (2, 2, 6))

    def test_high_never_below_value(self):
        (r,) = compute({789451: ind("hours", [("Cage-free aviary", 156), ("Furnished cages", 155)])})
        self.assertEqual(r["high"], 156)

    def test_days_columns_are_refused(self):
        with self.assertRaises(ValueError):
            compute({789454: ind("days", [("Cage-free aviary", 1), ("Furnished cages", 1)])})


if __name__ == "__main__":
    unittest.main()
