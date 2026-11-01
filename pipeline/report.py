"""Post-import report, read back from the database (not from the raw files).

    python pipeline/report.py [--foods CODE ...]

Writes pipeline/reports/import_report.md and CSV lists of unmatched foods.
"""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

import pandas as pd

from common import fetch_all, get_client

OUT = Path(__file__).resolve().parent / "reports"
KEY_NUTRIENTS = ["protein_g", "vit_b12_ug", "fe_mg", "ca_mg", "fiber_g"]
DEFAULT_FOODS = ["6255", "20587", "20904"]  # bœuf haché 15 % MG cuit, lentille verte cuite, tofu nature


def count(client, table: str) -> int:
    col = {"sources": "id", "nutrients": "id", "indicators": "id", "foods": "code"}.get(table, "source_id")
    return client.table(table).select(col, count="exact", head=True).execute().count


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--foods", nargs="*", default=DEFAULT_FOODS)
    args = ap.parse_args()
    client = get_client()
    OUT.mkdir(exist_ok=True)
    lines = [f"# Rapport d'import Ciqual 2025 + Agribalyse 3.2 — {date.today().isoformat()}", ""]

    # 1. Rows per table
    lines += ["## Lignes par table", "", "| Table | Lignes |", "|---|---|"]
    for t in ["sources", "foods", "nutrients", "food_nutrients", "indicators", "food_impacts", "food_impact_ingredients"]:
        lines.append(f"| {t} | {count(client, t)} |")

    foods = pd.DataFrame(fetch_all(client, "foods", "code,name_fr,source_id,ciqual_code,is_animal,animal_category")).sort_values("code")
    impacted = {r["food_code"] for r in fetch_all(client, "food_impacts", "food_code", indicator_id="ghg_100y_kgco2e")}
    ciqual = foods[foods.source_id == "ciqual-2025"]

    # 2. Missing values for key nutrients (Ciqual foods)
    lines += ["", f"## Valeurs manquantes (sur {len(ciqual)} aliments Ciqual)", "",
              "| Nutriment | Valeur numérique | « - » (absente) | « traces » | « < x » | % sans valeur numérique |",
              "|---|---|---|---|---|---|"]
    for nid in KEY_NUTRIENTS:
        rows = pd.DataFrame(fetch_all(client, "food_nutrients", "value_per_100g,qualifier", nutrient_id=nid))
        num = rows.value_per_100g.notna().sum()
        dash = (rows.value_per_100g.isna() & rows.qualifier.isna()).sum()
        traces = (rows.qualifier == "traces").sum()
        lt = rows.qualifier.str.startswith("<", na=False).sum()
        lines.append(f"| {nid} | {num} | {dash} | {traces} | {lt} | {100 * (len(rows) - num) / len(rows):.1f} % |")

    # 3. Matching between sources
    agb_only = foods[(foods.source_id == "agribalyse-3.2") & ~foods.code.str.contains("_")]
    variants = foods[foods.code.str.contains("_")]
    variants_unlinked = variants[variants.ciqual_code.isna()]
    ciqual_no_agb = ciqual[~ciqual.code.isin(impacted)]
    bare_with_variants = sorted({c.split("_")[0] for c in variants.code} & set(ciqual.code))
    bare_no_impact = ciqual[ciqual.code.isin(bare_with_variants) & ~ciqual.code.isin(impacted)]
    agb_only.to_csv(OUT / "agribalyse_absent_de_ciqual.csv", index=False, columns=["code", "name_fr"])
    variants_unlinked.to_csv(OUT / "variantes_sans_nutriments.csv", index=False, columns=["code", "name_fr"])
    ciqual_no_agb.to_csv(OUT / "ciqual_sans_agribalyse.csv", index=False, columns=["code", "name_fr"])
    bare_no_impact.to_csv(OUT / "codes_nus_sans_impact.csv", index=False, columns=["code", "name_fr"])
    lines += ["", "## Correspondances", "",
              f"- Aliments Agribalyse absents de Ciqual 2025 (sans nutriments) : **{len(agb_only)}** → `agribalyse_absent_de_ciqual.csv`",
              f"- Variantes Agribalyse sans aliment Ciqual équivalent (nutriments « donnée manquante ») : **{len(variants_unlinked)}** / {len(variants)} → `variantes_sans_nutriments.csv`",
              f"- Aliments Ciqual sans données Agribalyse : **{len(ciqual_no_agb)}** / {len(ciqual)} → `ciqual_sans_agribalyse.csv`",
              f"- Codes Ciqual nus dont Agribalyse ne publie que des variantes, sans variante par défaut : **{len(bare_no_impact)}** → `codes_nus_sans_impact.csv`",
              ""]
    for r in bare_no_impact.itertuples():
        vs = ", ".join(sorted(variants[variants.code.str.startswith(r.code + "_")].code))
        lines.append(f"  - {r.code} {r.name_fr} (variantes : {vs})")

    # 4. Full values for hand comparison
    nutrients = {n["id"]: n for n in fetch_all(client, "nutrients", "id,name_fr,unit")}
    indicators = {i["id"]: i for i in fetch_all(client, "indicators", "id,name_fr,unit")}
    lines += ["", "## Valeurs complètes à comparer aux sites Ciqual et Agribalyse"]
    for code in args.foods:
        f = foods[foods.code == code].iloc[0]
        lines += ["", f"### {code} — {f.name_fr}", "",
                  f"is_animal = {f.is_animal}, animal_category = {f.animal_category or '—'}", "",
                  "| Nutriment (pour 100 g) | Valeur | Unité | Qualificatif |", "|---|---|---|---|"]
        for x in sorted(fetch_all(client, "food_nutrients", "nutrient_id,value_per_100g,qualifier", food_code=code),
                        key=lambda x: x["nutrient_id"]):
            n = nutrients[x["nutrient_id"]]
            v = "donnée manquante" if x["value_per_100g"] is None and not x["qualifier"] else (x["value_per_100g"] if x["value_per_100g"] is not None else "")
            lines.append(f"| {n['name_fr']} | {v} | {n['unit']} | {x['qualifier'] or ''} |")
        imp = fetch_all(client, "food_impacts", "indicator_id,value_per_kg,dqr", food_code=code)
        if not imp:
            lines += ["", "Impacts Agribalyse : donnée manquante"]
            continue
        lines += ["", f"DQR Agribalyse : {imp[0]['dqr']}", "", "| Indicateur (par kg de produit) | Valeur | Unité |", "|---|---|---|"]
        for x in sorted(imp, key=lambda x: x["indicator_id"]):
            i = indicators[x["indicator_id"]]
            lines.append(f"| {i['name_fr']} | {x['value_per_kg']} | {i['unit']} |")

    (OUT / "import_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
