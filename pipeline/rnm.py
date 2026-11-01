"""Retail prices (stade détail, GMS) of the RNM — FranceAgriMer, Licence ouverte.

    python pipeline/rnm.py [--download] [--dry-run]

Monthly averages over 12 months ("Voir dans un tableur : moyennes mensuelles", SYLK export) for
the markets of pipeline/rnm_map.csv. Mapping rules (reviewed by hand): only labels priced per kg
("le kg"), conventional (not organic), without bones, for a Ciqual code that is the product as sold
(raw). One prices row per label and month (observed_on = 15th of the month; per = 'kg').
Idempotent: upsert on (source_id, external_id). The view food_prices publishes the median of the
monthly averages when there are at least 5 months.
Legal notice: https://rnm.franceagrimer.fr/rnm/infolegal.shtml (reuse allowed, also commercial,
with precise mention of the source).
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from datetime import date
from pathlib import Path

import requests

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "rnm"
URL = "https://rnm.franceagrimer.fr/prix"
DIR = RAW / "rnm"
MAPPING = Path(__file__).resolve().parent / "rnm_map.csv"
MONTHS = {"Janv.": 1, "Févr.": 2, "Mars": 3, "Avril": 4, "Mai": 5, "Juin": 6, "Juil.": 7, "Août": 8,
          "Septe.": 9, "Octo.": 10, "Nove.": 11, "Déce.": 12}
PER_KG = "le kg"


def download(markets: set[int], last_date: str) -> None:
    DIR.mkdir(parents=True, exist_ok=True)
    for m in sorted(markets):
        r = requests.post(URL, data={"MENSUEL": "1", "MARCHE": str(m), "LASTDATE": last_date}, timeout=120)
        r.raise_for_status()
        if not r.content.startswith(b"ID;"):
            sys.exit(f"RNM market {m}: not a SYLK export (format changed): stop and ask.")
        (DIR / f"M{m}_mensuel.slk").write_bytes(r.content)
        print(f"  downloaded M{m} ({len(r.content)} bytes)")


def parse_sylk(text: str) -> dict[tuple[int, int], str]:
    """Pure: (row, column) -> cell text of a SYLK file."""
    cells: dict[tuple[int, int], str] = {}
    x = y = None
    for line in text.splitlines():
        parts = line.split(";")
        if parts[0] not in ("C", "F"):
            continue
        k = None
        for p in parts[1:]:
            if p.startswith("X"):
                x = int(p[1:])
            elif p.startswith("Y"):
                y = int(p[1:])
            elif p.startswith("K") and parts[0] == "C":
                k = p[1:].strip('"')
        if k is not None and x is not None and y is not None:
            cells[(y, x)] = k
    return cells


def monthly_rows(cells: dict[tuple[int, int], str], market: int) -> list[dict]:
    """Pure: one dict per (label, month) with a value. Raises ValueError if the layout changed."""
    header_y = next((y for (y, x), v in cells.items() if x == 1 and v == "libellé"), None)
    if header_y is None or cells.get((header_y, 2)) != "unité":
        raise ValueError(f"RNM M{market}: header 'libellé / unité' not found (format changed)")
    months = {}
    for (y, x), v in cells.items():
        if y == header_y and x >= 3:
            m = re.fullmatch(r"(\S+) (\d{4})", v)
            if not m or m.group(1) not in MONTHS:
                raise ValueError(f"RNM M{market}: unexpected month header {v!r}")
            months[x] = date(int(m.group(2)), MONTHS[m.group(1)], 15)
    out = []
    for (y, x), label in cells.items():
        if x != 1 or y <= header_y:
            continue
        unit = cells.get((y, 2))
        for col, d in months.items():
            v = cells.get((y, col), "")
            if v:
                out.append({"market": market, "libelle": label, "unit": unit, "month": d, "price": float(v)})
    return out


def select(rows: list[dict], mapping: list[dict[str, str]]) -> list[dict]:
    """Pure: prices rows for the mapped labels priced per kg."""
    out = []
    for m in mapping:
        hits = [r for r in rows if r["market"] == int(m["market"]) and r["libelle"] == m["libelle"]]
        for r in hits:
            if r["unit"] != PER_KG:
                raise ValueError(f"{m['libelle']}: unit {r['unit']!r}, only per kg is used")
            out.append({"food_code": m["food_code"], "price_eur": r["price"], "per": "kg", "region": "France",
                        "observed_on": r["month"].isoformat(), "source_id": SOURCE_ID,
                        "external_id": f"M{r['market']}|{r['libelle']}|{r['month']:%Y-%m}"})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--last-date", default=date.today().replace(day=1).strftime("%d-%m-%y"),
                    help="any day of the last month (JJ-MM-AA); default: first day of this month")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    with open(MAPPING, newline="", encoding="utf-8") as fh:
        mapping = list(csv.DictReader(fh))
    markets = {int(m["market"]) for m in mapping}
    if args.download:
        download(markets, args.last_date)
    rows = []
    for m in sorted(markets):
        path = DIR / f"M{m}_mensuel.slk"
        if not path.exists():
            sys.exit(f"{path} missing: run with --download.")
        rows += monthly_rows(parse_sylk(path.read_text(encoding="latin-1")), m)
    prices = select(rows, mapping)
    missing = [m["libelle"] for m in mapping if not any(p["food_code"] == m["food_code"] for p in prices)]
    print(f"RNM: {len(rows)} monthly values read, {len(prices)} kept for {len(mapping) - len(missing)} foods")
    for m in mapping:
        vals = [p["price_eur"] for p in prices if p["food_code"] == m["food_code"]]
        if vals:
            s = sorted(vals)
            print(f"  {m['food_code']:6} {m['libelle']:45} {len(vals)} mois, médiane {s[len(s) // 2] if len(s) % 2 else (s[len(s) // 2 - 1] + s[len(s) // 2]) / 2:.2f} €/kg")
    if missing:
        print(f"  no value for: {missing}")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    require_source(client, SOURCE_ID, "moyennes mensuelles")
    upsert(client, "prices", prices, "source_id,external_id")


if __name__ == "__main__":
    main()
