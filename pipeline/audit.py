"""Audit of the figures (suite V1, step 4, point 4).

    python pipeline/audit.py [--seed 2026] [--base http://localhost:3000]

1. 50 values drawn at random from the database (25 Ciqual nutrients, 25 AGRIBALYSE impacts) are
   compared with the official files in pipeline/raw (Ciqual 2025 xlsx, AGRIBALYSE 3.2 synthesis).
2. 5 dishes are recomputed independently from the official files (grams × value per 100 g or
   per kg, ÷ servings) and compared with the values the site exports (/compare/<slug>/donnees).
Writes pipeline/reports/audit.csv and prints the errors. Exits 1 on any difference.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

import pandas as pd

from common import RAW, fetch_all, get_client

HERE = Path(__file__).resolve().parent
REPORT = HERE / "reports" / "audit.csv"
CIQUAL = RAW / "ciqual_2025_FR_2025_11_03.xlsx"
SYNTH = RAW / "agribalyse_3.2_synthese.csv"
# Ciqual column (start of its normalised name) for the nutrients audited.
CIQUAL_COLUMNS = {
    "energy_eu_kcal": "energie, reglement ue n° 1169 2011 (kcal 100 g)",
    "protein_g": "proteines, n x facteur de jones (g 100 g)",
    "fat_g": "lipides (g 100 g)",
    "salt_g": "sel chlorure de sodium (g 100 g)",
    "fe_mg": "fer (mg 100 g)",
    "ca_mg": "calcium (mg 100 g)",
}
IMPACT_COLUMNS = {"ghg_100y_kgco2e": "Changement climatique", "land_use_pt": "Utilisation du sol", "water_scarcity_m3": "Épuisement des ressources eau"}
DISHES = ["boeuf-bourguignon", "lasagnes-bolognaise", "omelette", "saumon-riz", "quiche-lorraine"]
TOLERANCE = 0.005  # relative, for the rounding of the files


def norm(s: str) -> str:
    import unicodedata

    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return " ".join(s.replace("\n", " ").split())


def number(x) -> float | None:
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return None
    t = str(x).strip().replace(",", ".")
    try:
        return float(t)
    except ValueError:
        return None  # "-", "traces", "< x": not a plain value


def close(a: float, b: float) -> bool:
    return abs(a - b) <= max(1e-9, TOLERANCE * max(abs(a), abs(b)))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--base", default="http://localhost:3000")
    args = ap.parse_args()
    rng = random.Random(args.seed)
    client = get_client()

    cq = pd.read_excel(CIQUAL, dtype=str)
    cols = {norm(c): c for c in cq.columns}
    col_of = {k: next((cols[c] for c in cols if c.startswith(norm(v))), None) for k, v in CIQUAL_COLUMNS.items()}
    if any(v is None for v in col_of.values()):
        sys.exit(f"Ciqual columns not found: {[k for k, v in col_of.items() if v is None]} — format changed: stop and ask.")
    cq["code"] = cq["alim_code"].map(lambda x: str(x).strip())
    synth = pd.read_csv(SYNTH, dtype=str)
    synth["code"] = synth["Code AGB"].map(lambda x: str(x).strip())

    rows: list[dict] = []
    nut = [r for r in fetch_all(client, "food_nutrients", "food_code,nutrient_id,value_per_100g,source_id") if r["nutrient_id"] in CIQUAL_COLUMNS and r["value_per_100g"] is not None]
    for r in rng.sample(nut, 25):
        line = cq[cq.code == r["food_code"]]
        official = number(line[col_of[r["nutrient_id"]]].iloc[0]) if len(line) else None
        site = float(r["value_per_100g"])
        rows.append({"kind": "valeur Ciqual", "item": f"{r['food_code']} {r['nutrient_id']}", "site": site, "official": official, "ok": official is not None and close(site, official)})
    imp = [r for r in fetch_all(client, "food_impacts", "food_code,indicator_id,value_per_kg,source_id") if r["indicator_id"] in IMPACT_COLUMNS and r["source_id"] == "agribalyse-3.2"]
    for r in rng.sample(imp, 25):
        line = synth[synth.code == r["food_code"]]
        official = number(line[IMPACT_COLUMNS[r["indicator_id"]]].iloc[0]) if len(line) else None
        site = float(r["value_per_kg"])
        rows.append({"kind": "valeur Agribalyse", "item": f"{r['food_code']} {r['indicator_id']}", "site": site, "official": official, "ok": official is not None and close(site, official)})

    # 5 dishes recomputed from the official files (energy, protein per serving; CO2e per serving).
    foods = {f["code"]: f for f in fetch_all(client, "foods", "code,ciqual_code")}
    for slug in DISHES:
        with urllib.request.urlopen(f"{args.base}/compare/{slug}/donnees") as resp:
            data = json.load(resp)
        animal = data["animal"]
        for side, dish in (("animal", animal), ("végétal", next(iter(data["variants"].values()))["dish"])):
            per = {"energy_eu_kcal": 0.0, "protein_g": 0.0, "ghg_100y_kgco2e": 0.0}
            complete = True
            for i in dish["ingredients"]:
                code = i["code"]
                if code.startswith("agb"):
                    complete = False  # official recipe ingredient (published contribution): checked in agribalyse_recipes.py
                    continue
                ciq = (foods.get(code) or {}).get("ciqual_code") or code
                line = cq[cq.code == ciq]
                for k in ("energy_eu_kcal", "protein_g"):
                    v = number(line[col_of[k]].iloc[0]) if len(line) else None
                    if v is None:
                        complete = False
                    else:
                        per[k] += i["grams"] / 100 * v
                s = synth[synth.code == code]
                v = number(s["Changement climatique"].iloc[0]) if len(s) else None
                if v is None:
                    complete = False
                else:
                    per["ghg_100y_kgco2e"] += i["grams"] / 1000 * v
            if not complete:
                rows.append({"kind": "plat recalculé", "item": f"{slug} ({side})", "site": None, "official": None, "ok": None, "note": "ingrédient sans valeur simple ou recette officielle : non recalculé"})
                continue
            variant = next(iter(data["variants"].values()))
            for k in per:
                site_row = next((r for r in variant["perServing"] if r["id"] == k), None)
                site = site_row[side == "animal" and "animal" or "vegetal"] if site_row else None
                expected = per[k] / dish["servings"]
                rows.append({"kind": "plat recalculé", "item": f"{slug} ({side}) {k}", "site": site, "official": expected, "ok": site is not None and close(site, expected)})

    REPORT.parent.mkdir(exist_ok=True)
    out = pd.DataFrame(rows)
    out.to_csv(REPORT, index=False)
    bad = out[out.ok == False]  # noqa: E712
    print(f"audit: {len(out)} checks, {int((out.ok == True).sum())} identical, {len(bad)} different, {int(out.ok.isna().sum())} not recalculated")  # noqa: E712
    for r in bad.itertuples(index=False):
        print("  DIFFERENT", r.kind, r.item, "site", r.site, "official", r.official)
    sys.exit(1 if len(bad) else 0)


if __name__ == "__main__":
    main()
