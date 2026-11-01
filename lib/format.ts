// French number formatting shared by pages and components. Pure.

const sig3 = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 3 });
const sci = new Intl.NumberFormat("fr-FR", { notation: "scientific", maximumSignificantDigits: 3 });
const int = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MISSING = "donnée manquante";
/** No-break space before % and units (French typography). */
export const NBSP = "\u00a0";

/** Three significant digits; scientific notation for very small non-zero values. */
export function formatValue(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return MISSING;
  if (x !== 0 && Math.abs(x) < 0.00001) return sci.format(x);
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
