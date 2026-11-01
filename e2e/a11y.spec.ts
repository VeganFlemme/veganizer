// Accessibility (axe, WCAG 2.1 AA) on every page and every tab, at 375 px and 1280 px.
//   BASE_URL=http://localhost:3000 npx playwright test
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TABS = ["", "nutrition", "sante", "environnement", "animaux", "economie"];
const PAGES = [
  "/",
  ...TABS.map((t) => `/compare/boeuf-bourguignon${t ? `?onglet=${t}` : ""}`),
  "/recette",
  "/aliment/6255",
  "/methodologie",
  "/sources",
  "/a-propos",
  "/mentions-legales",
  "/confidentialite",
  "/conditions",
];

for (const width of [375, 1280]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of PAGES) {
      test(`axe ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: "networkidle" });
        const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("nextjs-portal").analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
      });
    }
  });
}

test("tabs: keyboard arrows move between tabs and update the URL", async ({ page }) => {
  await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Vue d’ensemble" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Nutrition" })).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/onglet=nutrition/);
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Économie" })).toBeFocused();
});
