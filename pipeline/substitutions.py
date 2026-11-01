"""Reviewed ingredient substitutions for /recette ("Version végétale"), CSV -> ingredient_substitutions.

    python pipeline/substitutions.py [--dry-run]

Each rule: priority (first match wins), match_type (iarc | name_regex | subgroup | category),
match_value, to_code (a plant food with nutrients and impacts), ratio (grams of the substitute per
gram of the original; 1 = same mass) and a justification shown to the user. Checks: to_code exists,
is not an animal food, has protein, energy and CO2e. Idempotent (rules not in the CSV are removed).
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

from common import fetch_all, get_client, upsert

CSV_PATH = Path(__file__).resolve().parent / "substitutions.csv"
TYPES = {"iarc", "name_regex", "subgroup", "category"}


def read_rules(path: Path = CSV_PATH) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    errors = []
    for i, r in enumerate(rows, start=2):
        if r["match_type"] not in TYPES:
            errors.append(f"line {i}: match_type {r['match_type']!r}")
        if r["match_type"] == "name_regex":
            try:
                re.compile(r["match_value"])
            except re.error as e:
                errors.append(f"line {i}: bad regex ({e})")
        try:
            if float(r["ratio"]) <= 0:
                errors.append(f"line {i}: ratio must be > 0")
        except ValueError:
            errors.append(f"line {i}: ratio is not a number")
        if not r["justification"].strip():
            errors.append(f"line {i}: justification required")
    if len({r["priority"] for r in rows}) != len(rows):
        errors.append("duplicate priority")
    if errors:
        raise ValueError("\n".join(errors))
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    try:
        rules = read_rules()
    except ValueError as e:
        sys.exit(f"Invalid {CSV_PATH.name}:\n{e}")
    print(f"Substitutions: {len(rules)} rules")
    if args.dry_run:
        return
    client = get_client()
    codes = sorted({r["to_code"] for r in rules})
    foods = {f["code"]: f for f in client.table("foods").select("code,name_fr,is_animal,ciqual_code").in_("code", codes).execute().data}
    ghg = {r["food_code"] for r in client.table("food_impacts").select("food_code").in_("food_code", codes).eq("indicator_id", "ghg_100y_kgco2e").execute().data}
    bad = []
    for c in codes:
        f = foods.get(c)
        if not f or f["is_animal"] or c not in ghg:
            bad.append(c)
            continue
        n = client.table("food_nutrients").select("nutrient_id").eq("food_code", f["ciqual_code"] or c).in_("nutrient_id", ["protein_g", "energy_eu_kcal"]).not_.is_("value_per_100g", "null").execute().data
        if len(n) < 2:
            bad.append(c)
    if bad:
        sys.exit(f"Substitutes not usable (animal, unknown or without data): {bad}")
    keep = {int(r["priority"]) for r in rules}
    for r in fetch_all(client, "ingredient_substitutions", "priority"):
        if r["priority"] not in keep:
            client.table("ingredient_substitutions").delete().eq("priority", r["priority"]).execute()
    upsert(client, "ingredient_substitutions", [{**r, "priority": int(r["priority"]), "ratio": float(r["ratio"])} for r in rules], "priority")
    for r in rules[:5]:
        print(f"  {r['priority']:>4} {r['match_type']:10} {r['match_value'][:30]:30} -> {r['to_code']} {foods[r['to_code']]['name_fr'][:40]}")


if __name__ == "__main__":
    main()
