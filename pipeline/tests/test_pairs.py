import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pairs import COMPOSED_GROUP, DISHES_CSV, PAIRS_CSV, PairError, composed_dish_error, load_animal_composition, read_csv, validate  # noqa: E402


def dish(slug, kind, variant="", pair="p", rationale="même rôle"):
    return {"pair": pair, "dish_slug": slug, "kind": kind, "variant": variant, "name_fr": slug,
            "servings": "4", "description": "", "rationale": rationale if kind == "vegetal" else ""}


def ing(slug, kind, code, grams="100", variant="", pair="p"):
    return {"pair": pair, "dish_slug": slug, "kind": kind, "variant": variant, "food_code": code, "grams": grams, "note": ""}


DISHES = [dish("a", "animal"), dish("m", "vegetal", "maison"), dish("c", "vegetal", "commerce")]
COMPOSITION = {"6255": "pur", "25081": "mixte"}


def ings(**over):
    rows = [ing("a", "animal", "6255"), ing("m", "vegetal", "20587", variant="maison"),
            ing("c", "vegetal", "30181", variant="commerce")]
    return rows + over.get("extra", [])


class ValidatePairs(unittest.TestCase):
    def test_valid_files_pass(self):
        validate(DISHES, ings(), COMPOSITION)

    def test_mixed_animal_food_is_refused(self):
        with self.assertRaisesRegex(PairError, "mixed animal food"):
            validate(DISHES, ings(extra=[ing("a", "animal", "25081")]), COMPOSITION)

    def test_animal_food_in_plant_dish_is_refused(self):
        with self.assertRaisesRegex(PairError, "animal food in plant dish"):
            validate(DISHES, ings(extra=[ing("m", "vegetal", "6255", variant="maison")]), COMPOSITION)

    def test_repeated_code_must_be_merged(self):
        with self.assertRaisesRegex(PairError, "repeated"):
            validate(DISHES, ings(extra=[ing("m", "vegetal", "20587", variant="maison")]), COMPOSITION)

    def test_grams_must_be_positive(self):
        with self.assertRaisesRegex(PairError, "grams"):
            validate(DISHES, ings(extra=[ing("c", "vegetal", "17130", grams="0", variant="commerce")]), COMPOSITION)

    def test_each_pair_needs_maison_and_commerce(self):
        with self.assertRaisesRegex(PairError, "expected one animal dish"):
            validate(DISHES[:2], ings()[:2], COMPOSITION)

    def test_plant_dish_needs_a_rationale(self):
        bad = [DISHES[0], dish("m", "vegetal", "maison", rationale=" "), DISHES[2]]
        with self.assertRaisesRegex(PairError, "rationale"):
            validate(bad, ings(), COMPOSITION)


class RepositoryFiles(unittest.TestCase):
    """The versioned CSV files themselves must pass the offline checks."""

    def test_pair_files_are_valid(self):
        validate(read_csv(DISHES_CSV), read_csv(PAIRS_CSV), load_animal_composition())

    def test_at_least_ten_pairs_with_four_servings(self):
        dishes = read_csv(DISHES_CSV)
        self.assertGreaterEqual(len({d["pair"] for d in dishes}), 10)
        self.assertTrue(all(d["servings"] == "4" for d in dishes))


if __name__ == "__main__":
    unittest.main()


class ComposedDishException(unittest.TestCase):
    FOOD = {"code": "25593", "name_fr": "Galette", "is_animal": False, "food_group": COMPOSED_GROUP}

    def row(self, kind="vegetal", check="détail Agribalyse vérifié"):
        r = ing("c", kind, "25593", variant="commerce" if kind == "vegetal" else "")
        r["rule9_check"] = check
        return r

    def test_checked_plant_product_is_accepted(self):
        self.assertIsNone(composed_dish_error(self.row(), self.FOOD))

    def test_missing_check_is_refused(self):
        self.assertRegex(composed_dish_error(self.row(check=""), self.FOOD), "rule9_check")

    def test_animal_composed_dish_is_refused(self):
        self.assertRegex(composed_dish_error(self.row(), {**self.FOOD, "is_animal": True}), "only a plant product")

    def test_composed_dish_in_animal_recipe_is_refused(self):
        self.assertRegex(composed_dish_error(self.row(kind="animal"), self.FOOD), "only a plant product")

    def test_other_groups_are_not_concerned(self):
        self.assertIsNone(composed_dish_error(self.row(check=""), {**self.FOOD, "food_group": "viandes"}))

    def test_every_composed_product_of_the_csv_is_checked(self):
        rows = read_csv(PAIRS_CSV)
        checked = {r["food_code"] for r in rows if r["rule9_check"].strip()}
        self.assertEqual(checked, {"25593", "25227_1", "25589_1", "25229", "30181", "20914"})
        self.assertTrue(all(r["kind"] == "vegetal" for r in rows if r["rule9_check"].strip()))
