import { describe, expect, it } from "vitest";

// Minimal smoke test: verifies the Vitest setup and the "@/*" alias resolve.
// Real scoring-engine tests will live alongside lib/scoring/.
describe("test setup", () => {
  it("resolves the @/* alias", async () => {
    const config = await import("@/next.config");
    expect(config.default).toBeTypeOf("object");
  });
});
