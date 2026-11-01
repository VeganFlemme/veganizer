"""Cumulative pain per animal (Welfare Footprint, via Our World in Data, CC BY 4.0).

    python pipeline/welfare_footprint.py [--download] [--dry-run]

Sources (opened 2026-11-01):
- OWID dataset « Welfare of broiler chickens (Welfare Footprint) » — Welfare Footprint Project,
  Quantifying Pain in Broiler Chickens (2022), https://welfarefootprint.org/broilers/
- OWID dataset « Pain hours and days of hen systems » — Schuck-Paim & Alonso (2021),
  Quantifying Pain in Laying Hens, https://welfarefootprint.org/research-projects/laying-hens/
Licence: « Our reports, data, and charts are licensed under CC BY 4.0 unless otherwise stated ».

Rules:
- only indicators whose OWID unit is hours or seconds; never the "days" columns (16-hour awake days);
- poulet de chair: value = Fast-growing (conventional breeds); Slower-growing kept in notes only;
- poule pondeuse: conventional cages are banned in the EU (Directive 1999/74/CE, art. 5 § 2), so
  value = low = Cage-free aviary, high = the higher of Furnished cages and Cage-free aviary;
- values are PER ANIMAL (category_factors.per = 'animal'), minimum estimates; hens: laying phase only.
  lib/scoring converts to per kg with animals_killed_land of the same category.
"""

from __future__ import annotations

import argparse
import json
import sys

import requests

from common import RAW, get_client, require_source, upsert

SOURCE_ID = "welfare-footprint"
DIR = RAW / "owid_welfare_footprint"
API = "https://api.ourworldindata.org/v1/indicators/{id}.{kind}.json"
SECONDS_PER_HOUR = 3600  # unit conversion
UNIT_TO_HOURS = {"hours": 1, "seconds": 1 / SECONDS_PER_HOUR}

# OWID indicator id -> (category, indicator_id). Found in the OWID datasets above.
INDICATORS = {
    791314: ("poulet de chair", "pain_hours_excruciating"),  # excrutiating_pain_seconds
    789454: ("poule pondeuse", "pain_hours_annoying"),  # annoying_pain_in_hours
    789452: ("poule pondeuse", "pain_hours_hurtful"),  # hurtful_pain_in_hours
    789451: ("poule pondeuse", "pain_hours_disabling"),  # disabling_pain_in_hours
    789450: ("poule pondeuse", "pain_hours_excruciating"),  # excrutiating_hours_in_pain
}
# Broiler intensities published by OWID only in days (not used): 791315, 791316, 791317.
DAYS_ONLY = {791315: "disabling", 791316: "hurtful", 791317: "annoying"}

BROILER_MAIN, BROILER_INFO = "Fast-growing", "Slower-growing"
HEN_VALUE, HEN_OTHER = "Cage-free aviary", "Furnished cages"
CITATION = "Welfare Footprint Institute — Schuck-Paim & Alonso, CC BY 4.0"


def download() -> None:
    DIR.mkdir(parents=True, exist_ok=True)
    for i in list(INDICATORS) + list(DAYS_ONLY):
        for kind in ("metadata", "data"):
            r = requests.get(API.format(id=i, kind=kind), timeout=60)
            r.raise_for_status()
            (DIR / f"{i}.{kind}.json").write_text(r.text, encoding="utf-8")
    print(f"Downloaded {len(INDICATORS) + len(DAYS_ONLY)} OWID indicators")


def load(i: int) -> tuple[dict, dict]:
    return (json.loads((DIR / f"{i}.metadata.json").read_text(encoding="utf-8")),
            json.loads((DIR / f"{i}.data.json").read_text(encoding="utf-8")))


def values_by_entity(meta: dict, data: dict) -> dict[str, tuple[float, int]]:
    names = {e["id"]: e["name"] for e in meta["dimensions"]["entities"]["values"]}
    return {names[e]: (float(v), int(y)) for e, v, y in zip(data["entities"], data["values"], data["years"])}


def compute(indicators: dict[int, tuple[dict, dict]]) -> list[dict]:
    """Pure: category_factors rows from OWID metadata/data. Raises ValueError on a non-hour unit."""
    rows = []
    for i, (meta, data) in indicators.items():
        category, indicator = INDICATORS[i]
        unit = meta.get("unit")
        if unit not in UNIT_TO_HOURS:
            raise ValueError(f"OWID indicator {i} ({meta.get('name')}) is in {unit!r}: only hours or seconds are used")
        k = UNIT_TO_HOURS[unit]
        v = values_by_entity(meta, data)
        origin = (meta.get("origins") or [{}])[0]
        ref = f"OWID {meta.get('catalogPath')} ; {origin.get('citationFull', '')}"
        if category == "poulet de chair":
            main, year = v[BROILER_MAIN]
            info = v.get(BROILER_INFO)
            notes = (f"Souches à croissance rapide (standard) : {main * k:.6g} h par animal sur sa vie, {year}. "
                     + (f"Information : souches à croissance plus lente {info[0] * k:.6g} h (non utilisé). " if info else "")
                     + f"Estimation minimale (heures éveillées). {CITATION}. {ref}")
            rows.append(_row(category, indicator, main * k, None, None, notes))
        else:
            aviary, year = v[HEN_VALUE]
            furnished, _ = v[HEN_OTHER]
            value = aviary * k
            notes = (f"Volière sans cage : {value:.6g} h ; cages aménagées : {furnished * k:.6g} h par poule, phase de ponte "
                     f"seulement, {year}. Cages conventionnelles exclues (interdites dans l'UE, directive 1999/74/CE, art. 5 § 2). "
                     f"Estimation minimale. {CITATION}. {ref}")
            rows.append(_row(category, indicator, value, value, max(value, furnished * k), notes))
    return rows


def _row(category, indicator, value, low, high, notes) -> dict:
    return {"category": category, "indicator_id": indicator, "value": value, "low": low, "high": high,
            "unit_basis": "par animal (heures de douleur, estimation minimale)", "per": "animal",
            "source_id": SOURCE_ID, "notes": notes}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.download:
        download()
    missing = [i for i in INDICATORS if not (DIR / f"{i}.data.json").exists()]
    if missing:
        sys.exit(f"Missing OWID files {missing}: run with --download.")
    for i, name in DAYS_ONLY.items():
        if (DIR / f"{i}.metadata.json").exists():
            unit = load(i)[0].get("unit")
            print(f"  not used: broiler {name} pain, OWID {i}, unit {unit!r} (days of 16 h)")
    rows = compute({i: load(i) for i in INDICATORS})
    print(f"Welfare Footprint: {len(rows)} per-animal factors")
    for r in rows:
        print(f"  {r['category']:16} {r['indicator_id']:24} {r['value']:.6g} h (low {r['low']}, high {r['high']})")
    if args.dry_run:
        print("Dry run: nothing written.")
        return
    client = get_client()
    require_source(client, SOURCE_ID, "OWID")
    upsert(client, "category_factors", rows, "category,indicator_id,source_id,scope")


if __name__ == "__main__":
    main()
