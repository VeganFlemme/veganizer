import sys
import unittest
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agreste import compute  # noqa: E402


def sheet(rows):
    head = [["Titre", None, None, None, None, None, None], ["Données 2025 provisoires.", None, None, None, None, None, None],
            ["LIB_REG2", "LIB_SAA", "STATUT_QUALITE", "NBTETE_2024", "NBTETE_2025", "PROD_2024", "PROD_2025"]]
    return pd.DataFrame(head + rows)


class Compute(unittest.TestCase):
    def test_heads_over_carcass_kg_excluding_provisional_year(self):
        f = compute(sheet([["001 - FRANCE", "18 - Total veaux de boucherie (16 + 17)", 1, 1000, 999, 150, 1]]))
        self.assertAlmostEqual(f["value"], 1000 / 150000)
        self.assertEqual(f["_year"], 2024)

    def test_missing_row_stops(self):
        with self.assertRaises(ValueError):
            compute(sheet([["001 - FRANCE", "17 - Veaux de boucherie viande", 1, 1, 1, 1, 1]]))


if __name__ == "__main__":
    unittest.main()
