// Decision of Matt (17 h 25): no reviewed pair exists, the word « vérifiée » must never come back.
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/compare/boeuf-bourguignon", "/compare/boeuf-bourguignon?ajuste=tout", "/aliment/36004", "/aliment/6255", "/recette", "/methodologie", "/a-propos", "/sources"];

for (const path of PAGES) {
  test(`no « vérifiée » on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => document.body.innerText + " " + document.title + " " + (document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""));
    expect(text).not.toMatch(/v[ée]rifi[ée]e?s?\b/i);
  });
}

test("every comparison carries the common mention", async ({ page }) => {
  for (const path of ["/compare/boeuf-bourguignon", "/aliment/36004"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByText(/Comparaison automatique d’après Ciqual et Agribalyse/).first()).toBeVisible();
  }
});
