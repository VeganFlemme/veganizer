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

/** « CO₂e : −87 % par portion, −82 % une fois ajustée » (reduction = (animal − plant) / animal × 100). */
export function co2Summary(base: number | null, completed: number | null, per = "par portion"): string | null {
  if (base == null) return null;
  const parts = [`${signedGap(base)} ${per}`];
  if (completed != null) parts.push(`${signedGap(completed)} une fois ajustée`);
  return `Gaz à effet de serre (CO₂e)${NBSP}: ${parts.join(", ")}`;
}

const pctFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const gramsFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « Même ajustée, la version végétale émet 82 % de CO₂e en moins. » */
export function completedSentence(reduction: number | null): string | null {
  if (reduction == null || !Number.isFinite(reduction)) return null;
  const r = Math.round(reduction);
  return r >= 0
    ? `Même ajustée, la version végétale émet ${pctFr.format(r)}${NBSP}% de CO₂e en moins.`
    : `Ajustée, la version végétale émet ${pctFr.format(-r)}${NBSP}% de CO₂e en plus.`;
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
  salt_g: "sel",
  fa_sat_g: "acides gras saturés",
  sugars_g: "sucres",
};

const and = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/** « 2,3 g de graines de sésame par portion : ajouté pour le calcium et le zinc ». */
export function additionLine(a: { label: string; gramsPerServing: number; nutrients: string[] }): string {
  const why = and(a.nutrients.map((n) => NUTRIENT_REASON[n] ?? n));
  return `${gramsFr.format(a.gramsPerServing)}${NBSP}g de ${a.label} par portion${why ? ` : ajouté pour ${why}` : ""}`;
}

/** « +212 g pour la recette (+53 g par portion) : quantité augmentée pour autant de protéines ». */
export function boostLine(extraGrams: number, servings: number, capped = false): string {
  return `+${formatInt(extraGrams)}${NBSP}g pour la recette (+${formatInt(extraGrams / servings)}${NBSP}g par portion) : ${boostReason(capped)}`;
}

/** 5 ter: above twice its starting mass the serving is no longer plausible; the rest comes from the list. */
export function boostReason(capped: boolean): string {
  return capped ? "quantité doublée, au plus (portion plausible) ; le reste des protéines vient de la liste ci-dessous" : "quantité augmentée pour autant de protéines";
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

/** « Portion végétale ×1,4 pour autant de calories que le plat animal » (step 3 quinquies). */
export function scaleLine(scale: number): string {
  return `Portion végétale ×${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(scale)} pour autant de calories que le plat animal`;
}

/** Gaps no whitelisted food closes: no dose, a health professional (rule 6). */
export function openLine(open: string[]): string {
  return `Ne se comble pas avec des aliments : ${open.map((n) => NUTRIENT_NAME[n] ?? n).join(", ")} (complément ou aliment enrichi, sans dose ici : demande conseil à un professionnel de santé).`;
}

/** « Version ajustée : +76 g de protéines de soja texturées par portion, zinc comblé » (tabs other than Nutrition). */
export function adjustSummary(c: { boost: { label: string; extraGrams: number } | null; additions: unknown[]; scale?: number | null; filled?: string[] }, servings: number): string {
  const parts: string[] = [];
  if (c.scale != null) parts.push(`portion ×${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(c.scale)} (calories égalisées)`);
  if (c.boost) parts.push(`${c.boost.extraGrams >= 0 ? "+" : "−"}${formatInt(Math.abs(c.boost.extraGrams) / servings)}${NBSP}g de ${c.boost.label} par portion`);
  const filled = (c.filled ?? []).filter((x) => x !== "protein_g").map((n) => NUTRIENT_NAME[n] ?? n);
  if (filled.length) parts.push(`${filled.join(", ")} comblé${filled.length > 1 ? "s" : ""}`);
  else if (c.additions.length) parts.push(`${c.additions.length} ajout${c.additions.length > 1 ? "s" : ""}`);
  return `Version ajustée : ${parts.join(", ") || "recette de base"}`;
}

/**
 * Step 3 quinquies, point 4 bis (decision of Matt, 19 h 50): the « carte d'équivalence » shown
 * under the title as soon as an adjustment is active. Facts only, an example, never advice (rule 6).
 */
export interface Equivalence {
  /** Food pages: « 100 g de dorade ≈ 120 g de tofu ferme + 10 g de noix ». Dishes: null (list). */
  headline: string | null;
  items: { label: string; grams: number; gramsPerServing: number }[];
  /** « Équivalent en tout point… » or « Équivalent sur : mêmes protéines ; zinc comblé ». */
  on: string;
  /** Counted nutrition indicators still won by the animal dish (closable or not). */
  notYet: string[];
  /** Gaps no food of the list closes: « Sauf vitamine B12 : complément ou aliment enrichi… ». */
  outside: string | null;
  everyPoint: boolean;
  /** Text copied by « Copier la recette ». */
  text: string;
}

export function equivalence(args: {
  animal: { name: string; servings: number; gramsPerServing: number };
  plant: { label: string; grams: number }[];
  servings: number;
  filled: string[];
  scale: number | null;
  /** Nutrition indicators of the adjusted version, as scored. */
  indicators: { id: string; outcome: string }[];
  open: string[];
  /** Display names of the indicators (from the rows). */
  names: Record<string, string>;
}): Equivalence {
  const name = (id: string) => NUTRIENT_NAME[id] ?? (args.names[id] ?? id).toLowerCase();
  const items = args.plant.filter((i) => i.grams > 0).map((i) => ({ label: i.label, grams: i.grams, gramsPerServing: i.grams / args.servings }));
  const same: string[] = [];
  if (args.filled.includes("protein_g")) same.push("mêmes protéines");
  if (args.scale != null) same.push("mêmes calories");
  const closed = args.filled.filter((x) => x !== "protein_g").map(name);
  if (closed.length) same.push(`${and(closed)} comblé${closed.length > 1 ? "s" : ""}`);
  const open = [...new Set(args.open)];
  const notYet = args.indicators.filter((i) => i.outcome === "animal" && !open.includes(i.id)).map((i) => name(i.id));
  const everyPoint = notYet.length === 0 && open.length === 0 && !args.indicators.some((i) => i.outcome === "animal");
  const on = everyPoint ? "Équivalent en tout point sur les indicateurs nutritionnels comptés" : `Équivalent sur : ${same.join(" ; ") || "quantités choisies à la main"}`;
  const outside = open.length ? `Sauf ${and(open.map(name))} : complément ou aliment enrichi, à voir avec un professionnel de santé.` : null;
  const g = (x: number) => `${gramsFr.format(x)}${NBSP}g`;
  const food = args.animal.servings === 1;
  const headline = food ? `${g(args.animal.gramsPerServing)} de ${args.animal.name.toLowerCase()} ≈ ${items.map((i) => `${g(i.grams)} de ${i.label}`).join(" + ")}` : null;
  const text = food
    ? headline!
    : [`Version végétale de : ${args.animal.name} (${args.servings} portions)`, ...items.map((i) => `- ${formatInt(i.grams)} g ${i.label} (${gramsFr.format(i.gramsPerServing)} g par portion)`)].join("\n");
  return { headline, items, on, notYet, outside, everyPoint, text: `${text}\n${on}.${outside ? `\n${outside}` : ""}`.replace(/ /g, " ") };
}
