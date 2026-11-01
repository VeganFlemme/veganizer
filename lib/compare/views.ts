// Versions of a comparison (decision of Matt, 2026-11-01, 17 h 12): « Version de base » (the dish as
// eaten, default, scores of reference) and « Version complétée ». Pure texts.

import { formatInt, NBSP, signedGap } from "@/lib/format";

export type VersionId = "base" | "complete";
export const VERSIONS: { id: VersionId; label: string }[] = [
  { id: "base", label: "Version de base" },
  { id: "complete", label: "Version complétée" },
];

export function isVersionId(x: string | null | undefined): x is VersionId {
  return VERSIONS.some((v) => v.id === x);
}

/** « CO₂e : −87 % par portion, −82 % une fois complétée » (reduction = (animal − plant) / animal × 100). */
export function co2Summary(base: number | null, completed: number | null): string | null {
  if (base == null) return null;
  const parts = [`${signedGap(base)} par portion`];
  if (completed != null) parts.push(`${signedGap(completed)} une fois complétée`);
  return `CO₂e${NBSP}: ${parts.join(", ")}`;
}

const pctFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const gramsFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « Même complétée, la version végétale émet 82 % de CO₂e en moins. » */
export function completedSentence(reduction: number | null): string | null {
  if (reduction == null || !Number.isFinite(reduction)) return null;
  const r = Math.round(reduction);
  return r >= 0
    ? `Même complétée, la version végétale émet ${pctFr.format(r)}${NBSP}% de CO₂e en moins.`
    : `Complétée, la version végétale émet ${pctFr.format(-r)}${NBSP}% de CO₂e en plus.`;
}

/** Reason of an addition, by nutrient (« ajouté pour le calcium »). */
export const NUTRIENT_REASON: Record<string, string> = {
  protein_g: "les protéines",
  fiber_g: "les fibres",
  fe_mg: "le fer",
  ca_mg: "le calcium",
  zn_mg: "le zinc",
  vit_b12_ug: "la vitamine B12",
  i_ug: "l’iode",
  vit_d_ug: "la vitamine D",
  vit_b2_mg: "la vitamine B2",
  fa_c18_3_n3_ala_g: "les oméga-3 ALA",
  fa_epa_dha_g: "les oméga-3 EPA + DHA",
};

const NUTRIENT_NAME: Record<string, string> = {
  vit_b12_ug: "vitamine B12",
  fa_epa_dha_g: "oméga-3 EPA + DHA",
  vit_d_ug: "vitamine D",
  i_ug: "iode",
  zn_mg: "zinc",
  ca_mg: "calcium",
  fe_mg: "fer",
  vit_b2_mg: "vitamine B2",
  fa_c18_3_n3_ala_g: "oméga-3 ALA",
  protein_g: "protéines",
  fiber_g: "fibres",
};

const and = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/** « 2,3 g de graines de sésame par portion : ajouté pour le calcium et le zinc ». */
export function additionLine(a: { label: string; gramsPerServing: number; nutrients: string[] }): string {
  const why = and(a.nutrients.map((n) => NUTRIENT_REASON[n] ?? n));
  return `${gramsFr.format(a.gramsPerServing)}${NBSP}g de ${a.label} par portion${why ? ` : ajouté pour ${why}` : ""}`;
}

/** « +212 g pour la recette (+53 g par portion) : quantité augmentée pour autant de protéines ». */
export function boostLine(extraGrams: number, servings: number): string {
  return `+${formatInt(extraGrams)}${NBSP}g pour la recette (+${formatInt(extraGrams / servings)}${NBSP}g par portion) : quantité augmentée pour autant de protéines`;
}

/** « À couvrir hors de ce plat : … » — no dose, a health professional (rule 6). */
export function outsideLine(open: string[]): string | null {
  if (open.length === 0) return null;
  return `À couvrir hors de ce plat : ${open.map((n) => NUTRIENT_NAME[n] ?? n).join(", ")} (complément ou aliment enrichi, sans dose ici : demande conseil à un professionnel de santé).`;
}

/** Text copied by « Copier la liste des ingrédients ». */
export function ingredientsText(name: string, servings: number, items: { label: string; grams: number }[]): string {
  return [`${name} (${servings} portions)`, ...items.map((i) => `- ${formatInt(i.grams)} g ${i.label}`)].join("\n");
}
