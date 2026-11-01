import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pairs import (  # noqa: E402
    COMPOSED_GROUP, DISHES_CSV, PAIRS_CSV, PairError, composed_dish_error, load_animal_composition, protein_objective, read_csv,
    recipe_rule_errors, stale_pairs, validate,
)


def dish(slug, kind, variant="", pair="p", rationale="même rôle"):
    return {"pair": pair, "dish_slug": slug, "kind": kind, "variant": variant, "name_fr": slug,
            "servings": "4", "description": "", "rationale": rationale if kind == "vegetal" else ""}


def ing(slug, kind, code, grams="100", variant="", pair="p", protein="", replaces=""):
    return {"pair": pair, "dish_slug": slug, "kind": kind, "variant": variant, "food_code": code, "grams": grams, "note": "",
            "protein_source": protein, "replaces": replaces}


DISHES = [dish("a", "animal"), dish("m", "vegetal", "maison"), dish("c", "vegetal", "commerce")]
COMPOSITION = {"6255": "pur", "25081": "mixte"}


def ings(**over):
    rows = [ing("a", "animal", "6255", protein="1"), ing("m", "vegetal", "20587", variant="maison", protein="1", replaces="6255"),
            ing("c", "vegetal", "30181", variant="commerce", protein="1", replaces="6255")]
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

    def test_each_pair_needs_a_maison_version_commerce_is_optional(self):
        validate(DISHES[:2], ings()[:2], COMPOSITION)  # no adapted store-bought product: no commerce version
        with self.assertRaisesRegex(PairError, "expected one animal dish"):
            validate([DISHES[0], DISHES[2]], [ings()[0], ings()[2]], COMPOSITION)

    def test_plant_dish_needs_a_rationale(self):
        bad = [DISHES[0], dish("m", "vegetal", "maison", rationale=" "), DISHES[2]]
        with self.assertRaisesRegex(PairError, "rationale"):
            validate(bad, ings(), COMPOSITION)


class RecipeRules(unittest.TestCase):
    """Decisions of Matt (review of the recipes, 2026-11-01)."""

    def check(self, rows):
        return recipe_rule_errors(DISHES[:2], rows, COMPOSITION)

    def base(self, veg):
        return [ing("a", "animal", "6255", "400", protein="1"), ing("a", "animal", "4003", "500")] + veg

    def test_plant_protein_mass_at_most_20_percent_above(self):
        ok = self.base([ing("m", "vegetal", "20587", "480", "maison", protein="1", replaces="6255"), ing("m", "vegetal", "4003", "500", "maison")])
        self.assertEqual(self.check(ok), [])
        over = self.base([ing("m", "vegetal", "20587", "490", "maison", protein="1", replaces="6255"), ing("m", "vegetal", "4003", "500", "maison")])
        self.assertTrue(any("+20 %" in e for e in self.check(over)))

    def test_replaced_breading_counts_in_the_reference(self):
        rows = [ing("a", "animal", "36018", "400", protein="1"), ing("a", "animal", "22000", "60"), ing("a", "animal", "7004", "100"),
                ing("m", "vegetal", "25227_1", "600", "maison", protein="1", replaces="36018 22000 7004")]
        self.assertEqual(recipe_rule_errors(DISHES[:2], rows, {"36018": "pur", "22000": "pur"}), [])

    def test_no_ingredient_without_equivalent_in_the_original(self):
        added = self.base([ing("m", "vegetal", "20587", "400", "maison", protein="1", replaces="6255"), ing("m", "vegetal", "4003", "500", "maison"),
                           ing("m", "vegetal", "20507", "150", "maison", protein="1")])
        self.assertTrue(any("no equivalent" in e for e in self.check(added)))

    def test_a_replacement_must_replace_an_animal_ingredient_of_the_dish(self):
        bad = self.base([ing("m", "vegetal", "20587", "400", "maison", protein="1", replaces="4003")])
        self.assertTrue(any("animal ingredient" in e for e in self.check(bad)))

    def test_plant_ingredients_stay_identical(self):
        changed = self.base([ing("m", "vegetal", "20587", "400", "maison", protein="1", replaces="6255"), ing("m", "vegetal", "4003", "600", "maison")])
        self.assertTrue(any("4003" in e and "identical" in e for e in self.check(changed)))
        # replaced together with an animal ingredient (ready-made pastry for flour + butter): accepted
        pastry = [ing("a", "animal", "9435", "200"), ing("a", "animal", "16400", "100"), ing("m", "vegetal", "23445", "200", "maison", replaces="9435 16400")]
        self.assertEqual(recipe_rule_errors(DISHES[:2], pastry, {"16400": "pur"}), [])

    def test_protein_objective_is_reported_not_blocking(self):
        self.assertEqual(protein_objective(40.0, 25.0), (False, 0.625))
        self.assertEqual(protein_objective(40.0, 30.0), (True, 0.75))
        self.assertEqual(protein_objective(None, 30.0), (None, None))

    def test_stale_pairs_are_unpublished(self):
        db = [{"animal": "a", "vegan": "m"}, {"animal": "a", "vegan": "old-commerce"}, {"animal": "other", "vegan": "x"}]
        self.assertEqual(stale_pairs(db, {"a", "m"}), [("a", "old-commerce")])


class RepositoryFiles(unittest.TestCase):
    """The versioned CSV files themselves must pass the offline checks."""

    def test_pair_files_are_valid(self):
        validate(read_csv(DISHES_CSV), read_csv(PAIRS_CSV), load_animal_composition())

    def test_pair_files_follow_the_recipe_rules(self):
        self.assertEqual(recipe_rule_errors(read_csv(DISHES_CSV), read_csv(PAIRS_CSV), load_animal_composition()), [])

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
