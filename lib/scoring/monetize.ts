/** One monetization_factors row (a published value). */
export interface MonetizationFactor {
  indicatorId: string;
  year: number;
  eurPerUnit: number;
  method: string;
  sourceId: string;
}

/**
 * One monetization_rules row: how the value evolves between published years.
 * value(year) = value(startYear) × (1 + growthRate)^(year − startYear), constant after capYear.
 */
export interface MonetizationRule {
  indicatorId: string;
  method: string;
  growthRate: number;
  startYear: number;
  capYear: number;
  sourceId: string;
}

export interface MonetizedValue {
  eur: number;
  eurPerUnit: number;
  year: number;
  method: string;
  sourceId: string;
  /** false = published value for that year; true = computed with the source's growth rule. */
  derived: boolean;
}

export interface MonetizeOptions {
  /** Default: climate change, 100 years (Agribalyse). */
  indicatorId?: string;
  /** Required when several methods apply to the same year. */
  method?: string;
  /** Sourced growth rules, used only for years without a published factor. */
  rules?: MonetizationRule[];
}

function only<T extends { method: string }>(items: T[], what: string): T | null {
  if (items.length === 0) return null;
  if (items.length > 1) {
    throw new Error(`several methods for ${what} (${items.map((m) => m.method).join(", ")}): pass options.method`);
  }
  return items[0];
}

/**
 * Cost of a quantity (e.g. kg CO2e) for a given year, from the factors and rules received.
 * - A published factor for that year is always used as is.
 * - Otherwise, the source's growth rule is applied to the published start-year value
 *   (after the cap year, the value of the cap year is kept).
 * - Otherwise: null (donnée manquante). Negative quantities are kept as they are.
 */
export function monetize(
  quantity: number,
  year: number,
  factors: MonetizationFactor[],
  options: MonetizeOptions = {},
): MonetizedValue | null {
  const indicatorId = options.indicatorId ?? "ghg_100y_kgco2e";
  const sameMethod = (m: string) => options.method == null || m === options.method;

  const published = (y: number, method?: string) =>
    only(
      factors.filter(
        (f) => f.indicatorId === indicatorId && f.year === y && sameMethod(f.method) && (method == null || f.method === method),
      ),
      `${indicatorId} in ${y}`,
    );

  const exact = published(year);
  if (exact) {
    return { eur: quantity * exact.eurPerUnit, eurPerUnit: exact.eurPerUnit, year, method: exact.method, sourceId: exact.sourceId, derived: false };
  }

  const rule = only(
    (options.rules ?? []).filter((r) => r.indicatorId === indicatorId && sameMethod(r.method)),
    `${indicatorId} rules`,
  );
  if (!rule || year < rule.startYear) return null;

  // After the cap year, the value stays at the cap-year value (published if there is one).
  if (year > rule.capYear) {
    const atCap = monetize(1, rule.capYear, factors, { ...options, indicatorId, method: rule.method });
    return atCap && { ...atCap, eur: quantity * atCap.eurPerUnit, year, derived: true };
  }

  const start = published(rule.startYear, rule.method);
  if (!start) return null;
  const eurPerUnit = start.eurPerUnit * (1 + rule.growthRate) ** (year - rule.startYear);
  return { eur: quantity * eurPerUnit, eurPerUnit, year, method: rule.method, sourceId: rule.sourceId, derived: true };
}
