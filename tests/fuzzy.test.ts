// Home search tolerant to typos (step 4 reviews: « bourguinon » found nothing).
import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "@/lib/fuzzy";

describe("fuzzyMatch", () => {
  it("finds a word with one or two typos, accents and case ignored", () => {
    expect(fuzzyMatch("Bœuf bourguignon", "bourguinon")).toBe(true);
    expect(fuzzyMatch("Lasagnes à la bolognaise", "lasagne")).toBe(true);
    expect(fuzzyMatch("Hachis parmentier", "parmantier")).toBe(true);
    expect(fuzzyMatch("Pâtes à la carbonara", "PATES carbo")).toBe(true);
  });
  it("does not match unrelated words, and keeps short words exact", () => {
    expect(fuzzyMatch("Bœuf bourguignon", "poulet")).toBe(false);
    expect(fuzzyMatch("Riz cantonais", "roz")).toBe(false);
  });
});
