"""Import the Ciqual 2025 food composition table into foods, nutrients, food_nutrients.

Usage:
    python pipeline/ciqual.py [--download] [--dry-run] [--check CODE ...]

Source: ANSES, Table Ciqual 2025 (doi:10.57745/RDMHWY), Licence Ouverte Etalab 2.0.
Idempotent: every write is an upsert. Missing values stay null (never 0).
"""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET

import pandas as pd
import requests

from common import RAW, clean_text, fetch_all, get_client, infer_state, parse_ciqual_value, require_source, upsert

SOURCE_ID = "ciqual-2025"
EXPECTED_VERSION = "nov. 2025"
DATAVERSE_DOI = "doi:10.57745/RDMHWY"
XLSX = RAW / "ciqual_2025_FR_2025_11_03.xlsx"
ALIM_XML = RAW / "ciqual_2025_alim_2025_11_03.xml"
FILES = {  # dataverse file name -> local path
    "Table Ciqual 2025_FR_2025_11_03.xlsx": XLSX,
    "alim_2025_11_03.xml": ALIM_XML,
}

# Ciqual constituent code (ORIGCPCD) -> (nutrients.id, unit, category)
NUTRIENTS: dict[str, tuple[str, str, str]] = {
    "327": ("energy_eu_kj", "kJ", "énergie"),
    "328": ("energy_eu_kcal", "kcal", "énergie"),
    "332": ("energy_jones_kj", "kJ", "énergie"),
    "333": ("energy_jones_kcal", "kcal", "énergie"),
    "400": ("water_g", "g", "macro"),
    "25000": ("protein_g", "g", "macro"),
    "25003": ("protein_n625_g", "g", "macro"),
    "31000": ("carbohydrate_g", "g", "macro"),
    "40000": ("fat_g", "g", "macro"),
    "34100": ("fiber_g", "g", "macro"),
    "32000": ("sugars_g", "g", "glucide"),
    "32210": ("fructose_g", "g", "glucide"),
    "32220": ("galactose_g", "g", "glucide"),
    "32250": ("glucose_g", "g", "glucide"),
    "32410": ("lactose_g", "g", "glucide"),
    "32430": ("maltose_g", "g", "glucide"),
    "32480": ("sucrose_g", "g", "glucide"),
    "33110": ("starch_g", "g", "glucide"),
    "34000": ("polyols_g", "g", "glucide"),
    "10000": ("ash_g", "g", "autre"),
    "60000": ("alcohol_g", "g", "autre"),
    "65000": ("organic_acids_g", "g", "autre"),
    "75100": ("cholesterol_mg", "mg", "autre"),
    "40302": ("fa_sat_g", "g", "acide gras"),
    "40303": ("fa_mono_g", "g", "acide gras"),
    "40304": ("fa_poly_g", "g", "acide gras"),
    "40400": ("fa_c4_0_g", "g", "acide gras"),
    "40600": ("fa_c6_0_g", "g", "acide gras"),
    "40800": ("fa_c8_0_g", "g", "acide gras"),
    "41000": ("fa_c10_0_g", "g", "acide gras"),
    "41200": ("fa_c12_0_g", "g", "acide gras"),
    "41400": ("fa_c14_0_g", "g", "acide gras"),
    "41600": ("fa_c16_0_g", "g", "acide gras"),
    "41800": ("fa_c18_0_g", "g", "acide gras"),
    "41819": ("fa_c18_1_n9_g", "g", "acide gras"),
    "41826": ("fa_c18_2_n6_la_g", "g", "acide gras"),
    "41833": ("fa_c18_3_n3_ala_g", "g", "acide gras"),
    "42046": ("fa_c20_4_n6_ara_g", "g", "acide gras"),
    "42053": ("fa_c20_5_n3_epa_g", "g", "acide gras"),
    "42263": ("fa_c22_6_n3_dha_g", "g", "acide gras"),
    "10004": ("salt_g", "g", "minéral"),
    "10200": ("ca_mg", "mg", "minéral"),
    "10170": ("cl_mg", "mg", "minéral"),
    "10290": ("cu_mg", "mg", "minéral"),
    "10260": ("fe_mg", "mg", "minéral"),
    "10530": ("i_ug", "µg", "minéral"),
    "10120": ("mg_mg", "mg", "minéral"),
    "10251": ("mn_mg", "mg", "minéral"),
    "10150": ("p_mg", "mg", "minéral"),
    "10190": ("k_mg", "mg", "minéral"),
    "10340": ("se_ug", "µg", "minéral"),
    "10110": ("na_mg", "mg", "minéral"),
    "10300": ("zn_mg", "mg", "minéral"),
    "51104": ("vit_a_rae_ug", "µg", "vitamine"),
    "51200": ("retinol_ug", "µg", "vitamine"),
    "51330": ("beta_carotene_ug", "µg", "vitamine"),
    "52100": ("vit_d_ug", "µg", "vitamine"),
    "52200": ("vit_d2_ug", "µg", "vitamine"),
    "52300": ("vit_d3_ug", "µg", "vitamine"),
    "71010": ("alpha_tocopherol_mg", "mg", "vitamine"),
    "53100": ("vit_e_mg", "mg", "vitamine"),
    "54101": ("vit_k1_ug", "µg", "vitamine"),
    "54104": ("vit_k2_ug", "µg", "vitamine"),
    "55100": ("vit_c_mg", "mg", "vitamine"),
    "56100": ("vit_b1_mg", "mg", "vitamine"),
    "56200": ("vit_b2_mg", "mg", "vitamine"),
    "56310": ("vit_b3_mg", "mg", "vitamine"),
    "56400": ("vit_b5_mg", "mg", "vitamine"),
    "56500": ("vit_b6_mg", "mg", "vitamine"),
    "56702": ("vit_b9_dfe_ug", "µg", "vitamine"),
    "56700": ("vit_b9_ug", "µg", "vitamine"),
    "56704": ("folate_food_ug", "µg", "vitamine"),
    "56708": ("folic_acid_ug", "µg", "vitamine"),
    "56600": ("vit_b12_ug", "µg", "vitamine"),
}

ID_COLUMNS = [
    "alim_grp_code", "alim_ssgrp_code", "alim_ssssgrp_code", "alim_grp_nom_fr",
    "alim_ssgrp_nom_fr", "alim_ssssgrp_nom_fr", "alim_code", "alim_nom_fr", "alim_nom_sci",
]
JONES_COLUMN = "Facteur de Jones"
_UNIT = re.compile(r"\((kJ|kcal|g|mg|µg)/100 g\)$")


def norm(s: str) -> str:
    return " ".join(str(s).replace("/", " ").split())


def download() -> None:
    meta = requests.get(
        "https://entrepot.recherche.data.gouv.fr/api/datasets/:persistentId/",
        params={"persistentId": DATAVERSE_DOI}, timeout=60,
    ).json()["data"]["latestVersion"]
    print(f"Dataverse {DATAVERSE_DOI}: version {meta['versionNumber']}.{meta['versionMinorNumber']} ({meta['releaseTime']})")
    by_name = {f["dataFile"]["filename"]: f["dataFile"]["id"] for f in meta["files"]}
    RAW.mkdir(parents=True, exist_ok=True)
    for name, path in FILES.items():
        if name not in by_name:
            sys.exit(f"File '{name}' not found in the dataverse: the source changed, stop and ask.")
        r = requests.get(f"https://entrepot.recherche.data.gouv.fr/api/access/datafile/{by_name[name]}", timeout=300)
        r.raise_for_status()
        path.write_bytes(r.content)
        print(f"  downloaded {path.name} ({len(r.content)} bytes)")


def load_columns(infoods: pd.DataFrame, columns: list[str]) -> dict[str, tuple[str, str, str, str]]:
    """Map each spreadsheet column to (nutrient_id, name_fr, unit, category). Stops on any mismatch."""
    by_name = {norm(r.const_nom_fr): (str(r.ORIGCPCD).strip(), r.const_nom_fr) for r in infoods.itertuples()}
    data_cols = [c for c in columns if c not in ID_COLUMNS and norm(c) != JONES_COLUMN]
    if len(data_cols) != len(NUTRIENTS):
        sys.exit(f"Expected {len(NUTRIENTS)} constituent columns, found {len(data_cols)}: format changed, stop and ask.")
    mapping = {}
    for col in data_cols:
        hit = by_name.get(norm(col))
        if hit is None:
            sys.exit(f"Column {col!r} not found in the INFOODS sheet: format changed, stop and ask.")
        code, full_name = hit
        if code not in NUTRIENTS:
            sys.exit(f"Constituent code {code} ({full_name}) not mapped: stop and ask.")
        nid, unit, category = NUTRIENTS[code]
        m = _UNIT.search(full_name)
        if not m or m.group(1) != unit:
            sys.exit(f"Unit mismatch for {full_name!r}: expected {unit}.")
        mapping[col] = (nid, _UNIT.sub("", full_name).strip().rstrip(","), unit, category)
    return mapping


def english_names() -> dict[str, str]:
    root = ET.parse(ALIM_XML).getroot()
    out = {}
    for alim in root.iter("ALIM"):
        code = clean_text(alim.findtext("alim_code"))
        name = clean_text(alim.findtext("alim_nom_eng"))
        if code and name:
            out[code] = name
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", nargs="*", default=[], help="Ciqual codes to print in full after import")
    args = ap.parse_args()

    if args.download:
        download()
    for p in FILES.values():
        if not p.exists():
            sys.exit(f"{p} missing: run with --download.")

    xls = pd.ExcelFile(XLSX)
    df = pd.read_excel(xls, sheet_name="composition nutritionnelle", dtype=str)
    infoods = pd.read_excel(xls, sheet_name="codes INFOODS", dtype=str)
    mapping = load_columns(infoods, list(df.columns))
    if df["alim_code"].duplicated().any():
        sys.exit("Duplicate alim_code in Ciqual: stop and ask.")
    names_en = english_names()

    nutrients = [
        {"id": nid, "name_fr": name, "unit": unit, "category": cat}
        for nid, name, unit, cat in mapping.values()
    ]

    foods, food_nutrients = [], []
    for _, r in df.iterrows():
        code = clean_text(r["alim_code"])
        name = clean_text(r["alim_nom_fr"])
        state = infer_state(name)
        sub = clean_text(r["alim_ssgrp_nom_fr"])
        foods.append({
            "code": code,
            "name_fr": name,
            "name_en": names_en.get(code),
            "food_group": clean_text(r["alim_grp_nom_fr"]),
            "food_subgroup": None if sub == "-" else sub,
            "state": state,
            "state_inferred": state is not None,
            "source_id": SOURCE_ID,
        })
        for col, (nid, *_rest) in mapping.items():
            value, qualifier = parse_ciqual_value(r[col])
            food_nutrients.append({
                "food_code": code, "nutrient_id": nid, "value_per_100g": value,
                "qualifier": qualifier, "source_id": SOURCE_ID,
            })

    fn = pd.DataFrame(food_nutrients)
    print(f"Ciqual: {len(foods)} foods, {len(nutrients)} nutrients, {len(fn)} food_nutrients")
    print(f"  numeric: {fn.value_per_100g.notna().sum()}  missing '-': {(fn.value_per_100g.isna() & fn.qualifier.isna()).sum()}"
          f"  traces: {(fn.qualifier == 'traces').sum()}  '< x': {fn.qualifier.str.startswith('<', na=False).sum()}")
    print(f"  name_en found: {sum(f['name_en'] is not None for f in foods)}/{len(foods)}"
          f"  state inferred: {sum(f['state_inferred'] for f in foods)} "
          f"({pd.Series([f['state'] for f in foods]).value_counts().to_dict()})")

    if args.dry_run:
        print("Dry run: nothing written.")
        return

    client = get_client()
    require_source(client, SOURCE_ID, EXPECTED_VERSION)
    upsert(client, "nutrients", nutrients, "id")
    upsert(client, "foods", foods, "code")
    upsert(client, "food_nutrients", food_nutrients, "food_code,nutrient_id,source_id")

    # Post-import summary from the database itself
    db_foods = fetch_all(client, "foods", "code", source_id=SOURCE_ID)
    count = client.table("food_nutrients").select("food_code", count="exact", head=True).eq("source_id", SOURCE_ID).execute().count
    print(f"In database: {len(db_foods)} Ciqual foods, {count} Ciqual food_nutrients rows")
    print("5 examples:")
    for f in pd.DataFrame(foods).sample(5, random_state=1).itertuples():
        vals = {x["nutrient_id"]: (x["value_per_100g"], x["qualifier"]) for x in food_nutrients
                if x["food_code"] == f.code and x["nutrient_id"] in ("energy_eu_kcal", "protein_g", "fe_mg", "vit_b12_ug")}
        print(f"  {f.code} {f.name_fr}: {vals}")
    for code in args.check:
        res = client.table("food_nutrients").select("nutrient_id,value_per_100g,qualifier").eq("food_code", code).execute()
        print(f"\nCheck {code}:")
        for x in sorted(res.data, key=lambda x: x["nutrient_id"]):
            print(f"  {x['nutrient_id']:22} {x['value_per_100g']!s:>10} {x['qualifier'] or ''}")


if __name__ == "__main__":
    main()
