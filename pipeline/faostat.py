"""Animals slaughtered per kg of carcass, France, from FAOSTAT QCL (Crops and livestock products).

    python pipeline/faostat.py [--download] [--dry-run]

For each category of pipeline/faostat_categories.csv (reviewed mapping animal_category -> FAO item):
    animals per kg of carcass = Producing Animals/Slaughtered (heads) / Production (kg carcass weight)
- value = latest year where both figures are official (flag A);
- low / high = min / max over the last YEARS such years.
Applied in dish_animal_impacts to the grams of meat actually eaten (cooked, boned), this is a
LOWER estimate: 1 kg of cooked meat comes from more than 1 kg of carcass.

Categories without a FAO item (veau: no separate calf item; poule pondeuse: eggs are not
slaughter output) get no factor and stay "donnée manquante". Written to category_factors,
indicator animals_killed_land, source faostat-qcl. Idempotent (upsert).
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from pathlib import Path

import requests

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "faostat-qcl"
INDICATOR = "animals_killed_land"
URL = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip"
DATASETS_URL = "https://bulks-faostat.fao.org/production/datasets_E.json"
CSV_NAME = "Production_Crops_Livestock_E_All_Data_(Normalized).csv"
DIR = RAW / "faostat"
MAPPING = Path(__file__).resolve().parent / "faostat_categories.csv"
FRANCE = "68"  # FAOSTAT area code
YEARS = 5
SLAUGHTERED = "Producing Animals/Slaughtered"
PRODUCTION = "Production"
# Unit conversions (the only constants allowed)
HEADS = {"An": 1, "1000 An": 1000}
KG = {"t": 1000}
DAYS_PER_YEAR = 365
YIELD_KG = {"kg/An": 1, "g/An": 0.001}

# Days of life per kg: 365 / annual yield per animal (lactation only; heifers and calves excluded).
# Eggs: FAOSTAT's recent yield is in eggs per hen (No/An); a kg yield would need an egg weight,
# which is not a unit conversion -> no value (see TODO_SOURCES.md).
DAIRY = [{"animal_category": "vache laitière", "item_code_cpc": "02211", "item": "Raw milk of cattle", "element": "Yield/Carcass Weight"}]


def download() -> str:
    meta = requests.get(DATASETS_URL, timeout=60).json()["Datasets"]["Dataset"]
    qcl = next((d for d in meta if d["DatasetCode"] == "QCL"), None)
    if qcl is None or qcl["FileLocation"] != URL:
        sys.exit("FAOSTAT QCL file location changed: stop and ask.")
    r = requests.get(URL, timeout=600)
    r.raise_for_status()
    DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        if CSV_NAME not in z.namelist():
            sys.exit(f"{CSV_NAME} missing from the FAOSTAT archive: format changed, stop and ask.")
        z.extract(CSV_NAME, DIR)
    print(f"Downloaded FAOSTAT QCL (update {qcl['DateUpdate']}, {len(r.content)} bytes)")
    return qcl["DateUpdate"][:10]


def read_france(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="latin-1") as fh:
        reader = csv.DictReader(fh)
        expected = {"Area Code", "Item Code (CPC)", "Item", "Element", "Year", "Unit", "Value", "Flag"}
        if not expected <= set(reader.fieldnames or []):
            sys.exit(f"Unexpected FAOSTAT columns {reader.fieldnames}: format changed, stop and ask.")
        return [r for r in reader if r["Area Code"] == FRANCE]


def compute_factors(rows: list[dict[str, str]], mapping: list[dict[str, str]], years: int = YEARS) -> list[dict]:
    """Pure: one factor per mapped category. Raises ValueError on unknown units."""
    out = []
    for m in mapping:
        cpc = "'" + m["item_code_cpc"]
        by_year: dict[int, dict[str, float]] = {}
        for r in rows:
            if r["Item Code (CPC)"] != cpc or r["Element"] not in (SLAUGHTERED, PRODUCTION) or r["Flag"] != "A":
                continue
            if r["Value"] in ("", None):
                continue
            if r["Element"] == SLAUGHTERED:
                if r["Unit"] not in HEADS:
                    raise ValueError(f"unknown unit {r['Unit']!r} for {m['item']}")
                value = float(r["Value"]) * HEADS[r["Unit"]]
            else:
                if r["Unit"] not in KG:
                    raise ValueError(f"unknown unit {r['Unit']!r} for {m['item']}")
                value = float(r["Value"]) * KG[r["Unit"]]
            by_year.setdefault(int(r["Year"]), {})[r["Element"]] = value
        complete = sorted(y for y, v in by_year.items() if v.get(SLAUGHTERED, 0) > 0 and v.get(PRODUCTION, 0) > 0)
        if not complete:
            print(f"  no official year with both figures for {m['animal_category']} ({m['item']})")
            continue
        recent = complete[-years:]
        per_kg = {y: by_year[y][SLAUGHTERED] / by_year[y][PRODUCTION] for y in recent}
        latest = recent[-1]
        notes = (f"FAOSTAT QCL, France, {m['item']} : têtes abattues / production (poids carcasse), {latest} ; "
                 f"fourchette = min-max {recent[0]}-{latest}. Par kg de carcasse : estimation basse pour la viande consommée.")
        if m["notes"]:
            notes += " " + m["notes"]
        out.append({
            "category": m["animal_category"], "indicator_id": INDICATOR,
            "value": per_kg[latest], "low": min(per_kg.values()), "high": max(per_kg.values()),
            "unit_basis": "par kg de carcasse (FAOSTAT, France)", "per": "kg", "source_id": SOURCE_ID, "notes": notes,
            "_year": latest,
        })
    return out


def compute_dairy(rows: list[dict[str, str]], items: list[dict[str, str]] = DAIRY) -> list[dict]:
    """Pure: life_days_farmed per kg of milk = 365 / official yield (kg per milk animal per year)."""
    out = []
    for m in items:
        cpc = "'" + m["item_code_cpc"]
        years = {}
        for r in rows:
            if r["Item Code (CPC)"] == cpc and r["Element"] == m["element"] and r["Flag"] == "A" and r["Value"]:
                if r["Unit"] not in YIELD_KG:
                    raise ValueError(f"unknown yield unit {r['Unit']!r} for {m['item']}")
                years[int(r["Year"])] = float(r["Value"]) * YIELD_KG[r["Unit"]]
        if not years:
            print(f"  no official yield for {m['item']}")
            continue
        latest = max(years)
        kg = years[latest]
        out.append({
            "category": m["animal_category"], "indicator_id": "life_days_farmed", "value": DAYS_PER_YEAR / kg,
            "low": None, "high": None, "per": "kg", "unit_basis": "par kg de lait cru (FAOSTAT, France)",
            "source_id": SOURCE_ID, "_year": latest,
            "notes": (f"FAOSTAT QCL, France, {m['item']}, rendement {kg:g} kg par vache et par an ({latest}) : 365 / rendement. "
                      "Seule la lactation est comptée (élevage des génisses et veaux exclus). Appliqué aux produits laitiers au "
                      "poids du produit : estimation basse (un fromage demande plusieurs kg de lait)."),
        })
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    update = download() if args.download else None
    path = DIR / CSV_NAME
    if not path.exists():
        sys.exit(f"{path} missing: run with --download.")
    with open(MAPPING, newline="", encoding="utf-8") as fh:
        mapping = list(csv.DictReader(fh))
    france = read_france(path)
    factors = compute_factors(france, mapping) + compute_dairy(france)
    print(f"FAOSTAT: {len(factors)} categories")
    for f in factors:
        if f["indicator_id"] == INDICATOR:
            print(f"  {f['category']:16} {f['value'] * 1000:10.3f} animals per tonne of carcass "
                  f"({f['low'] * 1000:.3f}–{f['high'] * 1000:.3f}), year {f['_year']}")
        else:
            print(f"  {f['category']:16} {f['value']:.6g} days of life per kg ({f['indicator_id']}), year {f['_year']}")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    years = sorted({f["_year"] for f in factors})
    version = f"QCL{', mise à jour ' + update if update else ''}, données France {years[0]}" + (f"-{years[-1]}" if len(years) > 1 else "")
    require_source(client, SOURCE_ID, version)
    upsert(client, "category_factors", [{k: v for k, v in f.items() if not k.startswith("_")} for f in factors],
           "category,indicator_id,source_id")
    res = client.table("category_factors").select("category,value").eq("source_id", SOURCE_ID).eq("indicator_id", INDICATOR).execute().data
    print(f"In database: {len(res)} FAOSTAT factors")
    # Hand check: cattle 2024 = 3 986 140 heads / 1 298 540 t → about 3.07 animals per tonne.
    for r in res:
        if r["category"] == "bovin":
            print(f"  check bovin: {float(r['value']) * 1000:.3f} animals per tonne (expected ≈ 3.07 for 2024)")


if __name__ == "__main__":
    main()
