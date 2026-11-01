"""Check the plant proteins offered to the visitor (suite V1, step 3 ter, point 2).

    python pipeline/protein_candidates.py

Reads the view public.protein_candidates (selected from the data only, migration
20261103070000) and checks, for every candidate:
- rule 10: is_animal = false, and no vegan claim is needed to show it (names are cleaned on the site);
- rule 9: a composite product (Ciqual/Agribalyse "plats composés", "plats végétariens") has no animal
  ingredient in the AGRIBALYSE detail per ingredient (food_impact_ingredients);
- rule 11: a variant code (20591_2…) has a ciqual_code, so its nutrients are those of the same food;
and that the list covers at least 3 families (soja, légumineuses, blé…): the same list is offered on
every dish, so every dish has them. Exits 1 on any failure. Nothing is written.
"""

from __future__ import annotations

import re
import sys

from common import fetch_all, get_client

COMPOSITE = {"plats composés", "plats végétariens"}
# Animal ingredients as named in the AGRIBALYSE detail per ingredient (lower case, accents kept).
ANIMAL_INGREDIENT = re.compile(
    r"(oeuf|œuf|lait(?! de coco| de soja)|beurre|crème|fromage|emmental|gruyère|comté|parmesan|mozzarella|viande|bœuf|boeuf|porc|poulet|"
    r"jambon|lardon|poisson|saumon|thon|crevette|gélatine|miel|mayonnaise)",
    re.IGNORECASE,
)


def family(name: str, subgroup: str | None) -> str:
    n = name.lower()
    if re.search(r"soja|tofu|tempeh|edamame", n):
        return "soja"
    if re.search(r"seitan|gluten|\bblé\b", n):
        return "blé"
    if subgroup == "légumineuses" or re.search(r"lentille|pois chiche|haricot|fève|pois cassé", n):
        return "légumineuses"
    return "autres"


def main() -> None:
    client = get_client()
    cands = fetch_all(client, "protein_candidates", "code,name_fr,food_subgroup,protein_g")
    codes = [c["code"] for c in cands]
    foods = {f["code"]: f for f in fetch_all(client, "foods", "code,is_animal,ciqual_code") if f["code"] in codes}
    detail = [r for r in fetch_all(client, "food_impact_ingredients", "food_code,ingredient") if r["food_code"] in codes]
    errors: list[str] = []
    for c in cands:
        f = foods.get(c["code"])
        if not f or f["is_animal"]:
            errors.append(f"{c['code']} {c['name_fr']}: is_animal is not false (rule 10)")
        if "_" in c["code"] and not (f and f["ciqual_code"]):
            errors.append(f"{c['code']} {c['name_fr']}: variant without ciqual_code (rule 11)")
        if c["food_subgroup"] in COMPOSITE:
            animal = sorted({r["ingredient"] for r in detail if r["food_code"] == c["code"] and ANIMAL_INGREDIENT.search(r["ingredient"])})
            if animal:
                errors.append(f"{c['code']} {c['name_fr']}: animal ingredient in the Agribalyse detail: {', '.join(animal)} (rule 9)")
    families: dict[str, list[str]] = {}
    for c in cands:
        families.setdefault(family(c["name_fr"], c["food_subgroup"]), []).append(c["name_fr"])
    print(f"protein_candidates: {len(cands)} candidates")
    for k, v in sorted(families.items()):
        print(f"  {k}: {len(v)} ({', '.join(v[:3])}{'…' if len(v) > 3 else ''})")
    known = [k for k in families if k != "autres"]
    if len(known) < 3:
        errors.append(f"only {len(known)} families of proteins ({', '.join(known)}): at least 3 expected")
    for e in errors:
        print("  ERROR", e)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
