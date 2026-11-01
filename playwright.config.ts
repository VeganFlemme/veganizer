import { defineConfig } from "@playwright/test";

// End-to-end checks on a running site (npm run dev or npm start): BASE_URL, default localhost:3000.
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  workers: 2,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", locale: "fr-FR" },
});
