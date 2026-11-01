// Views of a comparison (suite V1): realistic portion (default), equal protein, with complements. Pure texts.

import { formatInt, formatValue, NBSP, signedGap } from "@/lib/format";

export type ViewId = "portion" | "proteines" | "complements";
export const VIEWS: { id: ViewId; label: string }[] = [
  { id: "portion", label: "Portion réaliste" },
  { id: "proteines", label: "À protéines égales" },
  { id: "complements", label: "Avec compléments" },
];

export function isViewId(x: string | null | undefined): x is ViewId {
  return VIEWS.some((v) => v.id === x);
}

/** « CO₂e : −87 % par portion, −82 % à protéines égales » (reduction = (animal − plant) / animal × 100). */
export function co2Summary(realistic: number | null, equalProtein: number | null): string | null {
  if (realistic == null) return null;
  const parts = [`${signedGap(realistic)} par portion`];
  if (equalProtein != null) parts.push(`${signedGap(equalProtein)} à protéines égales`);
  return `CO₂e${NBSP}: ${parts.join(", ")}`;
}

const factorFr = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Factor and weight of the scaled plant version. */
export function scaleSentence(s: { factor: number; gramsPerServing: number; baseGramsPerServing: number }, animalProtein: number | null): string {
  const protein = animalProtein == null ? "" : ` (${formatValue(animalProtein)}${NBSP}g)`;
  return `Version végétale × ${factorFr.format(s.factor)} : ${formatInt(s.gramsPerServing)}${NBSP}g par portion au lieu de ${formatInt(s.baseGramsPerServing)}${NBSP}g, pour autant de protéines que le plat animal${protein}.`;
}

const gramsFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const pctFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** « Même complétée, la version végétale émet 82 % de CO₂e en moins. » (reduction as in reductionPercent). */
export function completedSentence(reduction: number | null): string | null {
  if (reduction == null || !Number.isFinite(reduction)) return null;
  const r = Math.round(reduction);
  return r >= 0
    ? `Même complétée, la version végétale émet ${pctFr.format(r)}${NBSP}% de CO₂e en moins.`
    : `Complétée, la version végétale émet ${pctFr.format(-r)}${NBSP}% de CO₂e en plus.`;
}

/** « 2,3 g de graines de sésame par portion (calcium) ». */
export function additionLine(a: { label: string; gramsPerServing: number; nutrients: string[] }, labels: Record<string, string>): string {
  const names = a.nutrients.map((n) => (labels[n] ?? n).toLowerCase()).join(", ");
  return `${gramsFr.format(a.gramsPerServing)}${NBSP}g de ${a.label} par portion${names ? ` (${names})` : ""}`;
}
