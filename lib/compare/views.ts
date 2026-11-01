// Views of a comparison (suite V1): realistic portion (default) and equal protein. Pure texts.

import { formatInt, formatValue, NBSP, signedGap } from "@/lib/format";

export type ViewId = "portion" | "proteines";
export const VIEWS: { id: ViewId; label: string }[] = [
  { id: "portion", label: "Portion réaliste" },
  { id: "proteines", label: "À protéines égales" },
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
