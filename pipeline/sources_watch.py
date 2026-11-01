"""Monthly watch of the download pages of the sources (used by .github/workflows/sources-watch.yml).

    python pipeline/sources_watch.py            # print the current fingerprints (JSON)
    python pipeline/sources_watch.py --check    # compare with sources_watch.json; exit 1 and write
                                                # a Markdown report if something changed
    python pipeline/sources_watch.py --update   # store the current fingerprints (after review)

A fingerprint is a stable signal of a new version (version number, update date published by the
source, HTTP status of the page), not a hash of the HTML, which changes for unrelated reasons.
Only the standard library is needed (certifi is used when available).
"""

from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = HERE / "sources_watch.json"
REPORT = HERE / "sources_watch_report.md"
try:  # local macOS Pythons may lack system certificates; GitHub runners have them
    import certifi

    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()
UA = {"User-Agent": "veganizer-sources-watch (+https://github.com/VeganFlemme/veganizer)"}


def get_json(url: str) -> dict:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60, context=CTX) as r:
        return json.load(r)


def status(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers=UA, method="HEAD")
        with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
            return str(r.status)
    except urllib.error.HTTPError as e:
        return str(e.code)
    except Exception as e:  # noqa: BLE001 - any network failure is a signal
        return f"erreur : {type(e).__name__}"


def ciqual() -> dict:
    v = get_json("https://entrepot.recherche.data.gouv.fr/api/datasets/:persistentId/?persistentId=doi:10.57745/RDMHWY")["data"]["latestVersion"]
    return {"version": f"{v['versionNumber']}.{v['versionMinorNumber']}", "release": v.get("releaseTime"),
            "files": sorted(f["dataFile"]["filename"] for f in v["files"])}


def agribalyse() -> dict:
    out = {}
    for slug in ("agribalyse-31-synthese", "agribalyse-31-detail-par-ingredient"):
        m = get_json(f"https://data.ademe.fr/data-fair/api/v1/datasets/{slug}")
        out[slug] = {"dataUpdatedAt": m.get("dataUpdatedAt"), "mentions_v3.2": "v3.2" in (m.get("description") or "")}
    return out


def faostat() -> dict:
    d = get_json("https://bulks-faostat.fao.org/production/datasets_E.json")["Datasets"]["Dataset"]
    q = next((x for x in d if x["DatasetCode"] == "QCL"), {})
    return {"DateUpdate": q.get("DateUpdate"), "FileLocation": q.get("FileLocation")}


CHECKS = {
    "ciqual-2025 (Recherche Data Gouv)": ciqual,
    "calnut / ciqual.anses.fr (statut de la page)": lambda: {"status": status("https://ciqual.anses.fr/")},
    "agribalyse-3.2 (data.ademe.fr)": agribalyse,
    "faostat-qcl (FAOSTAT bulk)": faostat,
    "open-prices (export Parquet)": lambda: {"status": status("https://huggingface.co/datasets/openfoodfacts/open-prices/resolve/main/prices.parquet")},
    "iarc-114 (page de la monographie)": lambda: {"status": status("https://publications.iarc.who.int/564")},
    "pnns (mangerbouger.fr)": lambda: {"status": status("https://www.mangerbouger.fr/")},
    "fishcount": lambda: {"status": status("https://fishcount.org.uk/")},
}


def current() -> dict:
    out = {}
    for name, fn in CHECKS.items():
        try:
            out[name] = fn()
        except Exception as e:  # noqa: BLE001
            out[name] = {"erreur": type(e).__name__}
    return out


def diff(old: dict, new: dict) -> list[str]:
    lines = []
    for name in sorted(set(old) | set(new)):
        if old.get(name) != new.get(name):
            lines.append(f"### {name}\n\n- avant : `{json.dumps(old.get(name), ensure_ascii=False)}`\n"
                         f"- maintenant : `{json.dumps(new.get(name), ensure_ascii=False)}`\n")
    return lines


def main() -> None:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--check", action="store_true")
    g.add_argument("--update", action="store_true")
    args = ap.parse_args()
    now = current()
    if args.update:
        STATE.write_text(json.dumps(now, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"Updated {STATE.name}")
        return
    if not args.check:
        print(json.dumps(now, ensure_ascii=False, indent=2, sort_keys=True))
        return
    old = json.loads(STATE.read_text(encoding="utf-8"))
    changes = diff(old, now)
    if not changes:
        print("No change in the source download pages.")
        return
    REPORT.write_text(
        "Le contrôle mensuel a détecté un changement sur la page de téléchargement d'au moins une source.\n\n"
        + "\n".join(changes)
        + "\nÀ faire : vérifier la nouvelle version (CLAUDE.md, règle 8 : s'arrêter si le format a changé), relancer le script "
          "du pipeline concerné, mettre à jour `/sources`, puis `python pipeline/sources_watch.py --update`.\n",
        encoding="utf-8",
    )
    print("\n".join(changes))
    sys.exit(1)


if __name__ == "__main__":
    main()
