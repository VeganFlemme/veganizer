"""Our recipes compared with the AGRIBALYSE average dishes (suite V1, step 4, point 4 bis).

    python pipeline/crosscheck.py [--base http://localhost:3000]

For each dish of our catalogue that also exists as a composite dish in Ciqual/AGRIBALYSE, our
animal recipe (whole recipe, sides included, as on the site) is brought to 100 g and to 1 kg and
compared with the official values: kg CO2e/kg (AGRIBALYSE 3.2 synthesis), energy, protein, fat and
salt per 100 g (Ciqual 2025). A gap above 25 % flags a recipe to review.
Writes data/recipes_crosscheck.json (shown on /methodologie) and prints a Markdown table.
"""

from __future__ import annotations

import argparse
import json
import unicodedata
import urllib.request
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE.parent / "data" / "recipes_crosscheck.json"
THRESHOLD = 25  # %, flag (decision of Matt, step 4 bis)

# Our dish -> AGRIBALYSE / Ciqual composite dish (reviewed by hand: same dish, sides aside).
PAIRS = {
    "boeuf-bourguignon": "25033", "lasagnes-bolognaise": "25081", "hachis-parmentier": "25009", "blanquette-de-veau": "25001",
    "quiche-lorraine": "25405", "paella": "25031", "couscous-poulet-merguez": "25127", "chili-con-carne": "25111",
    "tartiflette": "25137", "pot-au-feu": "25013", "croque-monsieur": "25400", "pizza-jambon-fromage": "25435",
    "galette-complete": "25562", "pates-carbonara": "25135", "endives-au-jambon": "25073", "sandwich-jambon-beurre": "25517",
    "poulet-curry-coco": "25174", "gratin-dauphinois": "25056", "tomates-farcies": "25103", "boulettes-tomate-spaghetti": "25211",
    "flammekueche": "25550", "salade-cesar": "25628", "saucisse-lentilles": "25010",
}
# Plant version -> AGRIBALYSE vegetarian dish, when one exists. Agribalyse 3.2 has no vegetarian
# version of our dishes with a protein substitute: these two keep vegetables in place of the meat,
# so the gap mostly says how much protein our substitute adds (indicative, reviewed by hand).
VEG_PAIRS = {"lasagnes-bolognaise": "25131", "pizza-jambon-fromage": "25472"}
CIQUAL_COLUMNS = {
    "energy_eu_kcal": "energie, reglement ue n° 1169 2011 (kcal 100 g)",
    "protein_g": "proteines, n x facteur de jones (g 100 g)",
    "fat_g": "lipides (g 100 g)",
    "salt_g": "sel chlorure de sodium (g 100 g)",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return " ".join(s.replace("\n", " ").split())


def number(x) -> float | None:
    try:
        return float(str(x).strip().replace(",", "."))
    except ValueError:
        return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    args = ap.parse_args()
    cq = pd.read_excel(RAW / "ciqual_2025_FR_2025_11_03.xlsx", dtype=str)
    cols = {norm(c): c for c in cq.columns}
    col_of = {k: next(cols[c] for c in cols if c.startswith(norm(v))) for k, v in CIQUAL_COLUMNS.items()}
    cq["code"] = cq["alim_code"].map(lambda x: str(x).strip())
    synth = pd.read_csv(RAW / "agribalyse_3.2_synthese.csv", dtype=str)
    synth["code"] = synth["Code AGB"].map(lambda x: str(x).strip())

    rows = []
    for side, pairs in (("animal", PAIRS), ("vegetal", VEG_PAIRS)):
      for slug, code in pairs.items():
        with urllib.request.urlopen(f"{args.base}/compare/{slug}/donnees") as resp:
            data = json.load(resp)
        variant = next(iter(data["variants"].values()))  # default protein
        a = data["animal"] if side == "animal" else variant["dish"]
        grams = a["gramsPerServing"]
        # Point value, or the range [low ; high] when an ingredient has « < x » (rule: never x/2).
        ours = {r["id"]: (r.get(f"{side}Low", r[side]), r.get(f"{side}High", r[side])) for r in variant["perServing"]}
        name = synth[synth.code == code]["Nom du Produit en Français"].iloc[0]
        line = {"slug": slug, "side": side, "dish": data["animal"]["name"], "officialCode": code, "officialName": name, "recipe": data["recette"]["kind"], "values": {}}
        official = {k: number(cq[cq.code == code][col].iloc[0]) if (cq.code == code).any() else None for k, col in col_of.items()}
        official["ghg_kg"] = number(synth[synth.code == code]["Changement climatique"].iloc[0])
        def scaled(k: str, factor: float):
            lo, hi = ours.get(k, (None, None))
            return None if lo is None or hi is None or not grams else (lo / grams * factor, hi / grams * factor)

        mine = {k: scaled(k, 100) for k in CIQUAL_COLUMNS}
        mine["ghg_kg"] = scaled("ghg_100y_kgco2e", 1000)
        flagged = False
        for k in ["ghg_kg", *CIQUAL_COLUMNS]:
            o, m = official.get(k), mine.get(k)
            gap = None
            if o not in (None, 0) and m is not None:
                lo, hi = m
                # 0 when the official value lies in our range, else the gap to the nearest bound.
                gap = 0 if lo <= o <= hi else round(((lo if o < lo else hi) - o) / o * 100)
            if gap is not None and abs(gap) > THRESHOLD:
                flagged = True
            line["values"][k] = {"oursLow": None if m is None else round(m[0], 3), "oursHigh": None if m is None else round(m[1], 3), "official": o, "gapPercent": gap}
        line["flagged"] = flagged
        rows.append(line)

    OUT.write_text(json.dumps({
        "date": "2026-11-01",
        "note": "Notre recette (accompagnements compris, comme sur le site), ramenée à 100 g et à 1 kg, comparée au plat moyen : kg CO₂e/kg (AGRIBALYSE 3.2) ; énergie, protéines, lipides, sel pour 100 g (Ciqual 2025). Écart > 25 % : recette à revoir. Fourchette : un ingrédient « < x » donne [0 ; x] ; écart nul si la valeur officielle est dans la fourchette.",
        "threshold": THRESHOLD,
        "rows": rows,
    }, ensure_ascii=False, indent=2) + "\n")
    labels = {"ghg_kg": "kg CO₂e/kg", "energy_eu_kcal": "kcal/100 g", "protein_g": "protéines g/100 g", "fat_g": "lipides g/100 g", "salt_g": "sel g/100 g"}
    print("| Plat | Plat Agribalyse | " + " | ".join(labels.values()) + " | À revoir |")
    print("|---|---|" + "---|" * len(labels) + "---|")
    for r in rows:
        cells = []
        for k in labels:
            v = r["values"][k]
            if v["oursLow"] is None or v["official"] is None:
                cells.append("donnée manquante")
                continue
            ours = f"{v['oursLow']:.2f}" if abs(v["oursHigh"] - v["oursLow"]) < 0.005 else f"{v['oursLow']:.2f}–{v['oursHigh']:.2f}"
            cells.append(f"{ours} / {v['official']:.2f} ({v['gapPercent']:+d} %)")
        print(f"| {r['dish']}{' (version végétale)' if r['side'] == 'vegetal' else ''} | {r['officialName']} ({r['officialCode']}) | " + " | ".join(cells) + f" | {'oui' if r['flagged'] else 'non'} |")
    print(f"flagged: {sum(r['flagged'] for r in rows)} / {len(rows)}")


if __name__ == "__main__":
    main()
