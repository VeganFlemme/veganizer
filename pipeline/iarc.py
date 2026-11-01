"""IARC Monographs vol. 114 classification of meat foods (no numeric data).

    python pipeline/iarc.py build [--force]   # draft pipeline/iarc_meat.csv from rules
    python pipeline/iarc.py import            # load the reviewed CSV into foods.iarc_meat

Definitions (IARC vol. 114, p. 37):
- § 1.1.1 red meat: fresh unprocessed mammalian muscle meat (beef, veal, pork, lamb, mutton,
  horse, goat), minced or frozen, usually eaten cooked                      -> 'rouge' (Group 2A)
- § 1.1.3 processed meat: meat transformed by salting, curing, fermentation, smoking or other
  processes to enhance flavour or improve preservation (also poultry, offal) -> 'transformée' (Group 1)
- § 1.1.2 offal is defined apart: not classified here.
Rules of the draft (to review by hand): Ciqual subgroup "charcuteries…" -> transformée;
raw/cooked meat of bovin, veau, porc, agneau, cheval, not offal -> rouge. Everything else: null.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
from pathlib import Path

from common import fetch_all, get_client

CSV_PATH = Path(__file__).resolve().parent / "iarc_meat.csv"
RED_CATEGORIES = {"bovin", "veau", "porc", "agneau", "cheval"}
MEAT_SUBGROUPS = {"viandes crues", "viandes cuites", "autres produits à base de viande"}
PROCESSED_SUBGROUPS = {"charcuteries", "charcuteries et alternatives végétales"}
OFFAL = re.compile(r"\b(cervelle|coeur|foie|langue|ris|rognon|tete|pied|abats?|gesier|tripes?|joue de porc confite)\b")


def fold(s: str) -> str:
    s = s.lower().replace("œ", "oe")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def classify(food: dict) -> tuple[str, str] | None:
    """Pure: (iarc_meat, evidence) or None."""
    if not food.get("is_animal") or not food.get("animal_category"):
        return None
    sub = food.get("food_subgroup") or ""
    if sub in PROCESSED_SUBGROUPS:
        return "transformée", f"sous-groupe Ciqual « {sub} »"
    if sub in MEAT_SUBGROUPS and food["animal_category"] in RED_CATEGORIES:
        if OFFAL.search(fold(food["name_fr"])):
            return None
        return "rouge", f"sous-groupe « {sub} », catégorie « {food['animal_category']} »"
    return None


def build(force: bool) -> None:
    if CSV_PATH.exists() and not force:
        sys.exit(f"{CSV_PATH.name} exists (reviewed file). Use --force to overwrite with a new draft.")
    client = get_client()
    foods = fetch_all(client, "foods", "code,name_fr,is_animal,animal_category,food_subgroup")
    rows = []
    for f in foods:
        hit = classify(f)
        if hit:
            rows.append({"code": f["code"], "name_fr": f["name_fr"], "iarc_meat": hit[0], "evidence": hit[1]})
    rows.sort(key=lambda r: (r["iarc_meat"], r["name_fr"]))
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["code", "name_fr", "iarc_meat", "evidence"], lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"Draft written: {len(rows)} foods ({sum(r['iarc_meat'] == 'rouge' for r in rows)} rouge, "
          f"{sum(r['iarc_meat'] == 'transformée' for r in rows)} transformée)")


def do_import() -> None:
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if any(r["iarc_meat"] not in ("rouge", "transformée") for r in rows) or len({r["code"] for r in rows}) != len(rows):
        sys.exit(f"Invalid or duplicate rows in {CSV_PATH.name}.")
    client = get_client()
    current = {f["code"] for f in fetch_all(client, "foods", "code,iarc_meat") if f["iarc_meat"]}
    listed = {r["code"] for r in rows}
    for code in sorted(current - listed):
        client.table("foods").update({"iarc_meat": None}).eq("code", code).execute()
    for value in ("rouge", "transformée"):
        codes = [r["code"] for r in rows if r["iarc_meat"] == value]
        for i in range(0, len(codes), 200):
            client.table("foods").update({"iarc_meat": value}).in_("code", codes[i:i + 200]).execute()
    for value in ("rouge", "transformée"):
        n = client.table("foods").select("code", count="exact", head=True).eq("iarc_meat", value).execute().count
        print(f"  foods.iarc_meat = {value}: {n}")
    for code in ("6230", "28725", "28910", "36005"):
        r = client.table("foods").select("code,name_fr,iarc_meat").eq("code", code).execute().data
        print(f"  check {r[0]['code']} {r[0]['name_fr']}: {r[0]['iarc_meat']}" if r else f"  check {code}: missing")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["build", "import"])
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    build(args.force) if args.command == "build" else do_import()


if __name__ == "__main__":
    main()
