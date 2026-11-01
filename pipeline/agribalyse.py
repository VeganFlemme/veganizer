"""Import AGRIBALYSE 3.2 (Synthèse + Détail par ingrédient) into food_impacts and
food_impact_ingredients. Run pipeline/ciqual.py first.

Usage:
    python pipeline/agribalyse.py [--download] [--dry-run]

Source: ADEME / INRAE, AGRIBALYSE v3.2, Licence Ouverte (data.ademe.fr, linked from data.gouv.fr).
All impacts are per kg of product (as published). Idempotent upserts.

Foods:
- Agribalyse code without suffix and present in Ciqual -> impacts attached to the Ciqual food.
- Agribalyse code without suffix absent from Ciqual 2025 -> new foods row (no nutrients).
- Variant codes ('20061_2'…) -> one foods row each; ciqual_code from
  pipeline/agribalyse_variants.csv (null when the variant is not the same food/state).
  Agribalyse flags no default/average variant, so no variant impact is copied to the bare code.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import pandas as pd
import requests

from common import RAW, clean_text, fetch_all, get_client, infer_state, parse_number, require_source, upsert

SOURCE_ID = "agribalyse-3.2"
EXPECTED_VERSION = "3.2"
VARIANTS_CSV = Path(__file__).resolve().parent / "agribalyse_variants.csv"
DATASETS = {
    "agribalyse-31-synthese": RAW / "agribalyse_3.2_synthese.csv",
    "agribalyse-31-detail-par-ingredient": RAW / "agribalyse_3.2_detail_ingredient.csv",
}
SYNTH, DETAIL = DATASETS.values()

# Agribalyse column -> indicators.id (unit per kg of product, from the ADEME schema)
INDICATOR_COLUMNS = {
    "Score unique EF": "ef_single_score",
    "Changement climatique": "ghg_100y_kgco2e",
    "Appauvrissement de la couche d'ozone": "ozone_depletion_kgcfc11",
    "Rayonnements ionisants": "ionising_radiation_kbq",
    "Formation photochimique d'ozone": "photochem_ozone_kgnmvoc",
    "Particules fines": "particulates",
    "Effets toxicologiques sur la santé humaine : substances non-cancérogènes": "human_tox_noncancer_ctuh",
    "Effets toxicologiques sur la santé humaine : substances cancérogènes": "human_tox_cancer_ctuh",
    "Acidification terrestre et eaux douces": "acidification_molh",
    "Eutrophisation eaux douces": "eutro_fw_kgp",
    "Eutrophisation marine": "eutro_marine_kgn",
    "Eutrophisation terrestre": "eutro_terrestrial_moln",
    "Écotoxicité pour écosystèmes aquatiques d'eau douce": "ecotox_ctue",
    "Utilisation du sol": "land_use_pt",
    "Épuisement des ressources eau": "water_scarcity_m3",
    "Épuisement des ressources énergétiques": "resource_energy_mj",
    "Épuisement des ressources minéraux": "resource_minerals_kgsb",
    "Changement climatique - émissions biogéniques": "ghg_biogenic_kgco2e",
    "Changement climatique - émissions fossiles": "ghg_fossil_kgco2e",
    "Changement climatique - émissions liées au changement d'affectation des sols": "ghg_luc_kgco2e",
}

# Indicators not in the seed. Units from the ADEME field descriptions; the three
# GHG sub-totals have no unit there: kg CO2e, checked by their sum == total.
NEW_INDICATORS = [
    ("ozone_depletion_kgcfc11", "Appauvrissement de la couche d'ozone", "kg CFC-11 éq.", None),
    ("ionising_radiation_kbq", "Rayonnements ionisants", "kBq U-235 éq.", None),
    ("photochem_ozone_kgnmvoc", "Formation photochimique d'ozone", "kg COVNM éq.", None),
    ("human_tox_noncancer_ctuh", "Toxicité humaine, effets non cancérogènes", "CTUh", None),
    ("human_tox_cancer_ctuh", "Toxicité humaine, effets cancérogènes", "CTUh", None),
    ("eutro_terrestrial_moln", "Eutrophisation terrestre", "mol N éq.", None),
    ("land_use_pt", "Utilisation des sols (indice de qualité des sols)", "Pt",
     "EF 3.1, indice sans dimension : ce n'est pas une surface en m²·an"),
    ("resource_energy_mj", "Épuisement des ressources énergétiques", "MJ", None),
    ("resource_minerals_kgsb", "Épuisement des ressources minérales", "kg Sb éq.", None),
    ("ghg_biogenic_kgco2e", "Gaz à effet de serre — émissions biogéniques", "kg CO2e", "Part du total Agribalyse"),
    ("ghg_fossil_kgco2e", "Gaz à effet de serre — émissions fossiles", "kg CO2e", "Part du total Agribalyse"),
    ("ghg_luc_kgco2e", "Gaz à effet de serre — changement d'affectation des sols", "kg CO2e",
     "Part du total Agribalyse ; peut être négative"),
]

SYNTH_ID_COLUMNS = [
    "Code AGB", "Code CIQUAL", "Groupe d'aliment", "Sous-groupe d'aliment", "Nom du Produit en Français",
    "LCI Name", "code saison", "code avion", "Livraison", "Approche emballage", "Préparation", "DQR",
]
DETAIL_ID_COLUMNS = [
    "Ciqual AGB", "Ciqual code", "Nom Français", "Groupe d'aliment", "Sous-groupe d'aliment", "LCI Name", "Ingredients",
]


def norm(s: str) -> str:
    return " ".join(str(s).replace("\xa0", " ").split())


def download() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for slug, path in DATASETS.items():
        meta = requests.get(f"https://data.ademe.fr/data-fair/api/v1/datasets/{slug}", timeout=60).json()
        if f"v{EXPECTED_VERSION}" not in (meta.get("description") or ""):
            sys.exit(f"{slug}: description no longer says v{EXPECTED_VERSION}. Version changed: stop and ask.")
        r = requests.get(f"https://data.ademe.fr/data-fair/api/v1/datasets/{slug}/raw", timeout=300)
        r.raise_for_status()
        path.write_bytes(r.content)
        print(f"  downloaded {path.name} ({len(r.content)} bytes, v{EXPECTED_VERSION}, updated {meta.get('dataUpdatedAt')})")


def read_csv(path: Path, id_columns: list[str], expect_ghg_parts: bool) -> pd.DataFrame:
    df = pd.read_csv(path, dtype=str).dropna(how="all")
    df.columns = [norm(c) for c in df.columns]
    expected = set(id_columns) | {c for c in INDICATOR_COLUMNS if expect_ghg_parts or " - émissions" not in c}
    if set(df.columns) != expected:
        sys.exit(f"{path.name}: columns changed. Missing {expected - set(df.columns)}, "
                 f"unexpected {set(df.columns) - expected}. Stop and ask.")
    return df


def load_variants(variant_codes: set[str]) -> dict[str, str | None]:
    with open(VARIANTS_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    mapping = {r["agb_code"]: (r["ciqual_code"] or None) for r in rows}
    for r in rows:
        if (r["same_food"] == "true") != bool(r["ciqual_code"]):
            sys.exit(f"{VARIANTS_CSV.name}: {r['agb_code']} same_food/ciqual_code inconsistent.")
    if set(mapping) != variant_codes:
        sys.exit(f"{VARIANTS_CSV.name} out of date. Missing {variant_codes - set(mapping)}, "
                 f"extra {set(mapping) - variant_codes}. Review the new variants by hand.")
    return mapping


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.download:
        download()
    for p in DATASETS.values():
        if not p.exists():
            sys.exit(f"{p} missing: run with --download.")

    synth = read_csv(SYNTH, SYNTH_ID_COLUMNS, expect_ghg_parts=True)
    detail = read_csv(DETAIL, DETAIL_ID_COLUMNS, expect_ghg_parts=False)
    if synth["Code AGB"].duplicated().any():
        sys.exit("Duplicate Code AGB in Synthèse: stop and ask.")
    if detail.duplicated(["Ciqual AGB", "Ingredients"]).any():
        sys.exit("Duplicate (product, ingredient) in Détail par ingrédient: stop and ask.")
    unknown = set(detail["Ciqual AGB"]) - set(synth["Code AGB"])
    if unknown:
        sys.exit(f"Détail codes absent from Synthèse: {sorted(unknown)[:10]}")

    is_variant = synth["Code AGB"].str.contains("_")
    if ((~is_variant) & (synth["Code AGB"] != synth["Code CIQUAL"])).any():
        sys.exit("Unsuffixed Code AGB differs from Code CIQUAL: stop and ask.")
    variants = load_variants(set(synth.loc[is_variant, "Code AGB"]))

    client = None if args.dry_run else get_client()
    if client:
        require_source(client, SOURCE_ID, EXPECTED_VERSION)
        ciqual_codes = {f["code"] for f in fetch_all(client, "foods", "code", source_id="ciqual-2025")}
        if not ciqual_codes:
            sys.exit("No Ciqual foods in the database: run pipeline/ciqual.py first.")
    else:
        ciqual = pd.read_excel(RAW / "ciqual_2025_FR_2025_11_03.xlsx", dtype=str)
        ciqual_codes = set(ciqual["alim_code"].str.strip())

    for agb, ciq in variants.items():
        if ciq and ciq not in ciqual_codes:
            sys.exit(f"{VARIANTS_CSV.name}: {agb} -> {ciq} not a Ciqual 2025 food.")

    # Foods created by Agribalyse (variants + codes absent from Ciqual). Ciqual foods are not touched.
    new_foods = []
    for _, r in synth.iterrows():
        code = r["Code AGB"]
        if code in ciqual_codes:
            continue
        name = clean_text(r["Nom du Produit en Français"])
        state = infer_state(name)
        sub = clean_text(r["Sous-groupe d'aliment"])
        new_foods.append({
            "code": code,
            "name_fr": name,
            "name_en": clean_text(r["LCI Name"]),
            "food_group": clean_text(r["Groupe d'aliment"]),
            "food_subgroup": sub,
            "state": state,
            "state_inferred": state is not None,
            "ciqual_code": variants.get(code),
            "source_id": SOURCE_ID,
        })

    impacts = []
    for _, r in synth.iterrows():
        dqr = parse_number(r["DQR"])
        for col, ind in INDICATOR_COLUMNS.items():
            value = parse_number(r[col])
            if value is None:
                continue  # no row rather than a fake value
            impacts.append({"food_code": r["Code AGB"], "indicator_id": ind, "value_per_kg": value,
                            "dqr": dqr, "source_id": SOURCE_ID})

    ingredients = []
    for _, r in detail.iterrows():
        for col, ind in INDICATOR_COLUMNS.items():
            if col not in detail.columns:
                continue
            value = parse_number(r[col])
            if value is None:
                continue
            ingredients.append({"food_code": r["Ciqual AGB"], "ingredient": clean_text(r["Ingredients"]),
                                "indicator_id": ind, "value_per_kg": value, "source_id": SOURCE_ID})

    n_var = int(is_variant.sum())
    print(f"Agribalyse: {len(synth)} products ({n_var} variants, "
          f"{sum(1 for v in variants.values() if v)} linked to a Ciqual food), "
          f"{len(new_foods) - n_var} codes absent from Ciqual 2025")
    print(f"  food_impacts rows: {len(impacts)}  food_impact_ingredients rows: {len(ingredients)} "
          f"({detail['Ciqual AGB'].nunique()} products)")
    print(f"  missing impact values: {len(synth) * len(INDICATOR_COLUMNS) - len(impacts)}")
    if args.dry_run:
        print("Dry run: nothing written.")
        return

    upsert(client, "indicators", [
        {"id": i, "pillar": "climat", "name_fr": n, "unit": u, "horizon": "long", "scale": "collectif",
         "higher_is_better": False, "description": d if d else "Agribalyse 3.2, EF 3.1"}
        for i, n, u, d in NEW_INDICATORS
    ], "id")
    upsert(client, "foods", new_foods, "code")
    upsert(client, "food_impacts", impacts, "food_code,indicator_id,source_id")
    upsert(client, "food_impact_ingredients", ingredients, "food_code,ingredient,indicator_id,source_id")

    count = lambda t: client.table(t).select("food_code", count="exact", head=True).eq("source_id", SOURCE_ID).execute().count
    print(f"In database: food_impacts {count('food_impacts')}, food_impact_ingredients {count('food_impact_ingredients')}")
    print("5 examples (kg CO2e/kg, DQR):")
    for _, r in synth.sample(5, random_state=1).iterrows():
        print(f"  {r['Code AGB']} {clean_text(r['Nom du Produit en Français'])}: {r['Changement climatique']} (DQR {r['DQR']})")


if __name__ == "__main__":
    main()
