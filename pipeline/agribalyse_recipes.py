"""Official recipes of the AGRIBALYSE composite dishes (suite V1, step 3 bis, point 2 bis).

Source: AGRIBALYSE 3.0 complete database, export from openLCA republished on data.gouv.fr
(https://www.data.gouv.fr/fr/datasets/agribalyse/, Licence Ouverte 2.0, community republication
of the ADEME database). Table TBL_EXCHANGES gives, for each "<dish>, at plant" process, the
mass of each input per kg of dish at plant.

Usage:
    python pipeline/agribalyse_recipes.py [--download] [--dry-run]

Checks (nothing is imported unless every check passes for a dish):
  1. same ingredient list as the AGRIBALYSE 3.2 "détail par ingrédient" of the same dish (our
     impacts are 3.2, the recipes 3.0): every 3.0 input maps to a 3.2 ingredient name of the dish
     and every 3.2 ingredient is covered (pipeline/agribalyse_recipe_ingredients.csv, reviewed);
  2. mass coverage: share of the recipe mass with a Ciqual code (nutrients and impacts) >= 95 %;
  3. not approached by another recipe: dishes listed in annex 10 of the AGRIBALYSE 3.2
     methodology ("CIQUAL products approached by other CIQUAL recipes / products") are excluded,
     their recipe is another dish's (carbonara modelled with the bolognese recipe…);
  4. impact recalculated as the site does (sum of kg x 3.2 impact per kg of each ingredient) vs the
     published 3.2 impact of the dish, per indicator: written to the report, never used to adjust.

Outputs:
  pipeline/reports/agribalyse_recipes_check.csv  one line per composite dish, with the reason of exclusion
  pipeline/agribalyse_recipes.csv                 recipes that pass (dish code, ingredient code, kg per kg)
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from pathlib import Path

import pandas as pd
import requests

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OLCA = RAW / "agribalyse-3.0-openlca"
ARCHIVE = OLCA / "agribalyse-3.0.csv.7z"
ARCHIVE_URL = "https://static.data.gouv.fr/resources/agribalyse/20200620-092639/agribalyse.7z"
ARCHIVE_SHA1 = "27999bc5e2d8d58cea54d845565e25a7ac151574"  # published by data.gouv.fr
TABLES = ["TBL_EXCHANGES.csv", "TBL_FLOWS.csv", "TBL_PROCESSES.csv", "TBL_UNITS.csv"]
MAPPING = HERE / "agribalyse_recipe_ingredients.csv"
ANNEXES = RAW / "agribalyse_dataverse" / "methodologie_annexes.xlsx"
ANNEXES_URL = "https://entrepot.recherche.data.gouv.fr/api/access/datafile/575431?format=original"
PROXY_SHEET = "10. CIQUAL proxy"
DETAIL = RAW / "agribalyse_3.2_detail_ingredient.csv"
SYNTH = RAW / "agribalyse_3.2_synthese.csv"
REPORT = HERE / "reports" / "agribalyse_recipes_check.csv"
OUT = HERE / "agribalyse_recipes.csv"
SOURCE_ID = "agribalyse-3.0-openlca"

COMPOSITE_GROUP = "entrées et plats composés"
# Processes that are not ingredients (energy of cooking, mixing).
NOT_INGREDIENTS = {
    "Cooking, industrial, 1kg of cooked product/ FR U",
    'Mixing, processing, at plant "dummy process"/FR U',
}
MIN_COVERAGE = 0.95
OTHER_STEPS = "Autres étapes"
IMPACT_COLUMNS = {"Changement climatique": "ghg_100y_kgco2e", "Utilisation du sol": "land_use_pt", "Épuisement des ressources eau": "water_scarcity_m3", "Eutrophisation marine": "eutro_marine_kgn"}


def download() -> None:
    OLCA.mkdir(parents=True, exist_ok=True)
    r = requests.get(ARCHIVE_URL, timeout=600)
    r.raise_for_status()
    if hashlib.sha1(r.content).hexdigest() != ARCHIVE_SHA1:
        sys.exit("agribalyse.7z: checksum differs from data.gouv.fr. File changed: stop and ask.")
    ARCHIVE.write_bytes(r.content)
    try:
        import py7zr  # noqa: PLC0415
    except ImportError:
        sys.exit("py7zr missing: pip install -r pipeline/requirements.txt")
    with py7zr.SevenZipFile(ARCHIVE) as z:
        z.extract(path=OLCA / "csv", targets=TABLES)
    print(f"  downloaded {ARCHIVE.name} ({len(r.content)} bytes, sha1 OK), extracted {len(TABLES)} tables")
    a = requests.get(ANNEXES_URL, timeout=120)
    a.raise_for_status()
    ANNEXES.parent.mkdir(parents=True, exist_ok=True)
    ANNEXES.write_bytes(a.content)
    print(f"  downloaded {ANNEXES.name} ({len(a.content)} bytes)")


def proxied_codes() -> dict[str, str]:
    """Annex 10: Ciqual code -> recipe or product used as proxy."""
    import openpyxl  # noqa: PLC0415

    wb = openpyxl.load_workbook(ANNEXES, read_only=True)
    if PROXY_SHEET not in wb.sheetnames:
        sys.exit(f"{ANNEXES.name}: sheet '{PROXY_SHEET}' missing. Format changed: stop and ask.")
    out = {}
    for r in wb[PROXY_SHEET].iter_rows(values_only=True):
        if r and r[0] is not None and str(r[0]).strip().isdigit():
            out[str(r[0]).strip()] = norm(r[4] or r[3] or "")
    return out


def norm(s: object) -> str:
    return " ".join(str(s).replace("\xa0", " ").split()) if isinstance(s, str) else ""


def load_recipes() -> tuple[pd.DataFrame, set[str]]:
    d = OLCA / "csv"
    proc = pd.read_csv(d / "TBL_PROCESSES.csv", usecols=["ID", "NAME"])
    flows = pd.read_csv(d / "TBL_FLOWS.csv", usecols=["ID", "NAME", "FLOW_TYPE"])
    units = pd.read_csv(d / "TBL_UNITS.csv", usecols=["ID", "NAME"])
    ex = pd.read_csv(d / "TBL_EXCHANGES.csv", usecols=["F_OWNER", "F_FLOW", "F_UNIT", "IS_INPUT", "RESULTING_AMOUNT_VALUE"], low_memory=False)
    plant = proc[proc.NAME.str.endswith(", at plant", na=False)]
    ex = ex[ex.F_OWNER.isin(plant.ID) & (ex.IS_INPUT == 1)]
    ex = ex.merge(flows.rename(columns={"ID": "F_FLOW", "NAME": "flow"}), on="F_FLOW")
    ex = ex[ex.FLOW_TYPE == "PRODUCT_FLOW"].merge(units.rename(columns={"ID": "F_UNIT", "NAME": "unit"}), on="F_UNIT")
    ex = ex.merge(plant.rename(columns={"ID": "F_OWNER", "NAME": "process"}), on="F_OWNER")
    return ex[["process", "flow", "unit", "RESULTING_AMOUNT_VALUE"]].rename(columns={"RESULTING_AMOUNT_VALUE": "kg"}), set(plant.NAME)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="write the report only")
    args = ap.parse_args()
    if args.download:
        download()
    if not (OLCA / "csv" / "TBL_EXCHANGES.csv").exists():
        sys.exit(f"{OLCA}/csv missing: run with --download")

    mapping = pd.read_csv(MAPPING, dtype=str, keep_default_na=False)
    by_flow = {r.flow: r for r in mapping.itertuples(index=False)}
    detail = pd.read_csv(DETAIL, dtype=str)
    detail.columns = [norm(c) for c in detail.columns]
    detail["code"] = detail["Ciqual AGB"].map(norm)
    detail["Ingredients"] = detail["Ingredients"].map(norm)
    synth = pd.read_csv(SYNTH, dtype=str)
    synth.columns = [norm(c) for c in synth.columns]
    synth["code"] = synth["Code AGB"].map(norm)
    impact = {col: dict(zip(synth.code, pd.to_numeric(synth[col], errors="coerce"))) for col in IMPACT_COLUMNS}

    recipes, plant_names = load_recipes()
    proxies = proxied_codes()
    dishes = detail[detail["Groupe d'aliment"] == COMPOSITE_GROUP].drop_duplicates("code")
    report, out = [], []
    for d in dishes.itertuples(index=False):
        code, name, lci = d.code, d[detail.columns.get_loc("Nom Français")], norm(d[detail.columns.get_loc("LCI Name")])
        row = {"code": code, "name": name, "subgroup": d[detail.columns.get_loc("Sous-groupe d'aliment")], "process_30": "", "status": "", "reason": ""}
        process = next((p for p in (f"{lci}, at plant", f"{lci}, recipe, at plant") if p in plant_names), None)
        if not process:
            report.append({**row, "status": "exclu", "reason": "pas de recette 3.0 sous le même nom (plat ajouté ou renommé après la 3.0)"})
            continue
        row["process_30"] = process
        if code.split("_")[0] in proxies:
            report.append({**row, "status": "exclu", "reason": f"plat approché par une autre recette (annexe 10 du rapport Agribalyse) : {proxies[code.split('_')[0]]}"})
            continue
        rec = recipes[(recipes.process == process) & ~recipes.flow.isin(NOT_INGREDIENTS)]
        if (rec.unit != "kg").any():
            report.append({**row, "status": "exclu", "reason": "intrant hors kg"})
            continue
        rec = rec.groupby("flow", as_index=False).kg.sum()
        unknown = [f for f in rec.flow if f not in by_flow]
        if unknown:
            report.append({**row, "status": "exclu", "reason": "intrant non relu : " + " ; ".join(unknown)})
            continue
        names30 = {by_flow[f].ingredient_32 for f in rec.flow if by_flow[f].ingredient_32}
        names32 = set(detail[(detail.code == code) & (detail.Ingredients != OTHER_STEPS)].Ingredients)
        only30 = sorted(f for f in rec.flow if by_flow[f].ingredient_32 == "" and by_flow[f].code != "18066")
        if names30 != names32 or only30:
            diff = []
            if names32 - names30:
                diff.append("en 3.2 seulement : " + ", ".join(sorted(names32 - names30)))
            if names30 - names32:
                diff.append("en 3.0 seulement : " + ", ".join(sorted(names30 - names32)))
            if only30:
                diff.append("intrant 3.0 sans équivalent 3.2 : " + ", ".join(f.split("/")[0] for f in only30))
            report.append({**row, "status": "exclu", "reason": "liste d'ingrédients différente de la 3.2 (" + " ; ".join(diff) + ")"})
            continue
        total = rec.kg.sum()
        coded = rec[[bool(by_flow[f].code) for f in rec.flow]]
        coverage = coded.kg.sum() / total if total else 0
        row.update({"recipe_kg_per_kg": round(total, 4), "coverage": round(coverage, 4)})
        for col, ind in IMPACT_COLUMNS.items():
            published = impact[col].get(code)
            parts = [k * impact[col].get(by_flow[f].code, float("nan")) for f, k in zip(coded.flow, coded.kg)]
            recalculated = sum(parts) if parts and not any(pd.isna(p) for p in parts) else None
            row[f"{ind}_published"] = published
            row[f"{ind}_recalculated"] = None if recalculated is None else round(recalculated, 6)
            row[f"{ind}_ratio"] = None if recalculated is None or not published else round(recalculated / published, 3)
        if coverage < MIN_COVERAGE:
            missing = [f.split("/")[0] + (f" ({by_flow[f].note})" if by_flow[f].note else "") for f in rec.flow if not by_flow[f].code]
            report.append({**row, "status": "exclu", "reason": f"masse couverte {coverage:.0%} < 95 % : " + " ; ".join(missing)})
            continue
        report.append({**row, "status": "retenu", "reason": ""})
        for f, k in zip(rec.flow, rec.kg):
            out.append({"dish_code": code, "dish_name": name, "flow": f, "food_code": by_flow[f].code, "ingredient_fr": by_flow[f].ingredient_32.strip(), "kg_per_kg_dish": round(k, 6), "note": by_flow[f].note})

    REPORT.parent.mkdir(exist_ok=True)
    rep = pd.DataFrame(report)
    rep.to_csv(REPORT, index=False, quoting=csv.QUOTE_MINIMAL)
    kept = rep[rep.status == "retenu"]
    print(f"composite dishes: {len(rep)}; kept: {len(kept)}; excluded: {len(rep) - len(kept)}")
    print(rep[rep.status == "exclu"].reason.str.split(" [:(]", n=1, regex=True).str[0].value_counts().to_string())
    if len(kept):
        r = kept.ghg_100y_kgco2e_ratio.dropna()
        print(f"GHG recalculated / published (kept): median {r.median():.2f}, min {r.min():.2f}, max {r.max():.2f}")
        print(kept[["code", "name", "coverage", "ghg_100y_kgco2e_ratio", "land_use_pt_ratio"]].head(8).to_string(index=False))
    if args.dry_run:
        return
    pd.DataFrame(out).to_csv(OUT, index=False)
    print(f"wrote {OUT.name}: {len(out)} rows")
    from common import fetch_all, get_client, require_source, upsert  # noqa: PLC0415

    client = get_client()
    require_source(client, SOURCE_ID, "3.0")
    known = {r["code"] for r in fetch_all(client, "foods", "code")}
    rows = [
        {"dish_code": r["dish_code"], "flow": r["flow"], "food_code": r["food_code"] or None, "ingredient_fr": r["ingredient_fr"] or None, "kg_per_kg_dish": r["kg_per_kg_dish"], "note": r["note"] or None, "source_id": SOURCE_ID, "is_published": True}
        for r in out
        if r["dish_code"] in known
    ]
    missing = sorted({r["dish_code"] for r in out} - known)
    if missing:
        print(f"  dishes absent from foods (not imported): {', '.join(missing)}")
    bad = sorted({r["food_code"] for r in rows if r["food_code"] and r["food_code"] not in known})
    if bad:
        sys.exit(f"ingredient codes absent from foods: {', '.join(bad)}")
    upsert(client, "official_recipes", rows, "dish_code,flow,source_id")
    kept_codes = {r["dish_code"] for r in rows}
    stale = sorted({r["dish_code"] for r in fetch_all(client, "official_recipes", "dish_code", is_published=True)} - kept_codes)
    for code in stale:  # unpublished, never deleted
        client.table("official_recipes").update({"is_published": False}).eq("dish_code", code).execute()
    if stale:
        print(f"  unpublished (no longer pass the checks): {', '.join(stale)}")
    # Summary (CLAUDE.md): rows, missing values, 5 examples, one known dish checked by hand.
    print(f"  {len(rows)} rows, {sum(1 for r in rows if not r['food_code'])} without code, {len({r['dish_code'] for r in rows})} dishes")
    for r in rows[:5]:
        print("   ", r["dish_code"], r["flow"], r["kg_per_kg_dish"], r["food_code"])
    check = [r for r in rows if r["dish_code"] == "25009"]
    print("  check by hand, Hachis Parmentier (25009), kg per kg:", {r["flow"].split(",")[0]: r["kg_per_kg_dish"] for r in check})


if __name__ == "__main__":
    main()
