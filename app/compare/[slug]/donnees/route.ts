import { buildAdjusted, buildAutoPage, parseAdjust } from "@/lib/compare/auto";
import { COVERAGE_WARNING } from "@/lib/compare/config";
import { getAutoPair } from "@/lib/compare/auto-data";

// "Télécharger les données": every value of the page, per serving, with its sources and licences,
// for the protein of the page (?proteine=, default = the closest).
export async function GET(req: Request, ctx: RouteContext<"/compare/[slug]/donnees">) {
  const { slug } = await ctx.params;
  const pair = await getAutoPair(slug);
  const asked = new URL(req.url).searchParams.get("proteine");
  const code = asked && pair?.input.candidates.some((c) => c.code === asked) ? asked : pair?.defaultCode;
  const params = new URL(req.url).searchParams;
  const request = parseAdjust(params.get("ajuste"), params.get("quantite"));
  const model = pair && code ? buildAutoPage(pair.input, code)?.model : null;
  if (!model) return Response.json({ error: "page introuvable" }, { status: 404 });
  // Step 3 quinquies: the adjusted plant version replaces the base one in the export.
  const adjusted = request && pair && code ? buildAdjusted(pair.input, code, request) : null;
  if (adjusted) model.variants[code!] = adjusted.view;
  const body = {
    page: `/compare/${slug}`,
    proteine: code,
    ajustement: request,
    recette: pair!.input.recipe,
    note:
      "Valeurs calculées par Veganizer à partir des sources listées ; null = donnée manquante (jamais 0). Les prix issus d'Open Prices sont sous licence ODbL : toute base dérivée doit être partagée sous la même licence, en citant Open Prices.",
    sources: Object.values(model.sources),
    animal: model.animal,
    variants: Object.fromEntries(
      Object.entries(model.variants).flatMap(([k, v]) => (v ? [[k, v] as const] : [])).map(([k, v]) => [
        k,
        {
          dish: v.dish,
          rationale: v.rationale,
          perServing: v.rows.perServing.map((r) => ({
            id: r.id,
            name: r.sourceName,
            unit: r.unit,
            animal: r.animal?.value ?? null,
            vegetal: r.vegetal?.value ?? null,
            // Ranges (Ciqual « < x », published bounds): the value alone may be null.
            animalLow: r.animal?.low ?? null,
            animalHigh: r.animal?.high ?? null,
            vegetalLow: r.vegetal?.low ?? null,
            vegetalHigh: r.vegetal?.high ?? null,
            filled: r.filled ?? false,
            animalCoverage: r.animal?.coverage ?? null,
            vegetalCoverage: r.vegetal?.coverage ?? null,
            sources: r.sourceIds,
          })),
          climateCost: v.climateCost,
          // Same rule as the page: a dish price only when public prices cover 95 % of its mass.
          price: {
            animal: v.price.animal && v.price.animal.coverage >= COVERAGE_WARNING ? v.price.animal : null,
            vegetal: v.price.vegetal && v.price.vegetal.coverage >= COVERAGE_WARNING ? v.price.vegetal : null,
            animalCoverage: v.price.animal?.coverage ?? null,
            vegetalCoverage: v.price.vegetal?.coverage ?? null,
            sources: v.price.sourceIds,
          },
          scores: v.scores.verdict.categories.map((c) => ({ id: c.id, winner: c.winner, provisional: c.provisional, animalPoints: c.animalPoints, vegetalPoints: c.vegetalPoints, compared: c.compared, total: c.total })),
        },
      ]),
    ),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="veganizer-${slug}.json"` },
  });
}
