// Desktop layout (suite V1, S24d): no horizontal scroll at any width, the 5 category scores
// visible without scrolling at 1 440 × 900, no value overflowing its cell.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/layout.spec.ts
import { expect, test } from "@playwright/test";

const TABS = ["", "nutrition", "sante", "environnement", "animaux", "economie"];
const PAGES = ["/", ...TABS.map((t) => `/compare/boeuf-bourguignon${t ? `?onglet=${t}` : ""}`), "/compare/boeuf-bourguignon?ajuste=tout", "/aliment/36004", "/recette", "/methodologie", "/sources"];
const WIDTHS = [375, 768, 1280, 1440, 1920, 2560];

for (const width of WIDTHS) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });
    for (const path of PAGES) {
      test(`no horizontal scroll, no overflowing value: ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        // Name the elements that stick out (fonts differ between macOS and the Linux CI).
        const culprits = overflow > 0 ? await page.evaluate(() => {
          const w = document.documentElement.clientWidth;
          return [...document.querySelectorAll("body *")]
            .filter((e) => e.getBoundingClientRect().right > w + 0.5 && ![...e.children].some((c) => c.getBoundingClientRect().right > w + 0.5))
            .slice(0, 5)
            .map((e) => `${e.tagName.toLowerCase()}.${String((e as HTMLElement).className).slice(0, 60)} «${(e.textContent ?? "").trim().slice(0, 30)}» right=${Math.round(e.getBoundingClientRect().right)}`);
        }) : [];
        expect(overflow, culprits.join(" | ")).toBeLessThanOrEqual(0);
        // A value never overflows its table cell (values do not wrap: they must fit).
        const cells = await page.evaluate(() =>
          [...document.querySelectorAll("td")]
            .filter((td) => td.offsetParent !== null && td.scrollWidth > td.clientWidth + 1)
            .map((td) => td.textContent?.slice(0, 40)),
        );
        expect(cells).toEqual([]);
        // From 1 280 px, no table hidden in a horizontal scroll box (designer review, 2nd pass).
        if (width >= 1280) {
          const hidden = await page.evaluate(() =>
            [...document.querySelectorAll("table")]
              .map((t) => t.parentElement!)
              .filter((box) => box.offsetParent !== null && getComputedStyle(box).overflowX === "auto" && box.scrollWidth > box.clientWidth + 1)
              .map((box) => box.querySelector("caption")?.textContent?.slice(0, 40) ?? "table"),
          );
          expect(hidden).toEqual([]);
        }
      });
    }
  });
}

test.describe("1440 × 900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("the 5 category scores are visible without scrolling (left column and overview cards)", async ({ page }) => {
    await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
    const nav = page.getByRole("navigation", { name: "Catégories de la comparaison" });
    const pills = nav.getByRole("img", { name: /Indicateurs gagnés/ });
    await expect(pills).toHaveCount(5);
    for (const box of await Promise.all((await pills.all()).map((p) => p.boundingBox()))) expect(box!.y + box!.height).toBeLessThanOrEqual(900);
    const cards = page.locator("main button[aria-controls]").filter({ has: page.getByRole("img", { name: /Indicateurs gagnés/ }) });
    await expect(cards).toHaveCount(5);
    for (const c of await cards.all()) {
      const pill = await c.getByRole("img", { name: /Indicateurs gagnés/ }).boundingBox();
      expect(pill!.y + pill!.height).toBeLessThanOrEqual(900);
    }
  });
  test("the left column changes the tab and keeps it in the URL", async ({ page }) => {
    await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
    await page.getByRole("navigation", { name: "Catégories de la comparaison" }).getByRole("button", { name: /Environnement/ }).click();
    await expect(page).toHaveURL(/onglet=environnement/);
    await expect(page.getByRole("heading", { name: /Les 20 indicateurs Agribalyse/ })).toBeVisible();
  });
});
