"""Calves (veau): animals per kg of carcass from Agreste SAA long series (France).

    python pipeline/agreste.py [--download] [--dry-run]

Source: Agreste — Statistique agricole annuelle, séries longues 2010-2025 (Licence Ouverte),
workbook "donnees_regionales", sheet PRA "Animaux finis produits", row "001 - FRANCE" /
"18 - Total veaux de boucherie (16 + 17)": NBTETE_<year> (heads) and PROD_<year> (tonnes
équivalent carcasse). Same method as faostat.py: heads / kg carcass; value = latest year that
is not provisional, low/high = min/max over the last YEARS such years. These are calves
finished on French farms in the year (not a slaughter count): see docs/A_VERIFIER.md.
"""

from __future__ import annotations

import argparse
import io
import re
import sys
import zipfile

import requests

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "agreste-saa"
URL = ("https://agreste.agriculture.gouv.fr/agreste-web/download/publication/publie/SAA-SeriesLongues/"
       "SAA-SeriesLongues-2010-2025_DonneesProvisoires-DepartementalesRegionales.zip")
XLSX_NAME = "SAA_2010-2025_provisoires_donnees_regionales.xlsx"
PATH = RAW / "agreste" / "sl" / XLSX_NAME
SHEET = "PRA"
ROW = ("001 - FRANCE", "18 - Total veaux de boucherie")
YEARS = 5
KG_PER_TONNE = 1000  # unit conversion


def download() -> None:
    r = requests.get(URL, timeout=600)
    r.raise_for_status()
    PATH.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        if XLSX_NAME not in z.namelist():
            sys.exit(f"{XLSX_NAME} missing from the Agreste archive: format changed, stop and ask.")
        PATH.write_bytes(z.read(XLSX_NAME))
    print(f"Downloaded {XLSX_NAME}")


def compute(df, years: int = YEARS) -> dict:
    """Pure (pandas DataFrame read with header=None): the veau factor row."""
    header_row = next(i for i in range(len(df)) if df.iloc[i, 0] == "LIB_REG2")
    cols = [str(c) for c in df.iloc[header_row].tolist()]
    text = " ".join(str(df.iloc[i, 0]) for i in range(header_row))
    m = re.search(r"Données (\d{4}) provisoires", text)
    provisional = int(m.group(1)) if m else None
    hits = [i for i in range(header_row + 1, len(df))
            if str(df.iloc[i, 0]).startswith(ROW[0]) and str(df.iloc[i, 1]).startswith(ROW[1])]
    if len(hits) != 1:
        raise ValueError(f"expected one row {ROW}, found {len(hits)}: format changed")
    r = dict(zip(cols, df.iloc[hits[0]].tolist()))
    per_kg = {}
    for c in cols:
        mm = re.fullmatch(r"NBTETE_(\d{4})", c)
        if not mm:
            continue
        y = int(mm.group(1))
        heads, tec = r.get(f"NBTETE_{y}"), r.get(f"PROD_{y}")
        if y == provisional or heads in (None, "") or tec in (None, ""):
            continue
        heads, tec = float(heads), float(tec)
        if heads > 0 and tec > 0:
            per_kg[y] = heads / (tec * KG_PER_TONNE)
    if not per_kg:
        raise ValueError("no usable year")
    recent = sorted(per_kg)[-years:]
    latest = recent[-1]
    return {
        "category": "veau", "indicator_id": "animals_killed_land", "value": per_kg[latest],
        "low": min(per_kg[y] for y in recent), "high": max(per_kg[y] for y in recent), "per": "kg",
        "unit_basis": "par kg de carcasse (Agreste SAA, France)", "source_id": SOURCE_ID, "_year": latest,
        "notes": (f"Agreste SAA séries longues, onglet {SHEET} « Animaux finis produits », France, {ROW[1]} : "
                  f"têtes / tonnes équivalent carcasse, {latest} (année {provisional} provisoire exclue) ; "
                  f"fourchette = min-max {recent[0]}-{latest}. Veaux finis produits dans l'année, pas un comptage "
                  f"d'abattage. Par kg de carcasse : estimation basse pour la viande consommée."),
    }


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
    f = compute(pd.read_excel(PATH, sheet_name=SHEET, header=None))
    print(f"Agreste veau: {f['value'] * 1000:.3f} animals per tonne of carcass "
          f"({f['low'] * 1000:.3f}–{f['high'] * 1000:.3f}), year {f['_year']}")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    require_source(client, SOURCE_ID, "30/03/2026")
    upsert(client, "category_factors", [{k: v for k, v in f.items() if not k.startswith("_")}], "category,indicator_id,source_id,scope")


if __name__ == "__main__":
    main()
