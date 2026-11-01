"""Open Prices product prices (barcodes) converted to € per kg with the product quantity.

    python pipeline/open_prices_products.py [--dry-run]

For each row of pipeline/open_prices_products_map.csv (reviewed: the Open Food Facts category is
the Ciqual food as sold), read the Open Prices API (prices + product data synced from Open Food
Facts, ODbL). Kept: shop in France, EUR, not discounted, last 12 months, unit price (price_per
empty), product quantity in grams (liquids in ml are excluded: a density is not a unit
conversion), product tagged with the category. € per kg = price / grams × 1000.
Idempotent: upsert on (source_id, external_id). ODbL: share-alike and citation.
"""

from __future__ import annotations

import argparse
import csv
import time
from datetime import date, timedelta
from pathlib import Path

import requests

from common import get_client, require_source, upsert

SOURCE_ID = "open-prices"
API = "https://prices.openfoodfacts.org/api/v1/prices"
MAPPING = Path(__file__).resolve().parent / "open_prices_products_map.csv"
UA = {"User-Agent": "veganizer-pipeline/0.1 (https://github.com/VeganFlemme/veganizer)"}
GRAMS_PER_KG = 1000  # unit conversion
PAGE_SIZE = 100


def fetch(category: str, since: date) -> list[dict]:
    items, page = [], 1
    while True:
        r = requests.get(API, params={"product__categories_tags__contains": category, "location__osm_address_country_code": "FR",
                                      "date__gte": since.isoformat(), "size": PAGE_SIZE, "page": page}, headers=UA, timeout=60)
        r.raise_for_status()
        d = r.json()
        items += d.get("items", [])
        if page >= (d.get("pages") or 1):
            return items
        page += 1
        time.sleep(1)


def select(items: list[dict], food_code: str, category: str, since: date) -> list[dict]:
    """Pure: prices rows per kg for one mapped category."""
    out = []
    for it in items:
        p = it.get("product") or {}
        loc = it.get("location") or {}
        q = p.get("product_quantity")
        if (it.get("currency") != "EUR" or it.get("price_is_discounted") or it.get("price_per")
                or loc.get("osm_address_country_code") != "FR" or category not in (p.get("categories_tags") or [])
                or p.get("product_quantity_unit") != "g" or not q or float(q) <= 0 or not it.get("price")
                or date.fromisoformat(it["date"]) < since):
            continue
        out.append({"food_code": food_code, "off_barcode": p.get("code"),
                    "price_eur": float(it["price"]) / float(q) * GRAMS_PER_KG, "per": "kg", "region": "France",
                    "observed_on": it["date"], "source_id": SOURCE_ID, "external_id": f"{it['id']}:{food_code}"})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    since = date.today() - timedelta(days=365)
    with open(MAPPING, newline="", encoding="utf-8") as fh:
        mapping = list(csv.DictReader(fh))
    rows = []
    for m in mapping:
        items = fetch(m["category_tag"], since)
        kept = select(items, m["food_code"], m["category_tag"], since)
        rows += kept
        vals = sorted(r["price_eur"] for r in kept)
        med = (vals[len(vals) // 2] if len(vals) % 2 else (vals[len(vals) // 2 - 1] + vals[len(vals) // 2]) / 2) if vals else None
        print(f"  {m['food_code']:6} {m['category_tag']:22} {len(items):4} prices read, {len(kept):4} kept"
              + (f", median {med:.2f} €/kg" if med else ", donnée manquante"))
        time.sleep(2)
    print(f"Open Prices products: {len(rows)} observations (published only with >= 5 per food)")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    require_source(client, SOURCE_ID, "export")
    upsert(client, "prices", rows, "source_id,external_id")


if __name__ == "__main__":
    main()
