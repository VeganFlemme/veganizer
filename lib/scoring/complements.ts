// « Avec compléments » (suite V1, S24): the smallest additions of whitelisted foods
// (data/complements.json) that close the nutrient gaps of a dish. Pure: no network, no Supabase.

export interface ComplementFood {
  code: string;
  /** Realistic maximum per serving (g). */
  maxGrams: number;
  /** Preference: 1 for everyday foods, more for fortified ones (used only when needed). */
  weight: number;
  /** Nutrient per 100 g (Ciqual); absent = unknown (never counted). */
  per100g: Record<string, number | undefined>;
}

export interface ComplementResult {
  additions: { code: string; grams: number; nutrients: string[] }[];
  /** Gaps closed by the additions. */
  closed: string[];
  /** Gaps no whitelisted food can close within the maxima and limits: advice only. */
  open: string[];
}

export interface ComplementOptions {
  /** Upper safety limits (per day, ANSES), never exceeded by the serving total. */
  limits?: Record<string, number>;
  /** Amount already in the serving, for the limits. */
  base?: Record<string, number>;
}

// Additions are rounded UP to this step (g), so a closed gap stays closed.
const STEP = 0.1;
const EPS = 1e-9;

export interface LpConstraint {
  coef: number[];
  op: ">=" | "<=";
  rhs: number;
}

/**
 * Small dense linear program: minimise c·x subject to constraints and 0 ≤ x ≤ upper.
 * Two-phase simplex with Bland's rule. Returns null when infeasible.
 */
export function solveLinearProgram(c: number[], constraints: LpConstraint[], upper: number[]): { x: number[]; value: number } | null {
  const n = c.length;
  // Rows: user constraints, then x_j ≤ upper_j. Normalise to rhs ≥ 0.
  const rows: { coef: number[]; op: ">=" | "<="; rhs: number }[] = [
    ...constraints.map((k) => ({ ...k, coef: [...k.coef] })),
    ...upper.map((u, j) => ({ coef: c.map((_, i) => (i === j ? 1 : 0)), op: "<=" as const, rhs: u })),
  ].map((r) => (r.rhs < 0 ? { coef: r.coef.map((v) => -v), op: r.op === ">=" ? ("<=" as const) : (">=" as const), rhs: -r.rhs } : r));
  const m = rows.length;
  const slackCount = m;
  const artIdx: number[] = [];
  rows.forEach((r, i) => {
    if (r.op === ">=") artIdx.push(i);
  });
  const width = n + slackCount + artIdx.length + 1;
  const T: number[][] = rows.map((r, i) => {
    const row = new Array(width).fill(0);
    r.coef.forEach((v, j) => (row[j] = v));
    row[n + i] = r.op === "<=" ? 1 : -1;
    const a = artIdx.indexOf(i);
    if (a >= 0) row[n + slackCount + a] = 1;
    row[width - 1] = r.rhs;
    return row;
  });
  const basis = rows.map((r, i) => (r.op === "<=" ? n + i : n + slackCount + artIdx.indexOf(i)));

  const pivot = (pr: number, pc: number) => {
    const p = T[pr][pc];
    for (let j = 0; j < width; j++) T[pr][j] /= p;
    for (let i = 0; i < m; i++) {
      if (i === pr) continue;
      const f = T[i][pc];
      if (Math.abs(f) > EPS) for (let j = 0; j < width; j++) T[i][j] -= f * T[pr][j];
    }
    basis[pr] = pc;
  };
  const run = (cost: number[], allowed: (j: number) => boolean): boolean => {
    for (let iter = 0; iter < 500; iter++) {
      // reduced costs
      let enter = -1;
      for (let j = 0; j < width - 1 && enter < 0; j++) {
        if (!allowed(j) || basis.includes(j)) continue;
        let rc = cost[j];
        for (let i = 0; i < m; i++) rc -= cost[basis[i]] * T[i][j];
        if (rc < -EPS) enter = j;
      }
      if (enter < 0) return true;
      let leave = -1;
      let best = Infinity;
      for (let i = 0; i < m; i++) {
        if (T[i][enter] > EPS) {
          const ratio = T[i][width - 1] / T[i][enter];
          if (ratio < best - EPS || (Math.abs(ratio - best) <= EPS && basis[i] < basis[leave])) {
            best = ratio;
            leave = i;
          }
        }
      }
      if (leave < 0) return false; // unbounded (cannot happen with bounds)
      pivot(leave, enter);
    }
    return false;
  };
  // Phase 1: minimise the sum of artificials.
  const phase1 = new Array(width - 1).fill(0);
  artIdx.forEach((_, a) => (phase1[n + slackCount + a] = 1));
  run(phase1, () => true);
  const infeas = basis.reduce((s, b, i) => s + (b >= n + slackCount ? T[i][width - 1] : 0), 0);
  if (infeas > 1e-7) return null;
  // Phase 2: original cost, artificials excluded.
  const cost = new Array(width - 1).fill(0);
  c.forEach((v, j) => (cost[j] = v));
  if (!run(cost, (j) => j < n + slackCount)) return null;
  const x = new Array(n).fill(0);
  basis.forEach((b, i) => {
    if (b < n) x[b] = T[i][width - 1];
  });
  return { x, value: x.reduce((s, v, j) => s + v * c[j], 0) };
}

const roundUp = (g: number) => Math.ceil(g / STEP - 1e-6) * STEP;

/**
 * Smallest additions (weighted grams: everyday foods first) closing all the gaps together
 * (per serving), within each food's maximum and the upper safety limits. A gap that cannot be
 * closed is left open (advice only) and the others are solved without it.
 */
export function solveComplements(gaps: Record<string, number>, foods: ComplementFood[], options: ComplementOptions = {}): ComplementResult {
  const wanted = Object.entries(gaps).filter(([, g]) => g > EPS);
  if (wanted.length === 0) return { additions: [], closed: [], open: [] };
  const limits = Object.entries(options.limits ?? {});
  const contrib = (f: ComplementFood, id: string) => (f.per100g[id] ?? 0) / 100;

  const solve = (ids: string[]) => {
    const cons: LpConstraint[] = [
      ...ids.map((id) => ({ coef: foods.map((f) => contrib(f, id)), op: ">=" as const, rhs: gaps[id] })),
      ...limits.map(([id, lim]) => ({ coef: foods.map((f) => contrib(f, id)), op: "<=" as const, rhs: lim - (options.base?.[id] ?? 0) })),
    ];
    return solveLinearProgram(foods.map((f) => f.weight), cons, foods.map((f) => f.maxGrams));
  };

  // A gap is closable on its own first; then all closable gaps together, dropping the hardest if needed.
  let ids = wanted.map(([id]) => id).filter((id) => solve([id]) != null);
  let sol = solve(ids);
  while (!sol && ids.length) {
    const hardest = [...ids].sort((a, b) => gaps[b] / Math.max(...foods.map((f) => contrib(f, b) * f.maxGrams), EPS) - gaps[a] / Math.max(...foods.map((f) => contrib(f, a) * f.maxGrams), EPS))[0];
    ids = ids.filter((id) => id !== hardest);
    sol = solve(ids);
  }
  const grams = (sol?.x ?? []).map((g, j) => Math.min(roundUp(g), foods[j].maxGrams));
  // Rounding up must not breach a limit: fall back to the exact amount for that food.
  for (const [id, lim] of limits) {
    const total = (options.base?.[id] ?? 0) + grams.reduce((s, g, j) => s + g * contrib(foods[j], id), 0);
    if (total > lim + EPS && sol) grams.forEach((_, j) => (grams[j] = sol!.x[j]));
  }
  const additions = foods
    .map((f, j) => ({ code: f.code, grams: Number(grams[j].toFixed(1)), nutrients: ids.filter((id) => contrib(f, id) > 0) }))
    .filter((a) => a.grams > EPS);
  return { additions, closed: [...ids], open: wanted.map(([id]) => id).filter((id) => !ids.includes(id)) };
}
