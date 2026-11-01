// Every combination of choices (suite V1, step 4, point 4 ter): 5 dishes and 2 foods, the 3 first
// proteins of the list, base and adjusted (?ajuste=tout) version, every tab, at 375, 1 440 and 1 920 px.
// Checks: never « NaN », « undefined », « null » nor an empty card; the score of a category is the
// same everywhere (verdict, left column, overview card); the state survives a reload.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/combinations.spec.ts
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/compare/boeuf-bourguignon", "/compare/hachis-parmentier", "/compare/omelette", "/compare/saumon-riz", "/compare/quiche-lorraine", "/aliment/36018", "/aliment/12115"];
const WIDTHS = [375, 1440, 1920];
const TABS = ["", "nutrition", "sante", "environnement", "animaux", "economie"];
const CATEGORIES = ["Nutrition", "Santé", "Environnement", "Protection animale", "Économie"];

async function clean(page: Page, where: string) {
  const text = await page.locator("main").innerText();
  for (const bad of ["NaN", "undefined", "null", "[object Object]"]) expect(text, `${bad} on ${where}`).not.toMatch(new RegExp(`(^|\\W)${bad.replace(/[[\]]/g, "\\$&")}(\\W|$)`));
  const empty = await page.locator("main section").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent !== null && !(e.textContent ?? "").trim()).length);
  expect(empty, `empty card on ${where}`).toBe(0);
}

/** Points per category in the verdict panel (screen-reader text), the left column and the overview cards. */
async function scores(page: Page) {
  const out: Record<string, string[]> = {};
  const verdict = await page.locator("section li .sr-only").allTextContents();
  for (const t of verdict) {
    const m = /^(.+?) : .*?, (\d+) indicateur\(s\) pour le plat animal, (\d+) pour la version végétale/.exec(t);
    if (m) (out[m[1]] ??= []).push(`${m[2]}-${m[3]}`);
  }
  const pills = page.getByRole("img", { name: /Indicateurs gagnés/ });
  for (const p of await pills.all()) {
    if (!(await p.isVisible())) continue;
    const label = (await p.getAttribute("aria-label")) ?? "";
    const m = /plat animal (\d+), version végétale (\d+)/.exec(label);
    const host = await p.evaluate((el) => (el.closest("button, li, [role=tab]")?.textContent ?? "").trim());
    const cat = CATEGORIES.find((c) => host.includes(c));
    if (m && cat) (out[cat] ??= []).push(`${m[1]}-${m[2]}`);
  }
  return out;
}

for (const width of WIDTHS) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });
    for (const path of PAGES) {
      for (const rank of [0, 1, 2]) {
        test(`${path}: protein n° ${rank + 1} × base/adjusted × every tab`, async ({ page }) => {
          test.setTimeout(180_000);
          await page.goto(path, { waitUntil: "load" });
          await page.getByRole("button", { name: /changer de protéine/ }).click();
          const items = page.getByRole("list", { name: /Protéines végétales/ }).getByRole("button");
          test.skip(rank >= (await items.count()), "fewer proteins");
          await items.nth(rank).click();
          const chosen = page.url();
          for (const ajuste of ["", "tout"]) {
            for (const tab of TABS) {
              const url = new URL(chosen);
              if (ajuste) url.searchParams.set("ajuste", ajuste);
              else url.searchParams.delete("ajuste");
              if (tab) url.searchParams.set("onglet", tab);
              else url.searchParams.delete("onglet");
              await page.goto(url.toString(), { waitUntil: "load" });
              const where = `${url.pathname}${url.search} @${width}`;
              await clean(page, where);
              if (!tab) {
                for (const [cat, values] of Object.entries(await scores(page))) {
                  expect(new Set(values).size, `score of ${cat} differs on ${where}: ${values.join(", ")}`).toBe(1);
                }
              }
            }
          }
          // The state survives a reload.
          const last = page.url();
          const title = await page.locator("main").getByText(/^Version végétale :/).first().textContent();
          await page.reload({ waitUntil: "load" });
          expect(page.url()).toBe(last);
          await expect(page.locator("main").getByText(/^Version végétale :/).first()).toHaveText(title ?? "");
        });
      }
    }
  });
}
