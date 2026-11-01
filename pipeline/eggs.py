"""Days of life of laying hens per kg of eggs (FAOSTAT eggs per hen × FAO average egg weight).

    python pipeline/eggs.py [--dry-run]

days per kg of eggs = 365 / (eggs per laying hen per year × kg per egg). Eggs per hen: latest
official (flag A) FAOSTAT QCL yield for France (No/An). Egg weight: pipeline/egg_mass.csv (FAO
Technical Conversion Factors, France, with page and quote). Laying period only (rearing of the
pullets not counted): a low estimate, like the milk factor.

Pain per kg of eggs (condition of Matt, S14: laying duration AND eggs per hen sourced at a page):
pain hours per hen (Welfare Footprint rows, per animal, laying phase) / (eggs per laying cycle ×
kg per egg), from pipeline/laying_cycle.csv (ministry sheet, p. 1). Stored per kg, limited to egg
foods, source agri-bien-etre-poules.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CSV_PATH = HERE / "egg_mass.csv"
CYCLE_PATH = HERE / "laying_cycle.csv"
CYCLE_SOURCE = "agri-bien-etre-poules"
FAOSTAT_CSV = HERE / "raw" / "faostat" / "Production_Crops_Livestock_E_All_Data_(Normalized).csv"
SOURCE_ID = "fao-tcf"
CATEGORY = "poule pondeuse"
DAYS_PER_YEAR = 365  # unit conversion
GRAMS_PER_KG = 1000  # unit conversion
EGG_SUBGROUP = "oeufs"


def read_mass(path: Path = CSV_PATH) -> dict[str, str]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if len(rows) != 1 or not rows[0]["page"] or not rows[0]["quote"]:
        raise ValueError("egg_mass.csv: one cited row expected")
    float(rows[0]["value_g"])
    return rows[0]


def read_cycle(path: Path = CYCLE_PATH) -> dict[str, str]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if len(rows) != 1 or not rows[0]["page"] or not rows[0]["quote"]:
        raise ValueError("laying_cycle.csv: one cited row expected")
    float(rows[0]["eggs_per_hen"])
    return rows[0]


def pain_per_kg_rows(per_hen: list[dict], cycle: dict[str, str], mass: dict[str, str], codes: list[str]) -> list[dict]:
    """Pure: pain hours per kg of eggs from pain hours per hen and the eggs of one laying cycle."""
    kg_per_hen = float(cycle["eggs_per_hen"]) * float(mass["value_g"]) / GRAMS_PER_KG
    out = []
    for f in per_hen:
        if f["category"] != CATEGORY or not f["indicator_id"].startswith("pain_hours") or f.get("per") != "animal":
            continue
        k = lambda x: None if x is None else float(x) / kg_per_hen  # noqa: E731
        out.append({
            "category": CATEGORY, "indicator_id": f["indicator_id"], "value": float(f["value"]) / kg_per_hen, "low": k(f.get("low")),
            "high": k(f.get("high")), "per": "kg", "unit_basis": "par kg d'œufs (cycle de ponte)", "source_id": CYCLE_SOURCE, "food_codes": codes,
            "notes": (f"Heures de douleur par poule (Welfare Footprint, phase de ponte) ÷ {kg_per_hen:g} kg d'œufs par poule : environ "
                      f"{cycle['eggs_per_hen']} œufs par cycle de ponte de {cycle['duration_low_months']}-{cycle['duration_high_months']} mois "
                      f"(ministère de l'Agriculture, {cycle['page']}) × {mass['value_g']} g par œuf (FAO)."),
        })
    return out


def latest_yield(rows: list[dict[str, str]]) -> tuple[int, float]:
    """Pure: (year, eggs per laying hen per year) of the latest official row."""
    ok = [(int(r["Year"]), float(r["Value"])) for r in rows
          if r["Item"] == "Hen eggs in shell, fresh" and r["Element"] == "Yield" and r["Unit"] == "No/An" and r["Flag"] == "A" and r["Value"]]
    if not ok:
        raise ValueError("no official egg yield")
    return max(ok)


def egg_scope(foods: list[dict]) -> list[str]:
    return sorted(f["code"] for f in foods if f.get("animal_category") == CATEGORY and f.get("food_subgroup") == EGG_SUBGROUP)


def egg_factor(eggs_per_hen: float, year: int, mass: dict[str, str], codes: list[str]) -> dict:
    kg = float(mass["value_g"]) / GRAMS_PER_KG
    rng = lambda g: DAYS_PER_YEAR / (eggs_per_hen * float(g) / GRAMS_PER_KG) if g else None  # noqa: E731
    return {
        "category": CATEGORY, "indicator_id": "life_days_farmed", "value": DAYS_PER_YEAR / (eggs_per_hen * kg),
        # heavier eggs -> fewer days per kg: the low bound comes from the high mass
        "low": rng(mass.get("high_g")), "high": rng(mass.get("low_g")), "per": "kg", "unit_basis": "par kg d'œufs (phase de ponte)",
        "source_id": SOURCE_ID, "food_codes": codes,
        "notes": (f"365 / ({eggs_per_hen:g} œufs par poule et par an, FAOSTAT QCL France {year} × {mass['value_g']} g par œuf, FAO Technical "
                  "Conversion Factors, France, 1992-1996). Phase de ponte seulement (élevage des poulettes non compté) : estimation basse. "
                  "Douleur par kg d'œufs : donnée manquante (durée de ponte non sourcée à la page)."),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    mass = read_mass()
    with open(FAOSTAT_CSV, newline="", encoding="utf-8") as fh:
        france = [r for r in csv.DictReader(fh) if r["Area"] == "France"]
    year, n = latest_yield(france)
    print(f"Eggs: {n:g} eggs per hen ({year}), {mass['value_g']} g per egg -> {DAYS_PER_YEAR / (n * float(mass['value_g']) / GRAMS_PER_KG):.2f} days per kg")
    if args.dry_run:
        return
    from common import fetch_all, get_client, require_source, upsert

    client = get_client()
    require_source(client, SOURCE_ID, "1992-1996")
    codes = egg_scope(fetch_all(client, "foods", "code,animal_category,food_subgroup", is_animal=True))
    upsert(client, "category_factors", [egg_factor(n, year, mass, codes)], "category,indicator_id,source_id,scope")
    print(f"  {len(codes)} egg foods, e.g. {codes[:5]}")
    require_source(client, CYCLE_SOURCE, "fiche")
    per_hen = client.table("category_factors").select("category,indicator_id,value,low,high,per").eq("category", CATEGORY).eq("per", "animal").execute().data
    pain = pain_per_kg_rows(per_hen, read_cycle(), mass, codes)
    upsert(client, "category_factors", pain, "category,indicator_id,source_id,scope")
    for p in pain:
        print(f"  {p['indicator_id']:26} {p['value']:.4g} h per kg of eggs")


if __name__ == "__main__":
    main()
