// The visitor chooses the plant protein (suite V1, decision of Matt 17 h 25): list ranked by
// proximity, choice kept in the URL (?proteine=), the whole page recomputed.
//   BASE_URL=http://localhost:3000 npx playwright test e2e/protein.spec.ts
import { expect, test } from "@playwright/test";

test("changing the protein recomputes the page and keeps the choice in the URL", async ({ page }) => {
  await page.goto("/compare/hachis-parmentier", { waitUntil: "networkidle" });
  const title = page.locator("main").getByText(/^Version végétale :/).first();
  const before = await title.textContent();
  await page.getByRole("button", { name: /changer de protéine/ }).click();
  const list = page.getByRole("list", { name: /Protéines végétales, classées par proximité/ });
  await expect(list).toBeVisible();
  await expect(list.getByRole("button").first()).toContainText("la plus proche en protéines");
  await list.getByRole("button", { name: /Tempeh/ }).click();
  await expect(page).toHaveURL(/proteine=20917/);
  await expect(title).toContainText("tempeh");
  expect(await title.textContent()).not.toBe(before);
  // Reloading keeps the choice.
  await page.reload({ waitUntil: "networkidle" });
  await expect(title).toContainText("tempeh");
});

test("the climate sentence and the official recipe mention are shown", async ({ page }) => {
  await page.goto("/compare/hachis-parmentier", { waitUntil: "networkidle" });
  await expect(page.getByText(/Sur le climat, la version végétale fait mieux avec \d+ protéines? sur \d+/)).toBeVisible();
  await expect(page.getByText(/recette officielle Agribalyse/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Modifier cette recette" })).toHaveAttribute("href", /\/recette\?recette=/);
});

test("a food page offers the same choice of protein, per 100 g", async ({ page }) => {
  await page.goto("/aliment/36018", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /changer de protéine/ })).toBeVisible();
  await expect(page.getByText(/pour 100 g/).first()).toBeVisible();
});

test("« Modifier cette recette » opens /recette filled with the recipe", async ({ page }) => {
  await page.goto("/compare/boeuf-bourguignon", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Modifier cette recette" }).click();
  await expect(page).toHaveURL(/\/recette\?recette=/);
  await expect(page.getByRole("textbox", { name: /Nom/ })).toHaveValue("Bœuf bourguignon");
});
