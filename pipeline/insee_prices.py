"""Average retail prices of the INSEE (« Prix moyens de vente de détail », from the consumer price
index survey, Licence Ouverte 2.0, data.gouv.fr dataset 6983dff71f90da358ccf74d7).

    python pipeline/insee_prices.py [--download] [--dry-run]

Monthly national averages (France métropolitaine) of the series mapped in
pipeline/insee_prices_map.csv (reviewed: only series priced per kg, for a Ciqual code that is the
product as sold). Last 12 months, definitive values (OBS_STATUS = A). One prices row per series and
month (observed_on = 15th of the month). Idempotent: upsert on (source_id, external_id).
No scraping of supermarket sites (their terms forbid it; a single shop is not representative).
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from pathlib import Path

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "insee-ipc-pm"
URL = "https://api.insee.fr/melodi/file/DS_IPC_PM/DS_IPC_PM_CSV_FR"
DIR = RAW / "insee"
MAPPING = Path(__file__).resolve().parent / "insee_prices_map.csv"
MONTHS = 12


def read_mapping(path: Path = MAPPING) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        if not r["food_code"] or not r["product_item"].isdigit() or "(kg)" not in r["libelle"]:
            raise ValueError(f"invalid mapping row {r}")
    return rows


def _month_index(ym: str) -> int:
    y, m = ym.split("-")
    return int(y) * 12 + int(m) - 1


def select(rows: list[dict[str, str]], mapping: list[dict[str, str]], last: str) -> list[dict]:
    """Pure: prices rows of the mapped series over the 12 months ending at `last` (YYYY-MM)."""
    codes = {m["product_item"]: m["food_code"] for m in mapping}
    end = _month_index(last)
    out = []
    for r in rows:
        if r["PRODUCT_ITEM"] not in codes or r["FREQ"] != "M" or r["UNIT_MEASURE"] != "EUR" or r["OBS_STATUS"] != "A" or r["GEO"] != "FM":
            continue
        if not end - MONTHS < _month_index(r["TIME_PERIOD"]) <= end:
            continue
        out.append({"food_code": codes[r["PRODUCT_ITEM"]], "price_eur": float(r["OBS_VALUE"]), "per": "kg", "region": "France",  # same convention as the other sources (view food_prices); metropolitan France per the series
                    "observed_on": f"{r['TIME_PERIOD']}-15", "source_id": SOURCE_ID, "external_id": f"{r['PRODUCT_ITEM']}|{r['TIME_PERIOD']}"})
    return sorted(out, key=lambda x: (x["food_code"], x["observed_on"]))


def main() -> None:
    import requests

    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    DIR.mkdir(parents=True, exist_ok=True)
    path = DIR / "ds_ipc_pm.zip"
    if args.download:
        r = requests.get(URL, timeout=120)
        r.raise_for_status()
        path.write_bytes(r.content)
    if not path.exists():
        sys.exit(f"{path} missing: run with --download.")
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.endswith("_data.csv"))
        rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig"), delimiter=";"))
    mapping = read_mapping()
    mapped = {m["product_item"] for m in mapping}
    last = max(r["TIME_PERIOD"] for r in rows if r["PRODUCT_ITEM"] in mapped and r["OBS_STATUS"] == "A")
    prices = select(rows, mapping, last)
    print(f"INSEE: {len(rows)} rows, {len(prices)} prices for {len({p['food_code'] for p in prices})} foods, last month {last}")
    for p in prices[:: max(1, len(prices) // 5)][:5]:
        print(f"  {p['food_code']:6} {p['observed_on']} {p['price_eur']:.2f} €/kg")
    if args.dry_run:
        return
    client = get_client()
    require_source(client, SOURCE_ID, f"données jusqu'à {last}")
    upsert(client, "prices", prices, "source_id,external_id")


if __name__ == "__main__":
    main()
