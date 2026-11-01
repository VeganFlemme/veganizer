// Cross-check: the growth rule stored in monetization_rules reproduces the
// values published in monetization_factors (within 1 %).
// Run: npm run test:db:scoring   (needs `supabase link`)
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { monetize, type MonetizationFactor, type MonetizationRule } from "@/lib/scoring";

function query(sql: string): Record<string, string | number | null>[] {
  const out = execFileSync("supabase", ["db", "query", "--linked", "--output-format", "json", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out.slice(out.indexOf("{"))).rows;
}

describe("monetization_rules vs monetization_factors (linked Supabase)", () => {
  it("the rule reproduces every published year within 1 %", () => {
    const factors: MonetizationFactor[] = query(
      "select indicator_id, year, eur_per_unit, method, source_id from public.monetization_factors",
    ).map((r) => ({
      indicatorId: String(r.indicator_id),
      year: Number(r.year),
      eurPerUnit: Number(r.eur_per_unit),
      method: String(r.method),
      sourceId: String(r.source_id),
    }));
    const rules: MonetizationRule[] = query(
      "select indicator_id, method, growth_rate, start_year, cap_year, source_id from public.monetization_rules",
    ).map((r) => ({
      indicatorId: String(r.indicator_id),
      method: String(r.method),
      growthRate: Number(r.growth_rate),
      startYear: Number(r.start_year),
      capYear: Number(r.cap_year),
      sourceId: String(r.source_id),
    }));
    expect(rules.length).toBeGreaterThan(0);

    for (const rule of rules) {
      const base = factors.filter((f) => f.indicatorId === rule.indicatorId && f.method === rule.method && f.year === rule.startYear);
      expect(base).toHaveLength(1);
      const published = factors.filter((f) => f.indicatorId === rule.indicatorId && f.method === rule.method);
      for (const p of published) {
        // Computed from the start value only, so the published year cannot shortcut the rule.
        const computed = monetize(1, p.year, base, { indicatorId: rule.indicatorId, rules: [rule] });
        console.log(`${p.year}: published ${p.eurPerUnit} €/kg, rule ${computed?.eurPerUnit.toFixed(4)} €/kg`);
        expect(Math.abs(computed!.eurPerUnit / p.eurPerUnit - 1)).toBeLessThan(0.01);
      }
    }
  }, 60_000);
});
