// Full-page captures of every page and every tab (docs/DESIGN.md § 6), kept out of git.
//   node scripts/captures.mjs [baseUrl] [outDir] [filter] [widths, e.g. 375,1280,1440,1920]
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "docs/captures";
const filter = process.argv[4] ?? "";
const widths = (process.argv[5] ?? "375,1280").split(",").map(Number);
const TABS = ["", "nutrition", "sante", "environnement", "animaux", "economie"];
const TAB_LABEL = { "": "Vue d’ensemble", nutrition: "Nutrition", sante: "Santé", environnement: "Environnement", animaux: "Protection animale", economie: "Économie" };

const pages = [
  { name: "accueil", path: "/" },
  ...TABS.map((t) => ({ name: `compare-${t || "apercu"}`, path: `/compare/boeuf-bourguignon${t ? `?onglet=${t}` : ""}` })),
  ...TABS.map((t) => ({ name: `recette-${t || "apercu"}`, path: "/recette", recipe: true, tab: t })),
  { name: "compare-complete", path: "/compare/boeuf-bourguignon?vue=complete" },
  { name: "aliment", path: "/aliment/6255" },
  { name: "aliment-poulet", path: "/aliment/36004" },
  { name: "methodologie", path: "/methodologie" },
  { name: "sources", path: "/sources" },
  { name: "a-propos", path: "/a-propos" },
  { name: "mentions-legales", path: "/mentions-legales" },
  { name: "confidentialite", path: "/confidentialite" },
  { name: "conditions", path: "/conditions" },
  { name: "introuvable", path: "/compare/plat-inconnu" },
].filter((p) => p.name.includes(filter));

// A recipe typed in the browser (localStorage draft), so that /recette shows its result.
const DRAFT = { name: "Bolognaise de test", servings: 4, ingredients: [
  { code: "6255", name: "Bœuf, steak haché 15 % MG, cuit", grams: 400, isAnimal: true },
  { code: "9811", name: "Pâtes cuites", grams: 350, isAnimal: false },
] };

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : width >= 1920 ? 1080 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce", locale: "fr-FR" });
  await context.addInitScript((d) => window.localStorage.setItem("veganizer:recette", JSON.stringify(d)), DRAFT);
  const page = await context.newPage();
  for (const p of pages) {
    await page.goto(base + p.path, { waitUntil: "load" });
    await page.waitForTimeout(800);
    if (p.recipe) {
      await page.getByRole("button", { name: "Analyser et voir la version végétale" }).click();
      // Tab bar below 1 280 px, left column of categories from 1 280 px (S24d).
      const wide = width >= 1280;
      await (wide ? page.getByRole("navigation", { name: "Catégories de la comparaison" }) : page.getByRole("tablist")).waitFor();
      if (p.tab)
        await (wide
          ? page.getByRole("navigation", { name: "Catégories de la comparaison" }).getByRole("button", { name: new RegExp(TAB_LABEL[p.tab]) })
          : page.getByRole("tab", { name: TAB_LABEL[p.tab] })
        ).click();
    }
    await page.evaluate(() => document.fonts.ready);
    const file = `${out}/${p.name}-${width}.jpg`;
    await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 55 });
    console.log(file);
  }
  await context.close();
}
await browser.close();
