// Choice of the plant protein by the visitor (suite V1, decision of Matt 17 h 25). Pure: no network.
// Ranking from the data only: every candidate plays the same role (a source of protein replacing
// the main animal ingredient), then closest protein per 100 g, then lipids, then energy. Never by
// CO2e, price or score.

export interface ProteinCandidate {
  code: string;
  name: string;
  /** Per 100 g; null = missing (never 0). */
  protein: number | null;
  fat: number | null;
  energy: number | null;
}

export interface RankedCandidate extends ProteinCandidate {
  rank: number;
  /** Why it is at this rank, in words (shown under its name). */
  reason: string;
}

export interface ProteinTarget {
  protein: number | null;
  fat: number | null;
  energy: number | null;
  /** Short name of the animal ingredient, for the reason (« bœuf »). */
  name?: string;
}

const fr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const gap = (a: number | null, b: number | null) => (a == null || b == null ? Number.POSITIVE_INFINITY : Math.round(Math.abs(a - b)));

/** Lexicographic: protein gap (whole grams), lipid gap (whole grams), energy gap (whole kcal), code. */
export function rankCandidates(target: ProteinTarget, candidates: ProteinCandidate[]): RankedCandidate[] {
  const keyed = candidates.map((c) => ({ c, k: [gap(c.protein, target.protein), gap(c.fat, target.fat), gap(c.energy, target.energy)] }));
  keyed.sort((x, y) => x.k[0] - y.k[0] || x.k[1] - y.k[1] || x.k[2] - y.k[2] || (x.c.code < y.c.code ? -1 : x.c.code > y.c.code ? 1 : 0));
  const ref = target.protein == null ? "" : ` (${target.name ?? "ingrédient animal"} : ${fr.format(target.protein)} g)`;
  return keyed.map(({ c }, i) => ({
    ...c,
    rank: i + 1,
    reason:
      c.protein == null
        ? "protéines : donnée manquante"
        : i === 0
          ? `la plus proche en protéines : ${fr.format(c.protein)} g pour 100 g${ref}`
          : `${fr.format(c.protein)} g de protéines pour 100 g${ref}`,
  }));
}

export type ProteinFamily = "soja" | "légumineuses" | "blé" | "autres";

/** Family of a candidate, from its Ciqual name and subgroup (for « at least 3 families »). */
export function proteinFamily(food: { name: string; subgroup: string | null }): ProteinFamily {
  const n = food.name.toLowerCase();
  if (/soja|tofu|tempeh|edamame/.test(n)) return "soja";
  if (/seitan|gluten|(^|[^a-zà-ÿ])blé([^a-zà-ÿ]|$)/.test(n)) return "blé";
  if (food.subgroup === "légumineuses" || /lentille|pois chiche|haricot|fève|pois cassé/.test(n)) return "légumineuses";
  return "autres";
}
