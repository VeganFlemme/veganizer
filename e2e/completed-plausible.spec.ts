// Completed version on raw foods (suite V1, step 3 ter, 5 ter): the main protein is at most doubled
// (plausible serving), the rest comes from the list; foods whose role is not protein say so.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/completed-plausible.spec.ts
import { expect, test } from "@playwright/test";

const FOODS = [
  { code: "12115", name: "emmental", role: /Le fromage apporte surtout du calcium et des matières grasses/ },
  { code: "22000", name: "œuf", role: null },
  { code: "26099", name: "dorade", role: null },
  { code: "6254", name: "steak haché", role: null },
  { code: "19041", name: "lait", role: /Le lait apporte surtout du calcium/ },
];

for (const f of FOODS) {
  test(`${f.name}: main protein at most doubled, role stated when it is not protein`, async ({ page }) => {
    await page.goto(`/aliment/${f.code}?vue=complete`, { waitUntil: "networkidle" });
    const panel = page.locator("section").filter({ hasText: "Version complétée : exemple d’ajouts possibles" }).first();
    await expect(panel).toBeVisible();
    // 100 g of the plant protein at the start: never more than +100 g.
    const lines = panel.getByText(/g pour la recette \(\+\d+/);
    const boost = (await lines.count()) > 0 ? await lines.first().textContent() : null;
    if (boost) {
      const extra = Number(/\+(\d+)\s?g pour la recette/.exec(boost.replace(/ /g, " "))?.[1] ?? "0");
      expect(extra).toBeLessThanOrEqual(100);
    }
    if (f.role) await expect(panel.getByText(f.role)).toBeVisible();
    else await expect(panel.getByText(/n’est qu’un repère/)).toHaveCount(0);
  });
}
