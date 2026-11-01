"""Hand-entered category factors (Fishcount, Welfare Footprint, slaughter ages…).

    python pipeline/manual_factors.py [--dry-run]

A row is accepted only if it cites the exact page: source_id (in public.sources), source_url,
page (page, table or section) and a short quote of the figure, plus accessed_on (YYYY-MM-DD).
Values not verified this way go to TODO_SOURCES.md, never into this file.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "manual_factors.csv"
REQUIRED = ["category", "indicator_id", "value", "unit", "per", "unit_basis", "source_id", "source_url", "page", "quote", "accessed_on"]
# Unit conversions to days (the only constants allowed): a month = 365.25 / 12 days.
TO_DAYS = {"jours": 1.0, "mois": 365.25 / 12}
# Units of the other indicators, stored as published.
AS_PUBLISHED = {"heures", "animaux"}


def validate(rows: list[dict[str, str]]) -> list[str]:
    errors = []
    for i, r in enumerate(rows, start=2):
        for k in REQUIRED:
            if not (r.get(k) or "").strip():
                errors.append(f"line {i}: {k} is required")
        if r.get("source_url") and not r["source_url"].startswith("https://"):
            errors.append(f"line {i}: source_url must be https")
        if r.get("accessed_on") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["accessed_on"]):
            errors.append(f"line {i}: accessed_on must be YYYY-MM-DD")
        if r.get("per") and r["per"] not in ("kg", "animal"):
            errors.append(f"line {i}: per must be kg or animal")
        if r.get("unit") and r["unit"] not in TO_DAYS and r["unit"] not in AS_PUBLISHED:
            errors.append(f"line {i}: unknown unit {r['unit']!r}")
        if r.get("indicator_id") == "life_days_farmed" and r.get("unit") not in TO_DAYS:
            errors.append(f"line {i}: life_days_farmed needs a unit in {sorted(TO_DAYS)}")
        for k in ("value", "low", "high"):
            if r.get(k):
                try:
                    float(r[k])
                except ValueError:
                    errors.append(f"line {i}: {k} is not a number")
    return errors


def to_value(r: dict[str, str], key: str) -> float | None:
    """Pure: the cited figure converted to the indicator unit (days for life_days_farmed)."""
    if not r.get(key):
        return None
    return float(r[key]) * TO_DAYS.get(r["unit"], 1.0)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    errors = validate(rows)
    if errors:
        sys.exit("\n".join(errors))
    print(f"Manual factors: {len(rows)} rows")
    for r in rows:
        print(f"  {r['category']:16} {r['indicator_id']:18} {to_value(r, 'value'):.6g} (« {r['quote']} », {r['page'][:40]}…)")
    if args.dry_run or not rows:
        print("Nothing written." if not rows else "Dry run: nothing written.")
        return
    from common import get_client, upsert

    client = get_client()
    upsert(client, "category_factors", [{
        "category": r["category"], "indicator_id": r["indicator_id"], "value": to_value(r, "value"),
        "low": to_value(r, "low"), "high": to_value(r, "high"), "per": r["per"],
        "unit_basis": r["unit_basis"], "source_id": r["source_id"],
        "notes": f"{r['page']} — « {r['quote']} » ({r['source_url']}, consulté le {r['accessed_on']})"
                 + (f" ; {r['value']} {r['unit']} convertis en jours (× 365,25/12)" if r["unit"] == "mois" else ""),
    } for r in rows], "category,indicator_id,source_id,scope")


if __name__ == "__main__":
    main()
