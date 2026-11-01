import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests that talk to the linked Supabase project. Not part of `npm test`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/db/**/*.db.test.ts"],
    environment: "node",
    fileParallelism: false,
  },
});
