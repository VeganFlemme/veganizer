// French number formatting shared by pages and components. Pure.

const sig3 = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 3 });
const sci = new Intl.NumberFormat("fr-FR", { notation: "scientific", maximumSignificantDigits: 3 });
const int = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MISSING = "donnée manquante";

/** Three significant digits; scientific notation for very small non-zero values. */
export function formatValue(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return MISSING;
  if (x !== 0 && Math.abs(x) < 0.001) return sci.format(x);
  return sig3.format(x);
}

export function formatInt(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : int.format(x);
}

export function formatEur(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : eur.format(x);
}

export function formatPercent(x: number | null | undefined): string {
  return x == null || !Number.isFinite(x) ? MISSING : `${int.format(x)} %`;
}

/**
 * Sentence for the gap between the plant and the animal dish, from
 * reduction = (animal − plant) / |animal| × 100.
 */
export function gapSentence(reduction: number | null): string {
  if (reduction == null || !Number.isFinite(reduction)) return "écart non calculable";
  const r = Math.round(reduction);
  if (r === 0) return "à peu près pareil";
  return r > 0 ? `${int.format(r)} % de moins` : `${int.format(-r)} % de plus`;
}
