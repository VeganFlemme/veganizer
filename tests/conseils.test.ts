import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import file from "@/data/conseils.json";
import type { Conseil } from "@/lib/scoring";

const conseils: Conseil[] = file.conseils;

describe("data/conseils.json", () => {
  it("has unique ids and at least one criterion each", () => {
    expect(new Set(conseils.map((c) => c.id)).size).toBe(conseils.length);
    for (const c of conseils) expect(c.criteria.length).toBeGreaterThan(0);
  });

  it("every piece of advice is sourced, ANSES or EFSA first", () => {
    for (const c of conseils) {
      expect(c.sources.length).toBeGreaterThan(0);
      expect(["ANSES", "EFSA"]).toContain(c.sources[0].publisher);
      for (const s of c.sources) {
        expect(s.url).toMatch(/^https:\/\//);
        expect(s.accessedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("every source id is inserted into public.sources by a migration", () => {
    const dir = "supabase/migrations";
    const sql = readdirSync(dir).map((f) => readFileSync(`${dir}/${f}`, "utf8")).join("\n");
    for (const c of conseils) for (const s of c.sources) expect(sql).toContain(`('${s.sourceId}',`);
  });

  it("carries the medical disclaimer", () => {
    expect(file.avertissement).toMatch(/professionnel de santé/);
  });
});
