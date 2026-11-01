"""Automatic plant alternatives for animal foods ("Comparaison simplifiée").

    python pipeline/auto_alternatives.py build    # draft pipeline/auto_alternatives.csv from the rules
    python pipeline/auto_alternatives.py import   # load the reviewed CSV into food_alternatives

Rules (reviewed by hand): pipeline/auto_alternatives_rules.csv — for an animal food's Ciqual
subgroup, the subgroups (and optional name pattern) where plant candidates are taken: same role in
the meal; for composed dishes (require_shared_word) a candidate must share a significant word of
the name (dish type), otherwise no alternative is proposed. A candidate must have foods.is_animal = false ("no animal ingredient identified", rule 10:
never shown as "vegan"), protein, energy and an Agribalyse CO2e value. Legumes: cooked forms only.
Ranking: subgroup in the order given by the rule (same family first), then number of significant
words shared with the animal food's name (e.g. "lasagnes", "pizza"), then smallest gap in protein
per 100 g, then lowest CO2e; at most 3 per animal food.
No numeric value is stored: the comparison is computed from Ciqual / Agribalyse at display time.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
from pathlib import Path

from common import fetch_all, get_client

HERE = Path(__file__).resolve().parent
RULES = HERE / "auto_alternatives_rules.csv"
OUT = HERE / "auto_alternatives.csv"
MAX_ALTERNATIVES = 3
LEGUMES = "légumineuses"
COOKED = re.compile(r"\b(cuit|cuite|cuits|cuites|bouilli|bouillie|bouillis|bouillies)\b", re.IGNORECASE)
FIELDS = ["animal_code", "animal_name", "rank", "plant_code", "plant_name", "protein_animal_g", "protein_plant_g", "rule"]


def read_rules(path: Path = RULES) -> dict[str, dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    out = {}
    for r in rows:
        if r["animal_subgroup"] in out:
            raise ValueError(f"duplicate rule for {r['animal_subgroup']!r}")
        out[r["animal_subgroup"]] = {
            "subgroups": r["candidate_subgroups"].split("|"),
            "regex": re.compile(r["candidate_name_regex"], re.IGNORECASE) if r["candidate_name_regex"] else None,
            "rule": r["rule"],
            "shared_word": r.get("require_shared_word", "false") == "true",
        }
    return out


def candidates_for(rule: dict, plants: list[dict]) -> list[dict]:
    out = []
    for p in plants:
        if p["food_subgroup"] not in rule["subgroups"]:
            continue
        if rule["regex"] and not rule["regex"].search(p["name_fr"]):
            continue
        if p["food_subgroup"] == LEGUMES and not COOKED.search(p["name_fr"]):
            continue
        out.append(p)
    return out


STOPWORDS = {"avec", "sans", "pour", "type", "fait", "maison", "preemballe", "preemballee", "preemballes",
             "preemballees", "cuit", "cuite", "cuits", "cuites", "aliment", "moyen", "france", "nature"}


def words(name: str) -> set[str]:
    folded = "".join(c for c in unicodedata.normalize("NFD", name.lower().replace("œ", "oe")) if unicodedata.category(c) != "Mn")
    return {w for w in re.findall(r"[a-z]{4,}", folded) if w not in STOPWORDS}


def build_rows(foods: list[dict], rules: dict[str, dict]) -> list[dict]:
    """Pure: foods have code, name_fr, is_animal, food_subgroup, protein, kcal, ghg (None = missing)."""
    complete = lambda f: f["protein"] is not None and f["kcal"] is not None and f["ghg"] is not None  # noqa: E731
    plants = [f for f in foods if not f["is_animal"] and complete(f)]
    rows = []
    for a in foods:
        if not a["is_animal"] or a["protein"] is None:
            continue
        rule = rules.get(a["food_subgroup"] or "")
        if not rule:
            continue
        aw = words(a["name_fr"])
        pool = candidates_for(rule, plants)
        if rule["shared_word"]:
            # Composed dishes: same role only if the dish type is shared (e.g. "pizza", "lasagnes").
            pool = [p for p in pool if aw & words(p["name_fr"])]
        ranked = sorted(pool, key=lambda p: (
            rule["subgroups"].index(p["food_subgroup"]), -len(aw & words(p["name_fr"])),
            abs(p["protein"] - a["protein"]), p["ghg"], p["code"]))
        for i, p in enumerate(ranked[:MAX_ALTERNATIVES], start=1):
            rows.append({"animal_code": a["code"], "animal_name": a["name_fr"], "rank": i, "plant_code": p["code"],
                         "plant_name": p["name_fr"], "protein_animal_g": a["protein"], "protein_plant_g": p["protein"],
                         "rule": rule["rule"]})
    return rows


def load_foods(client) -> list[dict]:
    foods = fetch_all(client, "foods", "code,name_fr,is_animal,food_subgroup,ciqual_code")
    nut: dict[tuple[str, str], float] = {}
    for nid in ("protein_g", "energy_eu_kcal"):
        for r in fetch_all(client, "food_nutrients", "food_code,value_per_100g", nutrient_id=nid, source_id="ciqual-2025"):
            if r["value_per_100g"] is not None:
                nut[(r["food_code"], nid)] = float(r["value_per_100g"])
    ghg = {r["food_code"]: float(r["value_per_kg"]) for r in fetch_all(client, "food_impacts", "food_code,value_per_kg", indicator_id="ghg_100y_kgco2e")}
    for f in foods:
        n = f["ciqual_code"] or f["code"]
        f["protein"] = nut.get((n, "protein_g"))
        f["kcal"] = nut.get((n, "energy_eu_kcal"))
        f["ghg"] = ghg.get(f["code"])
    return foods


def build() -> None:
    client = get_client()
    rows = build_rows(load_foods(client), read_rules())
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    animals = len({r["animal_code"] for r in rows})
    print(f"Draft written: {len(rows)} alternatives for {animals} animal foods")


def do_import() -> None:
    with open(OUT, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    keys = {(r["animal_code"], r["plant_code"]) for r in rows}
    if len(keys) != len(rows):
        sys.exit("Duplicate (animal_code, plant_code) in auto_alternatives.csv")
    client = get_client()
    plant = {f["code"]: f for f in fetch_all(client, "foods", "code,is_animal")}
    bad = [r for r in rows if r["plant_code"] not in plant or plant[r["plant_code"]]["is_animal"]]
    if bad:
        sys.exit(f"{len(bad)} alternatives are not plant foods any more (rule 10), e.g. {bad[0]['plant_code']}: rebuild and review.")
    current = {(r["animal_code"], r["plant_code"]) for r in fetch_all(client, "food_alternatives", "animal_code,plant_code")}
    for a, p in sorted(current - keys):
        client.table("food_alternatives").delete().eq("animal_code", a).eq("plant_code", p).execute()
    payload = [{"animal_code": r["animal_code"], "plant_code": r["plant_code"], "rank": int(r["rank"]), "rule": r["rule"]} for r in rows]
    for i in range(0, len(payload), 1000):
        client.table("food_alternatives").upsert(payload[i:i + 1000], on_conflict="animal_code,plant_code").execute()
    n = client.table("food_alternatives").select("animal_code", count="exact", head=True).execute().count
    print(f"Imported: {n} food_alternatives rows ({len(current - keys)} removed)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["build", "import"])
    args = ap.parse_args()
    build() if args.command == "build" else do_import()


if __name__ == "__main__":
    main()
