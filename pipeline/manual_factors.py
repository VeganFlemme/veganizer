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
REQUIRED = ["category", "indicator_id", "value", "unit_basis", "source_id", "source_url", "page", "quote", "accessed_on"]


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
        for k in ("value", "low", "high"):
            if r.get(k):
                try:
                    float(r[k])
                except ValueError:
                    errors.append(f"line {i}: {k} is not a number")
    return errors


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
    if args.dry_run or not rows:
        print("Nothing written." if not rows else "Dry run: nothing written.")
        return
    from common import get_client, upsert

    client = get_client()
    upsert(client, "category_factors", [{
        "category": r["category"], "indicator_id": r["indicator_id"], "value": float(r["value"]),
        "low": float(r["low"]) if r.get("low") else None, "high": float(r["high"]) if r.get("high") else None,
        "unit_basis": r["unit_basis"], "source_id": r["source_id"],
        "notes": f"{r['page']} — « {r['quote']} » ({r['source_url']}, consulté le {r['accessed_on']})",
    } for r in rows], "category,indicator_id,source_id")


if __name__ == "__main__":
    main()
