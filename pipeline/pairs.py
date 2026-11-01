"""Import the reviewed dish pairs (animal dish ↔ home-made and store-bought plant alternatives).

    python pipeline/pairs.py [--dry-run] [--unpublished]

Inputs (versioned, reviewed by hand):
- pipeline/pair_dishes.csv : one row per dish (name, servings, description, rationale of the pair);
- pipeline/pairs.csv       : one row per ingredient, grams for the whole recipe, state actually eaten.

Rules checked before any write (CLAUDE.md rules 9, 10 and 11):
- every ingredient is a "pure" food: an animal ingredient must be listed as composition = pur in
  pipeline/animal_categories.csv; a food listed as mixte is never accepted;
- a plant dish contains no food of animal_categories.csv;
- one row per (dish, food): merge quantities instead of repeating a code;
- every code exists in foods; a variant without ciqual_code is refused (nutrients would be missing).
The criteria of each pair (serving mass, protein ratio, mass coverage) are printed after import,
read back from the dish_nutrients / dish_impacts views.

Idempotent: dishes are upserted by slug, the ingredients of these dishes are replaced by the CSV,
pairs are upserted on (animal_dish_id, vegan_dish_id). No numeric value is stored except grams.
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAIRS_CSV = HERE / "pairs.csv"
DISHES_CSV = HERE / "pair_dishes.csv"
ANIMAL_CSV = HERE / "animal_categories.csv"

VARIANTS = ("maison", "commerce")
# Self-validation criteria of the step (not data: thresholds of the editorial rules).
MIN_SERVING_G, MAX_SERVING_G = 300, 500
MIN_PROTEIN_RATIO = 0.70
MIN_COVERAGE = 0.95


class PairError(ValueError):
    pass


def read_csv(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def load_animal_composition(path: Path = ANIMAL_CSV) -> dict[str, str]:
    return {r["code"]: r["composition"] for r in read_csv(path)}


def validate(dishes: list[dict[str, str]], ingredients: list[dict[str, str]], composition: dict[str, str]) -> None:
    """Offline checks of the two CSV files. Raises PairError listing every problem."""
    errors: list[str] = []
    by_slug = {}
    for d in dishes:
        if d["dish_slug"] in by_slug:
            errors.append(f"duplicate dish {d['dish_slug']}")
        by_slug[d["dish_slug"]] = d
        if d["kind"] not in ("animal", "vegetal"):
            errors.append(f"{d['dish_slug']}: kind must be animal or vegetal")
        if d["kind"] == "animal" and d["variant"]:
            errors.append(f"{d['dish_slug']}: an animal dish has no variant")
        if d["kind"] == "vegetal" and d["variant"] not in VARIANTS:
            errors.append(f"{d['dish_slug']}: variant must be one of {VARIANTS}")
        if d["kind"] == "vegetal" and not d["rationale"].strip():
            errors.append(f"{d['dish_slug']}: a plant dish needs a rationale (same role, same portion)")
        if not d["servings"].isdigit() or int(d["servings"]) <= 0:
            errors.append(f"{d['dish_slug']}: servings must be a positive integer")

    groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for d in dishes:
        groups[d["pair"]].append(d)
    for pair, ds in groups.items():
        kinds = sorted((d["kind"], d["variant"]) for d in ds)
        if kinds != [("animal", ""), ("vegetal", "commerce"), ("vegetal", "maison")]:
            errors.append(f"pair {pair}: expected one animal dish, one maison and one commerce alternative, got {kinds}")

    seen = set()
    has_ingredients = set()
    for i, r in enumerate(ingredients, start=2):
        slug, code = r["dish_slug"], r["food_code"]
        d = by_slug.get(slug)
        if d is None:
            errors.append(f"pairs.csv line {i}: unknown dish {slug}")
            continue
        if r["pair"] != d["pair"] or r["kind"] != d["kind"] or r["variant"] != d["variant"]:
            errors.append(f"pairs.csv line {i}: pair/kind/variant differ from pair_dishes.csv for {slug}")
        if (slug, code) in seen:
            errors.append(f"pairs.csv line {i}: {code} repeated in {slug} (merge the quantities)")
        seen.add((slug, code))
        has_ingredients.add(slug)
        try:
            grams = float(r["grams"])
        except ValueError:
            grams = -1
        if not grams > 0:
            errors.append(f"pairs.csv line {i}: grams must be > 0")
        comp = composition.get(code)
        if comp == "mixte":
            errors.append(f"pairs.csv line {i}: {code} is a mixed animal food (rule 9)")
        if comp is not None and d["kind"] == "vegetal":
            errors.append(f"pairs.csv line {i}: {code} is an animal food in plant dish {slug}")
    for slug in by_slug.keys() - has_ingredients:
        errors.append(f"{slug}: no ingredient")
    if errors:
        raise PairError("\n".join(errors))


def check_against_db(client, ingredients: list[dict[str, str]]) -> None:
    from common import fetch_all

    foods = {f["code"]: f for f in fetch_all(client, "foods", "code,name_fr,is_animal,animal_category,ciqual_code,source_id")}
    errors = []
    for r in ingredients:
        f = foods.get(r["food_code"])
        if f is None:
            errors.append(f"{r['dish_slug']}: {r['food_code']} not in foods")
            continue
        if f["source_id"] == "agribalyse-3.2" and "_" in f["code"] and not f["ciqual_code"]:
            errors.append(f"{r['dish_slug']}: variant {f['code']} has no ciqual_code (rule 11)")
        if r["kind"] == "vegetal" and f["is_animal"]:
            errors.append(f"{r['dish_slug']}: {f['code']} {f['name_fr']} has is_animal = true")
        if f["is_animal"] and not f["animal_category"]:
            errors.append(f"{r['dish_slug']}: {f['code']} {f['name_fr']} has no animal_category (rule 9)")
    if errors:
        sys.exit("Database check failed:\n" + "\n".join(errors))


def summary(client, dishes: list[dict[str, str]]) -> list[str]:
    """Key figures per serving read back from the views, and the self-validation verdict."""
    slugs = [d["dish_slug"] for d in dishes]
    nut = client.table("dish_nutrients").select("slug,nutrient_id,per_serving,mass_coverage").in_("slug", slugs).in_(
        "nutrient_id", ["protein_g", "energy_eu_kcal"]).execute().data
    imp = client.table("dish_impacts").select("slug,indicator_id,per_serving,low_per_serving,high_per_serving,worst_dqr,mass_coverage").in_(
        "slug", slugs).eq("indicator_id", "ghg_100y_kgco2e").execute().data
    ids = {d["id"]: d["slug"] for d in client.table("dishes").select("id,slug").in_("slug", slugs).execute().data}
    grams: dict[str, float] = defaultdict(float)
    for row in client.table("dish_ingredients").select("dish_id,grams").in_("dish_id", list(ids)).execute().data:
        grams[ids[row["dish_id"]]] += float(row["grams"])
    n = {(x["slug"], x["nutrient_id"]): x for x in nut}
    g = {x["slug"]: x for x in imp}
    by_slug = {d["dish_slug"]: d for d in dishes}

    def fig(slug: str) -> dict:
        servings = int(by_slug[slug]["servings"])
        p, k, c = n.get((slug, "protein_g")), n.get((slug, "energy_eu_kcal")), g.get(slug)
        return {
            "g": grams[slug] / servings,
            "prot": p and float(p["per_serving"]), "kcal": k and float(k["per_serving"]),
            "co2": c and float(c["per_serving"]), "co2_low": c and float(c["low_per_serving"]),
            "co2_high": c and float(c["high_per_serving"]), "dqr": c and c["worst_dqr"],
            "cov": min(float(x["mass_coverage"]) for x in (p, k, c) if x) if (p and k and c) else None,
        }

    lines = ["| Paire | Plat | g/portion | Protéines g | kcal | kg CO2e (fourchette) | DQR max | Couverture | Critères |",
             "|---|---|---|---|---|---|---|---|---|"]
    ok_all = True
    for pair in dict.fromkeys(d["pair"] for d in dishes):
        ds = [d for d in dishes if d["pair"] == pair]
        animal = next(d for d in ds if d["kind"] == "animal")
        a = fig(animal["dish_slug"])
        for d in [animal] + [x for x in ds if x["kind"] == "vegetal"]:
            f = fig(d["dish_slug"])
            checks = []
            if not MIN_SERVING_G <= f["g"] <= MAX_SERVING_G:
                checks.append("masse")
            if f["cov"] is None or f["cov"] < MIN_COVERAGE:
                checks.append("couverture")
            ratio = ""
            if d["kind"] == "vegetal":
                if f["prot"] is None or a["prot"] is None or f["prot"] < MIN_PROTEIN_RATIO * a["prot"]:
                    checks.append("protéines")
                elif a["prot"]:
                    ratio = f" ({f['prot'] / a['prot']:.0%})"
                gap = (a["co2"] - f["co2"]) / a["co2"] * 100 if a["co2"] and f["co2"] is not None else None
                gap_txt = f", −{gap:.0f} %" if gap is not None else ""
            else:
                gap_txt = ""
            ok_all &= not checks
            fmt = lambda x, p=1: "donnée manquante" if x is None else f"{x:.{p}f}"  # noqa: E731
            lines.append(
                f"| {pair} | {d['name_fr']} ({d['variant'] or 'animal'}) | {f['g']:.0f} | {fmt(f['prot'])}{ratio} | "
                f"{fmt(f['kcal'], 0)} | {fmt(f['co2'], 2)} ({fmt(f['co2_low'], 2)}–{fmt(f['co2_high'], 2)}){gap_txt} | "
                f"{f['dqr'] if f['dqr'] is not None else '—'} | {fmt(f['cov'], 2)} | {'OK' if not checks else 'À REVOIR : ' + ', '.join(checks)} |")
    lines.append("")
    lines.append("Tous les critères sont respectés." if ok_all else "Au moins un critère n'est pas respecté : ajuster la recette.")
    return lines


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--unpublished", action="store_true", help="import with is_published = false")
    args = ap.parse_args()

    dishes, ingredients = read_csv(DISHES_CSV), read_csv(PAIRS_CSV)
    try:
        validate(dishes, ingredients, load_animal_composition())
    except PairError as e:
        sys.exit(f"Invalid pair files:\n{e}")
    print(f"Pairs: {len({d['pair'] for d in dishes})} pairs, {len(dishes)} dishes, {len(ingredients)} ingredient rows")
    if args.dry_run:
        print("Dry run: nothing written.")
        return

    from common import get_client

    client = get_client()
    check_against_db(client, ingredients)
    published = not args.unpublished

    rows = [{"slug": d["dish_slug"], "name_fr": d["name_fr"], "kind": d["kind"], "servings": int(d["servings"]),
             "description": d["description"], "is_published": published, "created_by": None} for d in dishes]
    client.table("dishes").upsert(rows, on_conflict="slug").execute()
    ids = {d["slug"]: d["id"] for d in client.table("dishes").select("id,slug").in_("slug", [r["slug"] for r in rows]).execute().data}

    # Replace the ingredients of these dishes only (the CSV is the source of truth for them).
    client.table("dish_ingredients").delete().in_("dish_id", list(ids.values())).execute()
    client.table("dish_ingredients").insert([
        {"dish_id": ids[r["dish_slug"]], "food_code": r["food_code"], "grams": float(r["grams"]), "note": r["note"] or None}
        for r in ingredients]).execute()

    pairs = []
    for pair in dict.fromkeys(d["pair"] for d in dishes):
        ds = [d for d in dishes if d["pair"] == pair]
        animal = next(d for d in ds if d["kind"] == "animal")
        for v in (d for d in ds if d["kind"] == "vegetal"):
            pairs.append({"animal_dish_id": ids[animal["dish_slug"]], "vegan_dish_id": ids[v["dish_slug"]],
                          "variant": v["variant"], "rationale": v["rationale"], "is_published": published})
    client.table("dish_pairs").upsert(pairs, on_conflict="animal_dish_id,vegan_dish_id").execute()
    print(f"Imported: {len(rows)} dishes, {len(ingredients)} ingredients, {len(pairs)} pairs (is_published = {published})")
    print("\n".join(summary(client, dishes)))


if __name__ == "__main__":
    main()
