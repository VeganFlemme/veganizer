"""Shared helpers for the Veganizer import pipeline.

Secrets are read from .env.local / .env with python-dotenv and are never printed.
"""

from __future__ import annotations

import math
import os
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "pipeline" / "raw"

BATCH_SIZE = 2000


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------
def get_client():
    from dotenv import load_dotenv
    from supabase import create_client

    for name in (".env.local", ".env"):
        load_dotenv(ROOT / name, override=False)
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local (values not shown).")
    return create_client(url, key)


def upsert(client, table: str, rows: list[dict[str, Any]], on_conflict: str, label: str | None = None) -> int:
    """Idempotent batched upsert. Only the columns present in `rows` are updated."""
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        client.table(table).upsert(batch, on_conflict=on_conflict).execute()
        total += len(batch)
        print(f"  {label or table}: {total}/{len(rows)}", end="\r", flush=True)
    print(f"  {label or table}: {total}/{len(rows)} upserted")
    return total


def order_columns(columns: str) -> list[str]:
    """Columns used to sort pages: every selected column, so pagination is stable.

    Without an explicit order, PostgREST pages are not guaranteed to be consistent: rows were
    duplicated or skipped between pages (3 255 distinct rows out of 3 484 for food_nutrients).
    """
    return [c.strip() for c in columns.split(",") if c.strip() and c.strip() != "*"]


def fetch_all(client, table: str, columns: str, page: int = 1000, **eq: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    start = 0
    while True:
        q = client.table(table).select(columns)
        for k, v in eq.items():
            q = q.eq(k, v)
        for col in order_columns(columns):
            q = q.order(col)
        res = q.range(start, start + page - 1).execute()
        out.extend(res.data)
        if len(res.data) < page:
            return out
        start += page


def require_source(client, source_id: str, expected_version_fragment: str) -> None:
    """Stop if the source row is missing; update its version if it differs."""
    res = client.table("sources").select("id,version").eq("id", source_id).execute()
    if not res.data:
        sys.exit(f"Source '{source_id}' missing from public.sources: run the seed first.")
    version = res.data[0]["version"] or ""
    if expected_version_fragment not in version:
        print(f"  sources.{source_id}: version '{version}' -> '{expected_version_fragment}'")
        client.table("sources").update({"version": expected_version_fragment}).eq("id", source_id).execute()


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------
_NUMBER = re.compile(r"^-?\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?$")
_LESS_THAN = re.compile(r"^<\s*(\d+(?:[.,]\d+)?)$")


class UnknownValueFormat(ValueError):
    pass


def parse_ciqual_value(raw: Any) -> tuple[float | None, str | None]:
    """Return (value, qualifier) for a Ciqual cell.

    '-' or empty -> (None, None)       missing, never 0
    'traces'     -> (None, 'traces')
    '< 0,2'      -> (None, '< 0.2')
    '12,5'       -> (12.5, None)
    '0'          -> (0.0, None)        a real zero reported by Ciqual
    Anything else raises UnknownValueFormat (stop and ask, do not guess).
    """
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return None, None
    s = str(raw).strip()
    if s in ("", "-"):
        return None, None
    if s.lower() == "traces":
        return None, "traces"
    m = _LESS_THAN.match(s)
    if m:
        return None, "< " + m.group(1).replace(",", ".")
    if _NUMBER.match(s):
        return float(s.replace(",", ".")), None
    raise UnknownValueFormat(repr(s))


def parse_number(raw: Any) -> float | None:
    """Strict numeric parser for Agribalyse cells (decimal comma tolerated)."""
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return None
    s = str(raw).strip()
    if s == "":
        return None
    if not _NUMBER.match(s):
        raise UnknownValueFormat(repr(s))
    return float(s.replace(",", "."))


def clean_text(raw: Any) -> str | None:
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return None
    s = " ".join(str(raw).split())
    return s or None


# ---------------------------------------------------------------------------
# State inferred from the food name (conservative: null when unsure)
# ---------------------------------------------------------------------------
_RAW = re.compile(r"\b(cru|crue|crus|crues)\b", re.IGNORECASE)
_RAW_EXCLUDE = re.compile(r"\bau lait cru\b|\blait cru\b", re.IGNORECASE)
_COOKED = re.compile(
    r"\b(cuit|cuite|cuits|cuites|bouilli|bouillie|bouillis|bouillies|rôti|rôtie|rôtis|rôties|"
    r"grillé|grillée|grillés|grillées|poêlé|poêlée|poêlés|poêlées|frit|frite|frits|frites|"
    r"braisé|braisée|braisés|braisées|sauté|sautée|sautés|sautées|mijoté|mijotée|mijotés|mijotées|"
    r"à la vapeur|au four|au micro-ondes|cuit à l'eau)\b",
    re.IGNORECASE,
)


def infer_state(name: str | None) -> str | None:
    if not name:
        return None
    raw = bool(_RAW.search(name)) and not _RAW_EXCLUDE.search(name)
    cooked = bool(_COOKED.search(name))
    if raw and not cooked:
        return "cru"
    if cooked and not raw:
        return "cuit"
    return None
