"""Days of life per kg of cheese from milk extraction rates (FAO Technical Conversion Factors).

    python pipeline/milk_equivalents.py [--dry-run]

kg of milk per kg of cheese = 100 / extraction rate (FAO, France, cow whole-milk cheese, reviewed in
pipeline/milk_equivalents.csv with page and quote). Days of life per kg of cheese = days per kg of
milk (FAOSTAT row of category_factors) × kg of milk per kg of cheese. Stored as a second
vache laitière / life_days_farmed row, source fao-tcf, limited to cow cheeses (food_codes).
Cream and butter: rates recorded but not applied (co-products of skim milk, no sourced allocation).
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "milk_equivalents.csv"
SOURCE_ID = "fao-tcf"
CATEGORY = "vache laitière"
INDICATOR = "life_days_farmed"
CHEESE_SUBGROUPS = {"fromages et alternatives végétales", "fromages"}
PERCENT = 100.0  # unit conversion: a rate in percent


def read_rates(path: Path = CSV_PATH) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        float(r["extraction_pct"])
        if r["apply"] not in ("yes", "no") or not r["page"] or not r["quote"] or not r["source_url"].startswith("https://"):
            raise ValueError(f"invalid row {r['product']}")
    return rows


def cheese_scope(foods: list[dict]) -> list[str]:
    """Pure: codes of cow-milk cheeses."""
    return sorted(f["code"] for f in foods if f.get("animal_category") == CATEGORY and f.get("food_subgroup") in CHEESE_SUBGROUPS)


def cheese_factor(milk: dict, extraction_pct: float, codes: list[str]) -> dict:
    """Pure: the per-kg-of-cheese row from the per-kg-of-milk row."""
    milk_per_kg = PERCENT / extraction_pct
    return {
        "category": CATEGORY, "indicator_id": INDICATOR, "value": float(milk["value"]) * milk_per_kg, "low": None, "high": None,
        "per": "kg", "unit_basis": "par kg de fromage au lait de vache", "source_id": SOURCE_ID, "food_codes": codes,
        "notes": (f"Jours de lactation par kg de lait (FAOSTAT, {milk['source_id']}) × {milk_per_kg:.2f} kg de lait par kg de fromage "
                  f"(FAO, Technical Conversion Factors, France, coefficient d'extraction {extraction_pct:g} %, moyennes 1992-1996). "
                  "Tout le lait est attribué au fromage (lactosérum non compté). Beurre et crème : donnée manquante (coproduits)."),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    rates = {r["product"]: r for r in read_rates()}
    cheese = rates["fromage"]
    print(f"Milk equivalents: cheese {cheese['extraction_pct']} % -> {PERCENT / float(cheese['extraction_pct']):.2f} kg of milk per kg")
    if args.dry_run:
        return
    from common import fetch_all, get_client, require_source, upsert

    client = get_client()
    require_source(client, SOURCE_ID, "1992-1996")
    milk = client.table("category_factors").select("value,source_id,notes").eq("category", CATEGORY).eq("indicator_id", INDICATOR).eq("source_id", "faostat-qcl").execute().data
    if len(milk) != 1:
        sys.exit("FAOSTAT milk factor missing: run pipeline/faostat.py first.")
    codes = cheese_scope(fetch_all(client, "foods", "code,name_fr,animal_category,food_subgroup", is_animal=True))
    row = cheese_factor(milk[0], float(cheese["extraction_pct"]), codes)
    upsert(client, "category_factors", [row], "category,indicator_id,source_id,scope")
    print(f"  {len(codes)} cheeses, e.g. {codes[:5]} ; {row['value']:.4f} days of life per kg of cheese")


if __name__ == "__main__":
    main()
