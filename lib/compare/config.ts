// Editorial choices of the comparison page: which criteria are shown and in which
// direction they are judged. No data value here (numbers come from Supabase).

import type { Basis } from "@/lib/scoring";

export const CIQUAL_SOURCE = "ciqual-2025";
export const CLIMATE_MAIN = "ghg_100y_kgco2e";

/**
 * Nutrients shown in the Nutrition card, in display order.
 * direction: "up" = more is better for this meal, "down" = less is better
 * (general guidance of ANSES / PNNS: fibre up, saturated fat and salt down),
 * "none" = shown without a winner (energy: depends on the person's needs).
 * label: short display name (the Ciqual name is kept in the tooltip).
 */
export const NUTRIENTS: { id: string; direction: "up" | "down" | "none"; label?: string }[] = [
  { id: "energy_eu_kcal", direction: "none", label: "Énergie" },
  { id: "protein_g", direction: "up", label: "Protéines" },
  { id: "fiber_g", direction: "up", label: "Fibres" },
  { id: "fa_sat_g", direction: "down", label: "Acides gras saturés" },
  { id: "salt_g", direction: "down", label: "Sel" },
  // Total sugars (natural + added): public-health targets concern added sugars, so no verdict.
  { id: "sugars_g", direction: "none", label: "Sucres (totaux)" },
  { id: "fe_mg", direction: "up", label: "Fer" },
  { id: "ca_mg", direction: "up", label: "Calcium" },
  { id: "zn_mg", direction: "up", label: "Zinc" },
  { id: "i_ug", direction: "up", label: "Iode" },
  { id: "vit_b12_ug", direction: "up", label: "Vitamine B12" },
  { id: "vit_d_ug", direction: "up", label: "Vitamine D" },
  { id: "vit_b2_mg", direction: "up", label: "Vitamine B2" },
  { id: "fa_c18_3_n3_ala_g", direction: "up", label: "Oméga-3 ALA" },
  { id: "fa_c20_5_n3_epa_g", direction: "up", label: "Oméga-3 EPA" },
  { id: "fa_c22_6_n3_dha_g", direction: "up", label: "Oméga-3 DHA" },
];

/** Criteria whose coverage drives the page-level warning (energy, protein, climate). */
export const KEY_CRITERIA = ["energy_eu_kcal", "protein_g", "ghg_100y_kgco2e"];

/** Agribalyse indicators shown in the Climate card (direction read from indicators.higher_is_better). */
export const CLIMATE_INDICATORS = [
  CLIMATE_MAIN,
  "land_use_pt",
  "water_scarcity_m3",
  "eutro_fw_kgp",
  "particulates",
  "ef_single_score",
];

export const BASES: { id: Basis; label: string }[] = [
  { id: "perServing", label: "par portion" },
  { id: "per100kcal", label: "pour 100 kcal" },
  { id: "per10gProtein", label: "pour 10 g de protéines" },
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
