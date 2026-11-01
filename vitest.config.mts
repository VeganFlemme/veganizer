import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // tests/db talks to the linked Supabase project: npm run test:db:scoring
    exclude: ["tests/db/**", "node_modules/**"],
    environment: "node",
  },
});
