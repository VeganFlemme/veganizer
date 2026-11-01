"""Fishes killed per kg (Mood et al. 2023 and 2024, Animal Welfare, CC BY 4.0).

    python pipeline/fish.py [--dry-run]

fishes per kg = 1000 / estimated mean weight (g) of the species (EMW lower and upper bounds of the
supplementary tables, reviewed in pipeline/fish_weights.csv with page and quote; files in
pipeline/raw/fishcount/, provided by Matt). Central value = midpoint of the two bounds, as the
paper's midpoint estimates. The weight is that of the whole fish at slaughter or capture; recipes
are in cooked fillet weight, so the count per kg of fillet is underestimated (low estimate, like
carcass weight for land animals). A species row is limited to its foods (name_regex, scope);
a row without scope applies to the whole category. Other species: missing data.
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "fish_weights.csv"
GRAMS_PER_KG = 1000  # unit conversion
INDICATOR = "fish_killed"


def read_weights(path: Path = CSV_PATH) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        if not (float(r["emw_low_g"]) > 0 and float(r["emw_high_g"]) >= float(r["emw_low_g"])) or not r["page"] or not r["quote"]:
            raise ValueError(f"invalid row {r}")
        if bool(r["scope"]) != bool(r["name_regex"]):
            raise ValueError(f"scope and name_regex go together: {r}")
    return rows


def fish_rows(weights: list[dict[str, str]], foods: list[dict]) -> list[dict]:
    """Pure: category_factors rows (fishes per kg of fish)."""
    out = []
    for w in weights:
        low = GRAMS_PER_KG / float(w["emw_high_g"])
        high = GRAMS_PER_KG / float(w["emw_low_g"])
        codes = None
        if w["scope"]:
            rx = re.compile(w["name_regex"])
            codes = sorted(f["code"] for f in foods if f.get("animal_category") == w["category"] and rx.search(f.get("name_fr") or ""))
        out.append({
            "category": w["category"], "scope": w["scope"], "indicator_id": INDICATOR, "value": (low + high) / 2, "low": low, "high": high,
            "per": "kg", "unit_basis": "par kg de poisson entier (poids moyen estimé)", "source_id": w["source_id"], "food_codes": codes,
            "notes": (f"1000 / poids moyen estimé de {w['emw_low_g']} à {w['emw_high_g']} g ({w['page']}). Poids du poisson entier appliqué "
                      "au poids de filet cuit de la recette : estimation basse."),
        })
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    weights = read_weights()
    if args.dry_run:
        for r in fish_rows(weights, []):
            print(f"  {r['category']:18} {r['scope']:18} {r['value']:.3f} ({r['low']:.3f}–{r['high']:.3f}) fishes per kg")
        return
    from common import fetch_all, get_client, upsert

    client = get_client()
    foods = fetch_all(client, "foods", "code,name_fr,animal_category", is_animal=True)
    rows = fish_rows(weights, foods)
    upsert(client, "category_factors", rows, "category,indicator_id,source_id,scope")
    for r in rows:
        print(f"  {r['category']:18} {r['scope']:18} {r['value']:.3f} ({r['low']:.3f}–{r['high']:.3f}) fishes per kg, foods: {r['food_codes']}")


if __name__ == "__main__":
    main()
