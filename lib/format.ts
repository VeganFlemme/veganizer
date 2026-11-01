// French number formatting shared by pages and components. Pure.

import { roundForUnit } from "@/lib/scoring/ranges";

const sig3 = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 3 });
const sci = new Intl.NumberFormat("fr-FR", { notation: "scientific", maximumSignificantDigits: 3 });
const int = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const fixed2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const floor2sig = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 2, roundingMode: "floor" });
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MISSING = "donnée manquante";
/** No-break space before % and units (French typography). */
export const NBSP = "\u00a0";

const SUPERSCRIPT: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

/** « 7,2 × 10⁻⁸ » instead of « 7,2E-8 » (readable scientific notation, review of 2026-11-01). */
function scientific(x: number): string {
  const [m, e] = sci.format(x).split("E");
  return `${m}${NBSP}×${NBSP}10${[...(e ?? "")].map((c) => SUPERSCRIPT[c] ?? c).join("")}`;
}

/** Three significant digits; scientific notation for very small non-zero values. */
export function formatValue(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return MISSING;
  if (x !== 0 && Math.abs(x) < 0.00001) return scientific(x);
  return sig3.format(x);
}

export function formatInt(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : int.format(x);
}

export function formatEur(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : eur.format(x);
}

export function formatPercent(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : `${int.format(x)}${NBSP}%`;
}

/**
 * Sentence for the gap between the plant and the animal dish, from
 * reduction = (animal − plant) / |animal| × 100.
 */
export function gapSentence(reduction: number | null): string {
  if (reduction == null || !Number.isFinite(reduction)) return "écart non calculable";
  const r = Math.round(reduction);
  if (r === 0) return "à peu près pareil";
  return r > 0 ? `${int.format(r)}${NBSP}% de moins` : `${int.format(-r)}${NBSP}% de plus`;
}

/** Signed gap of the plant dish versus the animal dish, e.g. "−87 %" (less) or "+12 %" (more). */
export function signedGap(reduction: number | null): string {
  if (reduction == null || !Number.isFinite(reduction)) return MISSING;
  const r = Math.round(reduction);
  if (r === 0) return `0${NBSP}%`;
  return `${r > 0 ? "−" : "+"}${int.format(Math.abs(r))}${NBSP}%`;
}

/** Value and unit separated by a no-break space; missing data stays written in full. */
export function withUnit(x: number | null | undefined, unit: string): string {
  const v = formatValue(x);
  return v === MISSING || !unit ? v : `${v}${NBSP}${unit}`;
}

/** Units written with exactly 2 decimals (the same rule as roundForUnit). */
const TWO_DECIMALS = new Set(["kg CO2e"]);
const SMALLEST_2_DECIMALS = 0.005;

/**
 * One rounding rule per unit, everywhere (review of PR #15): kg CO2e with 2 decimals (« 0,65 »,
 * « 1,20 », « 1,00 »), euros with formatEur, every other unit with 3 significant digits. A non-zero
 * value too small for 2 decimals is written « < 0,01 » (never « 0,00 »).
 */
export function formatForUnit(x: number | null | undefined, unit: string): string {
  if (x == null || !Number.isFinite(x)) return MISSING;
  if (unit === "€") return formatEur(x);
  if (!TWO_DECIMALS.has(unit)) return formatValue(x);
  if (x !== 0 && Math.abs(x) < SMALLEST_2_DECIMALS) return x > 0 ? "< 0,01" : "> −0,01";
  return fixed2.format(roundForUnit(x, unit)).replace("-", "−");
}

/** Value and unit, with the rounding rule of the unit. */
export function withUnitRule(x: number | null | undefined, unit: string): string {
  const v = formatForUnit(x, unit);
  return v === MISSING || !unit || unit === "€" ? v : `${v}${NBSP}${unit.replace("CO2e", "CO₂e")}`;
}

/**
 * Animals spared by the simulator: a low estimate (slaughter per kg of carcass), so the number is
 * rounded DOWN to 2 significant digits and never shown above what was computed.
 */
export function animalsSpared(x: number | null | undefined): string {
  const p = animalsSparedParts(x);
  return p ? `au moins ${p.number} ${p.noun}` : MISSING;
}

/** Same as animalsSpared, in two parts (« 0,03 », « animal épargné ») for the simulator. */
export function animalsSparedParts(x: number | null | undefined): { number: string; noun: string } | null {
  if (x == null || !Number.isFinite(x)) return null;
  const number = floor2sig.format(x);
  const n = Number(number.replace(/\s/g, "").replace(",", "."));
  return { number, noun: n >= 2 ? "animaux épargnés" : "animal épargné" };
}

/** Licence shown publicly: the licence when known, nothing for internal follow-up notes (« À vérifier… »). */
export function publicLicense(license: string | null | undefined): string | null {
  const s = (license ?? "").trim();
  if (!s || /^à vérifier/i.test(s)) return null;
  return s;
}

/** Counts of animals: below one per serving, written for 1 000 servings (conversion only). */
const COUNT_UNITS = new Set(["animaux", "poissons"]);
const THOUSAND = 1000;
const thousandFr = new Intl.NumberFormat("fr-FR");

/** A value per serving with the rule of its unit; small animal counts « pour 1 000 portions ». */
export function formatPerServing(x: number | null | undefined, unit: string): string {
  if (x != null && Number.isFinite(x) && COUNT_UNITS.has(unit) && x !== 0 && Math.abs(x) < 1) {
    return `${formatValue(x * THOUSAND)} pour ${thousandFr.format(THOUSAND)} portions`;
  }
  return formatForUnit(x, unit);
}
