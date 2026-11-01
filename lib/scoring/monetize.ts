/** One monetization_factors row. */
export interface MonetizationFactor {
  indicatorId: string;
  year: number;
  eurPerUnit: number;
  method: string;
  sourceId: string;
}

export interface MonetizedValue {
  eur: number;
  eurPerUnit: number;
  year: number;
  method: string;
  sourceId: string;
}

export interface MonetizeOptions {
  /** Default: climate change, 100 years (Agribalyse). */
  indicatorId?: string;
  /** Required when several methods publish a factor for the same year. */
  method?: string;
}

/**
 * Cost of a quantity (e.g. kg CO2e) for a given year, from the factors received.
 * Only published years are used: no interpolation, null (donnée manquante) otherwise.
 * Negative quantities are kept as they are.
 */
export function monetize(
  quantity: number,
  year: number,
  factors: MonetizationFactor[],
  options: MonetizeOptions = {},
): MonetizedValue | null {
  const indicatorId = options.indicatorId ?? "ghg_100y_kgco2e";
  const matches = factors.filter(
    (f) => f.indicatorId === indicatorId && f.year === year && (options.method == null || f.method === options.method),
  );
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      `several methods for ${indicatorId} in ${year} (${matches.map((m) => m.method).join(", ")}): pass options.method`,
    );
  }
  const f = matches[0];
  return { eur: quantity * f.eurPerUnit, eurPerUnit: f.eurPerUnit, year, method: f.method, sourceId: f.sourceId };
}
