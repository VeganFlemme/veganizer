// Editorial choices of the comparison page: which criteria are shown and in which
// direction they are judged. No data value here (numbers come from Supabase).

import scoreRules from "@/data/score_rules.json";
import type { Basis } from "@/lib/scoring";

export const CIQUAL_SOURCE = "ciqual-2025";
export const CLIMATE_MAIN = "ghg_100y_kgco2e";

/**
 * Nutrients shown first in the Nutrition tab, in display order (docs/DESIGN.md § 4); every other
 * Ciqual constituent follows, in the order of the nutrients table. label: short display name
 * (the Ciqual name is kept in the tooltip). The direction comes from data/score_rules.json:
 * a nutrient that is not counted there is shown without a winner ("none", e.g. energy).
 */
const FEATURED: { id: string; label: string }[] = [
  { id: "energy_eu_kcal", label: "Énergie" },
  { id: "protein_g", label: "Protéines" },
  { id: "fat_g", label: "Lipides" },
  { id: "fa_sat_g", label: "dont acides gras saturés" },
  { id: "carbohydrate_g", label: "Glucides" },
  { id: "sugars_g", label: "dont sucres" },
  { id: "fiber_g", label: "Fibres" },
  { id: "salt_g", label: "Sel" },
  { id: "fe_mg", label: "Fer" },
  { id: "ca_mg", label: "Calcium" },
  { id: "zn_mg", label: "Zinc" },
  { id: "vit_b12_ug", label: "Vitamine B12" },
  { id: "i_ug", label: "Iode" },
  { id: "vit_d_ug", label: "Vitamine D" },
  { id: "vit_b2_mg", label: "Vitamine B2" },
  { id: "fa_c18_3_n3_ala_g", label: "Oméga-3 ALA" },
  { id: "fa_epa_dha_g", label: "Oméga-3 EPA + DHA" },
];

/**
 * Nutrients derived from Ciqual constituents, summed ingredient by ingredient (an ingredient counts
 * only when every part is known). EPA + DHA: one indicator of the score, as the ANSES references
 * treat ALA apart from EPA and DHA (decision of Matt, 2026-11-01). Unit conversion only: none.
 */
export const NUTRIENT_SUMS: Record<string, { label: string; unit: string; parts: string[] }> = {
  fa_epa_dha_g: { label: "Oméga-3 EPA + DHA (somme des valeurs Ciqual)", unit: "g", parts: ["fa_c20_5_n3_epa_g", "fa_c22_6_n3_dha_g"] },
};

const counted = new Map(
  scoreRules.categories.flatMap((c) => c.indicators.map((i) => [i.id, i.direction === "higher_is_better" ? "up" : "down"] as const)),
);

/** Direction used for a verdict: from data/score_rules.json; "none" = shown, not judged. */
export function directionOf(id: string): "up" | "down" | "none" {
  return counted.get(id) ?? "none";
}

export const NUTRIENTS: { id: string; direction: "up" | "down" | "none"; label?: string }[] = FEATURED.map((n) => ({
  ...n,
  direction: directionOf(n.id),
}));

/** Criteria whose coverage drives the page-level warning (energy, protein, climate). */
export const KEY_CRITERIA = ["energy_eu_kcal", "protein_g", "ghg_100y_kgco2e"];

/**
 * Agribalyse indicators shown in the Environment tab, in display order: the 16 indicators counted
 * by the score (data/score_rules.json), then the single EF score and the parts of climate change
 * (shown, not counted).
 */
export const CLIMATE_INDICATORS: string[] = [
  ...(scoreRules.categories.find((c) => c.id === "environnement")?.indicators.map((i) => i.id) ?? []),
  "ef_single_score",
  "ghg_fossil_kgco2e",
  "ghg_biogenic_kgco2e",
  "ghg_luc_kgco2e",
];

export const BASES: { id: Basis; label: string }[] = [
  { id: "perServing", label: "par portion" },
  { id: "per100g", label: "pour 100 g" },
];

/** Methodology threshold (not a data value): below this mass coverage, a warning is shown. */
export const COVERAGE_WARNING = 0.95;

export const MEDICAL_DISCLAIMER =
  "Informations générales, pas un conseil médical. Parlez-en à un professionnel de santé (médecin, diététicien·ne) avant de changer votre alimentation ou de prendre un complément.";

/** Rule 10: the site never displays "vegan" / "végétalien" about a food, even quoted from a source name. */
export const VEGAN_WORD = /v[eé]gan|v[eé]g[eé]talien/i;

/**
 * Single reference year of the official carbon value (France Stratégie, VAC report of March 2025),
 * used everywhere on the site (cards and simulator) and always displayed. Editorial choice:
 * docs/A_VERIFIER.md (alternative: the value of each year).
 */
export const CLIMATE_REFERENCE_YEAR = 2025;
export const CLIMATE_COST_YEARS = [CLIMATE_REFERENCE_YEAR];

/**
 * Which foods count for the PNNS adult guidelines (Santé publique France, p. 32-35 and 49).
 * Editorial mapping, to review (docs/A_VERIFIER.md):
 * - viande: meat of these categories, not processed (charcuterie counted apart);
 * - charcuterie: foods classified "transformée" (Ciqual subgroup "charcuteries…");
 * - poisson: fish categories (shellfish not counted);
 * - légumes secs: Ciqual subgroup "légumineuses", except names saying fresh ("frais", "fraîche").
 */
export const PNNS_MEAT_CATEGORIES = ["bovin", "veau", "porc", "agneau", "cheval"];
export const PNNS_FISH_CATEGORIES = ["saumon d'élevage", "truite d'élevage", "poisson d'élevage (autre)", "poisson sauvage", "poisson origine inconnue"];
export const PNNS_LEGUME_SUBGROUP = "légumineuses";
export const FRESH_WORD = /\bfra(i|î)s\b|\bfra(i|î)che\b/i;

/**
 * EAT-Lancet 2025 (Summary Report, p. 11, figure 01, grams per day). Editorial mapping to review:
 * red meat = beef, veal, pork, lamb (processed meat of these species included); poultry = poultry
 * meat (eggs excluded); fish = fish, crustaceans, molluscs; eggs = Ciqual subgroup "oeufs".
 * Dairy and legumes not compared (unit of the target not stated: milk equivalent? dry weight?).
 */
export const EAT_RED_MEAT_CATEGORIES = ["bovin", "veau", "porc", "agneau"];
export const EAT_POULTRY_CATEGORIES = ["poulet de chair", "dinde", "canard", "oie", "volaille (espèce non précisée)"];
export const EAT_SEAFOOD_CATEGORIES = [
  ...PNNS_FISH_CATEGORIES,
  "crevette d'élevage",
  "crevette sauvage",
  "crustacés (hors crevettes)",
  "mollusques",
  "céphalopodes",
];
export const EGG_SUBGROUP = "oeufs";

/** Categories of the score, in the order of the tabs (data/score_rules.json). */
export type ScoreCategoryId = "nutrition" | "sante" | "environnement" | "animaux" | "economie";
const CATEGORY_ORDER = scoreRules.categories.map((c) => c.id as ScoreCategoryId);
const CATEGORY_LABEL = new Map(scoreRules.categories.map((c) => [c.id, c.label]));
const CATEGORY_OF = new Map(scoreRules.categories.flatMap((c) => c.indicators.map((i) => [i.id, c.id as ScoreCategoryId] as const)));

/** Category of a counted indicator; null for one shown without a verdict (e.g. energy). */
export function categoryOf(id: string): ScoreCategoryId | null {
  return CATEGORY_OF.get(id) ?? null;
}

/** « Ce qui reste à couvrir en nutrition »: neutral title (decision of Matt, 18 h 27), same on every page. */
export function animalBetterTitle(category: ScoreCategoryId): string {
  return `Ce qui reste à couvrir en ${(CATEGORY_LABEL.get(category) ?? category).toLowerCase()}`;
}

/** Advantages grouped by category, in the order of the tabs; empty categories are dropped. */
export function advantagesByCategory<T extends { category: ScoreCategoryId | null }>(items: T[]): { category: ScoreCategoryId; items: T[] }[] {
  return CATEGORY_ORDER.map((category) => ({ category, items: items.filter((x) => x.category === category) })).filter((g) => g.items.length > 0);
}
