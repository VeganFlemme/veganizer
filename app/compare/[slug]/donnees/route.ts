import { getPairPage } from "@/lib/compare/data";

// "Télécharger les données": every value of the page, per serving, with its sources and licences.
export async function GET(_req: Request, ctx: RouteContext<"/compare/[slug]/donnees">) {
  const { slug } = await ctx.params;
  const model = await getPairPage(slug);
  if (!model) return Response.json({ error: "page introuvable" }, { status: 404 });
  const body = {
    page: `/compare/${slug}`,
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
