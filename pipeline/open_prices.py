"""Open Prices observations (Open Food Facts, ODbL) -> prices, for foods mapped by hand.

    python pipeline/open_prices.py [--download] [--dry-run]

Kept: type CATEGORY (raw products), price per KILOGRAM, currency EUR, shop in France,
not discounted, observed in the 12 months before the latest date of the export.
Mapping pipeline/open_prices_map.csv (reviewed): only raw foods whose Ciqual code is the
product as sold (a cooked code never receives a raw price). The view food_prices publishes
the median only with at least 5 observations. ODbL: the derived prices table must stay
under ODbL and cite Open Prices. Idempotent: upsert on (source_id, external_id).
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import requests

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "open-prices"
URL = "https://huggingface.co/datasets/openfoodfacts/open-prices/resolve/main/prices.parquet"
PATH = RAW / "open_prices" / "prices.parquet"
MAPPING = Path(__file__).resolve().parent / "open_prices_map.csv"
COLUMNS = ["id", "type", "category_tag", "price", "price_per", "currency", "date",
           "price_is_discounted", "location_osm_address_country_code"]
WINDOW_MONTHS = 12


def download() -> None:
    PATH.parent.mkdir(parents=True, exist_ok=True)
    r = requests.get(URL, timeout=900)
    r.raise_for_status()
    PATH.write_bytes(r.content)
    print(f"Downloaded {PATH.name} ({len(r.content)} bytes)")


def select(df, mapping: list[dict[str, str]]):
    """Pure (pandas): observations kept, one row per (price id, food code)."""
    import pandas as pd

    missing = set(COLUMNS) - set(df.columns)
    if missing:
        raise ValueError(f"Open Prices columns missing: {sorted(missing)} (format changed)")
    d = df[(df["type"] == "CATEGORY") & (df["price_per"] == "KILOGRAM") & (df["currency"] == "EUR")
           & (df["location_osm_address_country_code"] == "FR") & (df["price_is_discounted"] != True)].copy()  # noqa: E712
    d["date"] = pd.to_datetime(d["date"], errors="coerce")
    d = d.dropna(subset=["date", "price"])
    if d.empty:
        return d.assign(food_code=[])
    start = d["date"].max() - pd.DateOffset(months=WINDOW_MONTHS)
    d = d[d["date"] >= start]
    m = pd.DataFrame(mapping)[["food_code", "category_tag"]]
    out = d.merge(m, on="category_tag", how="inner")
    out["price"] = out["price"].astype(float)
    return out[out["price"] > 0]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    import pandas as pd

    if args.download:
        download()
    if not PATH.exists():
        sys.exit(f"{PATH} missing: run with --download.")
    with open(MAPPING, newline="", encoding="utf-8") as fh:
        mapping = list(csv.DictReader(fh))
    obs = select(pd.read_parquet(PATH, columns=COLUMNS), mapping)
    summary = obs.groupby("food_code")["price"].agg(["count", "median", "min", "max"])
    print(f"Open Prices: {len(obs)} observations for {obs.food_code.nunique()} foods "
          f"({obs.date.min().date() if len(obs) else '-'} to {obs.date.max().date() if len(obs) else '-'})")
    print(summary.to_string())
    print("Published only with >= 5 observations (view food_prices).")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    require_source(client, SOURCE_ID, f"export Parquet du {obs.date.max().date()}")
    rows = [{"food_code": r.food_code, "price_eur": float(r.price), "per": "kg", "region": "France",
             "observed_on": r.date.date().isoformat(), "source_id": SOURCE_ID, "external_id": f"{r.id}:{r.food_code}"}
            for r in obs.itertuples()]
    upsert(client, "prices", rows, "source_id,external_id")
    res = client.table("food_prices").select("food_code,median_eur_per_kg,observations").execute().data
    print("food_prices view:")
    for r in res:
        print(f"  {r['food_code']}: {float(r['median_eur_per_kg']):.2f} €/kg ({r['observations']} observations)")


if __name__ == "__main__":
    main()
