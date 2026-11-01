import { buildAutoPage } from "@/lib/compare/auto";
import { getAutoPair } from "@/lib/compare/auto-data";

// "Télécharger les données": every value of the page, per serving, with its sources and licences,
// for the protein of the page (?proteine=, default = the closest).
export async function GET(req: Request, ctx: RouteContext<"/compare/[slug]/donnees">) {
  const { slug } = await ctx.params;
  const pair = await getAutoPair(slug);
  const asked = new URL(req.url).searchParams.get("proteine");
  const code = asked && pair?.input.candidates.some((c) => c.code === asked) ? asked : pair?.defaultCode;
  const model = pair && code ? buildAutoPage(pair.input, code)?.model : null;
  if (!model) return Response.json({ error: "page introuvable" }, { status: 404 });
  const body = {
    page: `/compare/${slug}`,
    proteine: code,
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
            animalCoverage: r.animal?.coverage ?? null,
            vegetalCoverage: r.vegetal?.coverage ?? null,
            sources: r.sourceIds,
          })),
          climateCost: v.climateCost,
          price: { animal: v.price.animal, vegetal: v.price.vegetal, sources: v.price.sourceIds },
          scores: v.scores.verdict.categories.map((c) => ({ id: c.id, winner: c.winner, provisional: c.provisional, animalPoints: c.animalPoints, vegetalPoints: c.vegetalPoints, compared: c.compared, total: c.total })),
        },
      ]),
    ),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="veganizer-${slug}.json"` },
  });
}
