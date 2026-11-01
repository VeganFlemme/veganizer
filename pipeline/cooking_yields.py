"""Cooking yields (USDA Table of Cooking Yields for Meat and Poultry, Release 2, CC0) -> cooking_yields.

    python pipeline/cooking_yields.py [--download] [--dry-run]

Reviewed mapping pipeline/cooking_yields_map.csv: a cooked Ciqual code, the raw Ciqual code of the
same product, and the USDA row (NDB + preparation method) of the same product cooked the same way.
Stored: yield %, min and max %. Used only to price a cooked ingredient from its raw price
(view food_prices_best); recipes are never converted to raw weights.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import requests

from common import RAW, get_client, upsert

SOURCE_ID = "usda-cooking-yields-r2"
URL = "https://ndownloader.figshare.com/files/43365402"  # USDA_CookingYields_MeatPoultry02_0.csv
PATH = RAW / "usda_yields" / "yields.csv"
MAPPING = Path(__file__).resolve().parent / "cooking_yields_map.csv"
YIELD, YMIN, YMAX = " Cooking Yield %", "Yield Minimum %", "Yield Maximum %"


def number(x: str) -> float | None:
    x = (x or "").strip()
    return None if x in ("", "n/a") else float(x)


def find_rows(usda: list[dict[str, str]], mapping: list[dict[str, str]]) -> list[dict]:
    """Pure: one cooking_yields row per mapping; raises ValueError if the USDA row is missing."""
    out = []
    for m in mapping:
        hits = [r for r in usda if r["NDB"].strip() == m["usda_ndb"] and r["Preparation Method1"].strip() == m["usda_preparation"]]
        if len(hits) != 1:
            raise ValueError(f"USDA row NDB {m['usda_ndb']} / {m['usda_preparation']}: {len(hits)} matches (format changed?)")
        r = hits[0]
        y = number(r[YIELD])
        if y is None or not 0 < y <= 200:
            raise ValueError(f"bad yield for NDB {m['usda_ndb']}: {r[YIELD]!r}")
        out.append({
            "cooked_code": m["cooked_code"], "raw_code": m["raw_code"], "yield_pct": y,
            "yield_min": number(r[YMIN]), "yield_max": number(r[YMAX]),
            "reference": f"USDA NDB {r['NDB']} « {r['Yield Description'].strip()} », {r['Preparation Method1'].strip()}, "
                         f"n = {r['n']}, release {r['Release Year2']}",
            "source_id": SOURCE_ID,
        })
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.download:
        r = requests.get(URL, timeout=120)
        r.raise_for_status()
        PATH.parent.mkdir(parents=True, exist_ok=True)
        PATH.write_bytes(r.content)
    if not PATH.exists():
        sys.exit(f"{PATH} missing: run with --download.")
    with open(PATH, newline="", encoding="utf-8-sig") as fh:
        usda = list(csv.DictReader(fh))
    if YIELD not in (usda[0] if usda else {}):
        sys.exit("USDA cooking yields: column ' Cooking Yield %' not found (format changed): stop and ask.")
    with open(MAPPING, newline="", encoding="utf-8") as fh:
        mapping = list(csv.DictReader(fh))
    rows = find_rows(usda, mapping)
    print(f"Cooking yields: {len(usda)} USDA rows read, {len(rows)} mapped")
    for r in rows:
        print(f"  {r['cooked_code']} <- {r['raw_code']}: {r['yield_pct']} % ({r['yield_min']}–{r['yield_max']}) — {r['reference']}")
    if args.dry_run:
        return
    upsert(get_client(), "cooking_yields", rows, "cooked_code")


if __name__ == "__main__":
    main()
