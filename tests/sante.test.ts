import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import file from "@/data/sante.json";

describe("data/sante.json", () => {
  it("cites the exact pages of the IARC monograph", () => {
    expect(file.iarc.map((x) => x.id).sort()).toEqual(["rouge", "transformée"]);
    for (const x of file.iarc) {
      expect(x.source.pages).toMatch(/p\. \d+/);
      expect(x.source.url).toMatch(/^https:\/\//);
      expect(x.source.accessedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("copies the PNNS guidelines with their exact pages", () => {
    expect(file.pnns.map((x) => x.id)).toEqual(["viande", "charcuterie", "poisson", "legumes-secs"]);
    for (const x of file.pnns) {
      expect(x.source.sourceId).toBe("spf-pnns-2019");
      expect(x.source.pages).toMatch(/p\. \d+/);
      expect(x.repere.length).toBeGreaterThan(10);
      expect((x as { limiteGrammesSemaine?: number }).limiteGrammesSemaine ?? (x as { foisParSemaine?: number }).foisParSemaine).toBeGreaterThan(0);
    }
  });

  it("every source id exists in the seed or a migration", () => {
    const dir = "supabase/migrations";
    const sql = [readFileSync("supabase/seed.sql", "utf8"), ...readdirSync(dir).map((f) => readFileSync(`${dir}/${f}`, "utf8"))].join("\n");
    for (const x of [...file.iarc, ...file.pnns]) expect(sql).toContain(`('${x.source.sourceId}',`);
  });

  it("carries the medical disclaimer", () => {
    expect(file.avertissement).toMatch(/professionnel de santé/);
  });
});
