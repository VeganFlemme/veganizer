import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import UnknownValueFormat, infer_state, parse_ciqual_value, parse_number  # noqa: E402


class ParseCiqualValue(unittest.TestCase):
    def test_missing_is_null_never_zero(self):
        self.assertEqual(parse_ciqual_value("-"), (None, None))
        self.assertEqual(parse_ciqual_value(""), (None, None))
        self.assertEqual(parse_ciqual_value(None), (None, None))

    def test_traces_and_less_than_keep_a_qualifier(self):
        self.assertEqual(parse_ciqual_value("traces"), (None, "traces"))
        self.assertEqual(parse_ciqual_value("< 0,2"), (None, "< 0.2"))
        self.assertEqual(parse_ciqual_value("<20"), (None, "< 20"))

    def test_decimal_comma_and_real_zero(self):
        self.assertEqual(parse_ciqual_value("12,5"), (12.5, None))
        self.assertEqual(parse_ciqual_value("0"), (0.0, None))

    def test_unknown_format_stops(self):
        with self.assertRaises(UnknownValueFormat):
            parse_ciqual_value("n.d.")


class ParseNumber(unittest.TestCase):
    def test_scientific_and_comma(self):
        self.assertEqual(parse_number("2.93e-7"), 2.93e-7)
        self.assertEqual(parse_number("0,5"), 0.5)
        self.assertEqual(parse_number("-0.108"), -0.108)

    def test_garbage_stops(self):
        with self.assertRaises(UnknownValueFormat):
            parse_number("abc")


class InferState(unittest.TestCase):
    def test_cases(self):
        self.assertEqual(infer_state("Haricot vert, cru"), "cru")
        self.assertEqual(infer_state("Lentille verte, bouillie/cuite à l'eau"), "cuit")
        self.assertEqual(infer_state("Boeuf, steak haché, cuit (aliment moyen)"), "cuit")
        self.assertIsNone(infer_state("Camembert au lait cru"))
        self.assertIsNone(infer_state("Biscuit sec"))
        self.assertIsNone(infer_state("Poêlée de légumes, surgelée, crue"))


if __name__ == "__main__":
    unittest.main()
