// « Nos recettes comparées aux plats moyens d'Agribalyse » (suite V1, step 4, point 4 bis).
// Data: data/recipes_crosscheck.json, written by pipeline/crosscheck.py (never typed by hand).
import file from "@/data/recipes_crosscheck.json";

const COLUMNS = [
  ["ghg_kg", "kg CO₂e par kg"],
  ["energy_eu_kcal", "kcal pour 100 g"],
  ["protein_g", "Protéines, g pour 100 g"],
  ["fat_g", "Lipides, g pour 100 g"],
  ["salt_g", "Sel, g pour 100 g"],
] as const;

type Cell = { oursLow: number | null; oursHigh: number | null; official: number | null; gapPercent: number | null };
type Row = { slug: string; side: string; dish: string; officialCode: string; officialName: string; recipe: string; flagged: boolean; values: Record<string, Cell> };

const nf = (x: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: x < 10 ? 2 : 0 }).format(x);
const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x)} %`;

function Value({ c, threshold }: { c: Cell | undefined; threshold: number }) {
  if (!c || c.oursLow == null || c.oursHigh == null || c.official == null) return <span className="text-ink-3">donnée manquante</span>;
  const ours = Math.abs(c.oursHigh - c.oursLow) < 0.005 ? nf(c.oursLow) : `${nf(c.oursLow)}–${nf(c.oursHigh)}`;
  const far = c.gapPercent != null && Math.abs(c.gapPercent) > threshold;
  return (
    <span className="num">
      {ours} / {nf(c.official)}
      {c.gapPercent != null && <span className={`block text-[12px] ${far ? "font-bold" : "text-ink-2"}`}>{signed(c.gapPercent)}{far ? " ⚑" : ""}</span>}
    </span>
  );
}

export function RecipesCrosscheck() {
  const rows = file.rows as Row[];
  const flagged = rows.filter((r) => r.flagged).length;
  return (
    <>
      <p>
        Pour chaque plat de nos paires qui existe aussi comme plat composé dans Ciqual et Agribalyse, nous avons ramené notre recette (accompagnements
        compris, comme sur le site) à 100 g et à 1 kg, et l’avons comparée au plat moyen publié. Un écart de plus de {file.threshold} % (⚑) signale une
        recette à revoir : c’est le cas de {flagged} plats sur {rows.length}. Contrôle du {new Date(file.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Sel</strong> : nos recettes sont toujours moins salées, car elles ne comptent pas le sel ajouté en cuisine (aucune source ne donne la
          quantité pour chaque plat). L’oubli est le même des deux côtés : il ne change pas l’écart entre les plats, mais les valeurs de sel sont trop basses.
        </li>
        <li>
          <strong>Accompagnements</strong> : nos plats incluent souvent riz, pommes de terre ou salade verte, que le plat moyen n’a pas ; cela dilue les
          valeurs pour 100 g (énergie, protéines, CO₂e par kg).
        </li>
        <li>
          <strong>Viande</strong> : là où notre CO₂e par kg dépasse nettement celui du plat moyen (lasagnes, paëlla, couscous, saucisses aux lentilles),
          notre recette a sans doute plus de produits animaux, ou d’autres espèces, que le plat moyen : l’avantage de la version végétale pourrait y être
          surestimé. Là où il est nettement plus bas (bourguignon, blanquette, chili), il pourrait être sous-estimé. Nous n’avons pas encore vérifié la cause
          plat par plat : ces recettes sont les premières à revoir.
        </li>
        <li>
          <strong>Recettes officielles</strong> : les masses sont celles des ingrédients avant cuisson (recette Agribalyse 3.0), si bien que « pour 100 g »
          y veut dire « pour 100 g d’ingrédients » ; le plat fini, plus léger, a des valeurs pour 100 g plus élevées (hachis parmentier : 1,20 kg CO₂e pour
          100 g de plat fini publié, 0,95 pour 100 g d’ingrédients). La comparaison par portion n’en dépend pas.
        </li>
        <li>
          <strong>Versions végétales</strong> : Agribalyse n’a pas de version végétarienne de nos plats avec un remplaçant de la viande ; les lasagnes et la
          pizza aux légumes, sans remplaçant, ne donnent qu’une indication.
        </li>
      </ul>
      {/* Focusable scroll area on phones (WCAG: scrollable-region-focusable). */}
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tableau du contrôle croisé des recettes">
        <table className="w-full text-left text-sm lg:text-[13px] [&_td]:[overflow-wrap:anywhere]">
          <caption className="mb-1 text-left font-medium">Notre recette / plat moyen (écart)</caption>
          <thead>
            <tr className="border-b border-line align-bottom">
              <th className="py-1 pr-2">Notre plat</th>
              <th className="py-1 pr-2">Plat Agribalyse (code)</th>
              {COLUMNS.map(([id, label]) => (
                <th key={id} className="py-1 pr-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.slug}-${r.side}`} className="border-b border-line-soft align-top">
                <th scope="row" className="py-1 pr-2 font-semibold">
                  {r.dish}
                  {r.side === "vegetal" && " (version végétale)"}
                  <span className="block text-[12px] font-normal text-ink-2">{r.recipe === "officielle" ? "recette officielle" : "recette type"}</span>
                </th>
                <td className="py-1 pr-2">
                  {r.officialName} ({r.officialCode})
                </td>
                {COLUMNS.map(([id]) => (
                  <td key={id} className="py-1 pr-2">
                    <Value c={r.values[id]} threshold={file.threshold} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Sources : ADEME, AGRIBALYSE 3.2 (synthèse, changement climatique) ; ANSES, table Ciqual 2025 (énergie, protéines, lipides, sel). Une fourchette
        vient d’un ingrédient publié « &lt; x » ; l’écart est nul quand la valeur officielle est dans la fourchette. Calcul :{" "}
        <a href="https://github.com/VeganFlemme/veganizer/blob/main/pipeline/crosscheck.py" rel="noopener noreferrer">pipeline/crosscheck.py</a>.
      </p>
    </>
  );
}
