// Journeys (suite V1, step 4, point 1), at 375, 1 280 and 1 920 px: search with a typo, every tab,
// change of protein, base -> completed version, simulator, recipe analysis, error report (the form
// is opened and filled, never sent: CI must not write to the database).
//   BASE_URL=http://localhost:3000 npx playwright test e2e/journeys.spec.ts
import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [375, 1280, 1920];
const TABS = ["Nutrition", "Santé", "Environnement", "Protection animale", "Économie"];

async function openTab(page: Page, name: string) {
  // Phones and tablets: horizontal tabs; from 1 280 px: the left column.
  const tab = page.getByRole("tab", { name: new RegExp(name) }).filter({ visible: true }).first();
  if (await tab.count()) await tab.click();
  else await page.getByRole("navigation", { name: "Catégories de la comparaison" }).getByRole("button", { name: new RegExp(name) }).first().click();
}

for (const width of WIDTHS) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });

    test("search with a typo finds the dish", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.getByRole("searchbox", { name: /Quel plat veux-tu comparer/ }).fill("bourguinon");
      await expect(page.getByRole("link", { name: /Bœuf bourguignon/ }).first()).toBeVisible();
    });

    test("every tab, a protein change, the completed version and the simulator", async ({ page }) => {
      await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
      for (const t of TABS) {
        await openTab(page, t);
        await expect(page).toHaveURL(/onglet=/);
        await expect(page.locator("main")).not.toContainText("NaN");
      }
      await page.getByRole("button", { name: /changer de protéine/ }).click();
      await page.getByRole("list", { name: /Protéines végétales/ }).getByRole("button", { name: /Lentille verte/ }).click();
      await expect(page).toHaveURL(/proteine=20587/);
      await page.getByRole("button", { name: "Version complétée" }).click();
      await expect(page).toHaveURL(/vue=complete/);
      await openTab(page, "Nutrition");
      await expect(page.getByText("Version complétée : exemple d’ajouts possibles")).toBeVisible();
      // Simulator (overview).
      await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
      const sim = page.locator("section").filter({ hasText: "Et si je change ?" }).first();
      const before = await sim.locator("dd").first().textContent();
      await sim.getByRole("group", { name: "Fréquence" }).getByRole("button").last().click();
      await expect(sim.locator("dd").first()).not.toHaveText(before ?? "");
    });

    test("recipe analysis", async ({ page }) => {
      await page.goto("/recette?recette=" + encodeURIComponent(JSON.stringify({ name: "Test", servings: 2, ingredients: [{ code: "6255", name: "steak haché", grams: 250, isAnimal: true }, { code: "9811", name: "pâtes cuites", grams: 400, isAnimal: false }] })), { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Analyser|Comparer/ }).first().click();
      await expect(page.getByText(/Version végétale : les remplacements/)).toBeVisible({ timeout: 30_000 });
    });

    test("error report form opens and validates (not sent)", async ({ page }) => {
      await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Signaler une erreur|Envoyer|Proposer/ }).first().click();
      const box = page.getByRole("textbox", { name: /Qu’as-tu repéré/ });
      await expect(box).toBeVisible();
      await box.fill("Test automatique, non envoyé.");
    });
  });
}
