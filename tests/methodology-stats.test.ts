import { describe, expect, it } from "vitest";
import { missingShare } from "@/lib/methodology/stats";

describe("missingShare", () => {
  it("returns the share of rows without a numeric value", () => {
    expect(missingShare(200, 150)).toBeCloseTo(0.25);
  });

  it("returns 0 when every row has a value", () => {
    expect(missingShare(10, 10)).toBe(0);
  });

  it("returns null (donnée manquante) when a count is unavailable, never 0", () => {
    expect(missingShare(null, 5)).toBeNull();
    expect(missingShare(10, null)).toBeNull();
    expect(missingShare(undefined, undefined)).toBeNull();
  });

  it("returns null when there are no rows", () => {
    expect(missingShare(0, 0)).toBeNull();
  });

  it("returns null for inconsistent counts", () => {
    expect(missingShare(10, 11)).toBeNull();
    expect(missingShare(10, -1)).toBeNull();
  });
});
