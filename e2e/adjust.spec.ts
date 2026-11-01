// One plant version, adjusted by the visitor (suite V1, step 3 quinquies), on a phone and a computer:
// equalise protein or calories, close a gap, « Tout combler », back to base; the numbers and the URL
// follow; the old ?vue=complete becomes ?ajuste=tout.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/adjust.spec.ts
import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });

    test("the adjustment panel changes the numbers and the URL", async ({ page }) => {
      await page.goto("/compare/boeuf-bourguignon?onglet=nutrition", { waitUntil: "networkidle" });
      const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ajuster la version végétale" }) }).last();
      await expect(panel).toBeVisible();
      const protein = page.locator("table tr").filter({ hasText: /^Protéines/ }).first();
      const before = await protein.innerText();
      await panel.getByRole("group", { name: "Égaliser avec le plat animal" }).getByRole("button", { name: "les protéines" }).click();
      await expect(page).toHaveURL(/ajuste=proteines/);
      await expect.poll(() => protein.innerText()).not.toBe(before);
      await expect(protein).toContainText("Comblé");
      await panel.getByRole("group", { name: "Égaliser avec le plat animal" }).getByRole("button", { name: "les calories" }).click();
      await expect(page).toHaveURL(/ajuste=calories/);
      await expect(panel.getByText(/Portion végétale ×/)).toBeVisible();
      await panel.getByRole("button", { name: "Tout combler" }).click();
      await expect(page).toHaveURL(/ajuste=tout/);
      await panel.getByRole("button", { name: "Revenir à la recette de base" }).click();
      await expect(page).not.toHaveURL(/ajuste=/);
      await expect.poll(() => protein.innerText()).toBe(before);
    });

    test("?vue=complete becomes ?ajuste=tout, and other tabs show one line", async ({ page }) => {
      await page.goto("/compare/boeuf-bourguignon?vue=complete&onglet=environnement", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/ajuste=tout/);
      await expect(page).not.toHaveURL(/vue=complete/);
      await expect(page.getByText(/^Version ajustée :/)).toBeVisible();
      await page.getByRole("button", { name: "Modifier dans Nutrition" }).click();
      await expect(page).toHaveURL(/onglet=nutrition/);
    });
  });
}
