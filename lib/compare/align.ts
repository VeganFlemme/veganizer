// Pure: the two recipes aligned line by line (desktop, review of 2026-11-01): the same food on the
// same line; then the animal ingredients and their replacements, in order, flagged as replaced.

export interface AlignedLine<T> {
  animal: T | null;
  vegetal: T | null;
  /** false when the line pairs a replaced ingredient (or one side is empty). */
  same: boolean;
}

export function alignRecipes<T extends { code: string; grams: number }>(animal: T[], vegetal: T[], servingsA = 1, servingsV = 1): AlignedLine<T>[] {
  const vByCode = new Map(vegetal.map((v) => [v.code, v]));
  const used = new Set<string>();
  const shared: AlignedLine<T>[] = [];
  const restA: T[] = [];
  for (const a of animal) {
    const v = vByCode.get(a.code);
    if (v && Math.abs(a.grams / servingsA - v.grams / servingsV) < 1e-9) {
      shared.push({ animal: a, vegetal: v, same: true });
      used.add(v.code);
    } else restA.push(a);
  }
  const restV = vegetal.filter((v) => !used.has(v.code));
  const n = Math.max(restA.length, restV.length);
  const replaced: AlignedLine<T>[] = Array.from({ length: n }, (_, i) => ({ animal: restA[i] ?? null, vegetal: restV[i] ?? null, same: false }));
  return [...replaced, ...shared];
}
