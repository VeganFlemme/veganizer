// ADEME reports underestimated egg impacts in Agribalyse 3.2 (notice, 21/08/2025): the warning is shown
// where a recipe contains eggs, and only there.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/egg-note.spec.ts
import { expect, test } from "@playwright/test";

test("an egg dish carries the ADEME warning in the Environment tab", async ({ page }) => {
  await page.goto("/compare/omelette?onglet=environnement", { waitUntil: "networkidle" });
  await expect(page.getByRole("note").filter({ hasText: "sous-évalués dans Agribalyse 3.2" })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: "du plat animal sont donc probablement trop basses" })).toBeVisible();
});

test("a dish without eggs has no such warning", async ({ page }) => {
  await page.goto("/compare/boeuf-bourguignon?onglet=environnement", { waitUntil: "networkidle" });
  await expect(page.getByText("Les 20 indicateurs Agribalyse")).toBeVisible();
  await expect(page.getByText("sous-évalués dans Agribalyse 3.2")).toHaveCount(0);
});
