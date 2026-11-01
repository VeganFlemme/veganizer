import { advantagesByCategory } from "@/lib/compare/config";
import type { AdvantageView, SideValue } from "@/lib/compare/view";
import { formatForUnit } from "@/lib/format";
import scoreRules from "@/data/score_rules.json";

const LABEL = new Map(scoreRules.categories.map((c) => [c.id, c.label]));

/** First sentence of an advice and the rest (« Lire la suite » on large screens). */
export function splitFirstSentence(text: string): [string, string] {
  const m = /^(.+?[.!?])\s+(?=[A-ZÀ-ÖØ-Ý«(])/.exec(text);
  return m ? [m[1], text.slice(m[0].length)] : [text, ""];
}

function Sources({ x }: { x: AdvantageView }) {
  if (!x.conseil) return null;
  return (
    <span className="text-[13px] text-animal-note">
      (
      {x.conseil.sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && " ; "}
          <a href={s.url} rel="noopener noreferrer" className="text-animal-note underline">
            {s.publisher}
            {s.pages ? `, ${s.pages}` : ""}
          </a>
        </span>
      ))}
      )
    </span>
  );
}

export const REMAINING_TITLE = "Ce qui reste à couvrir";

/** « 12,7 mg », a range « 0,8 à 2,1 g », or « donnée manquante » (never 0). */
function amount(x: SideValue | null | undefined, unit: string): string {
  if (!x) return "donnée manquante";
  const u = unit ? `\u00a0${unit}` : "";
  if (x.value != null) return `${formatForUnit(x.value, unit)}${u}`;
  if (x.low != null && x.high != null) return `${formatForUnit(x.low, unit)} à ${formatForUnit(x.high, unit)}${u}`;
  return "donnée manquante";
}

/** « Plat animal : 12,7 mg par portion ; version végétale : 5,3 mg. » (5 bis: both values, neutral). */
function Values({ x, per }: { x: AdvantageView; per: string }) {
  if (x.animal === undefined && x.vegetal === undefined) return null;
  const unit = x.unit ?? "";
  return (
    <span className="num">
      Plat animal : {amount(x.animal, unit)} {per} ; version végétale : {amount(x.vegetal, unit)}.{" "}
    </span>
  );
}

function Items({ items, collapsible, wide = false, per }: { items: AdvantageView[]; collapsible: boolean; wide?: boolean; per: string }) {
  return (
    <ul className={`m-0 flex list-none flex-col gap-3 p-0 ${wide ? "xl:grid xl:grid-cols-2 xl:gap-x-8" : ""}`}>
      {items.map((x) => {
        const [first, rest] = x.conseil ? splitFirstSentence(x.conseil.texte) : ["", ""];
        return (
          <li key={x.criterion} className="text-[14px] leading-normal">
            <strong>{x.name}.</strong>
            {x.partial && <span className="text-animal-note"> D’après des données partielles.</span>} <Values x={x} per={per} />
            {x.contributors && x.contributors.length > 0 && <span>Surtout : {x.contributors.join(" et ")}. </span>}
            {x.conseil && (
              <>
                {/* Full advice on phones; folded on its first sentence from 1 280 px when asked. */}
                <span className={collapsible && rest ? "xl:hidden" : ""}>
                  {x.conseil.texte} <Sources x={x} />
                </span>
                {collapsible && rest && (
                  <span className="hidden xl:inline">
                    {first}{" "}
                    <details className="inline [&[open]>summary]:hidden">
                      <summary className="inline cursor-pointer text-action underline">Lire la suite</summary>
                      <span>
                        {rest} <Sources x={x} />
                      </span>
                    </details>
                  </span>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** « plus = mieux » points to cover first; « moins = mieux » points apart, facts only (5 bis). */
function Split({ items, collapsible, per, wide = false }: { items: AdvantageView[]; collapsible: boolean; per: string; wide?: boolean }) {
  const cover = items.filter((x) => x.direction !== "down");
  const watch = items.filter((x) => x.direction === "down");
  return (
    <>
      {cover.length > 0 && <Items items={cover} collapsible={collapsible} per={per} wide={wide} />}
      {watch.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-[14px] font-bold">À surveiller (moins = mieux)</h3>
          <Items items={watch} collapsible={collapsible} per={per} wide={wide} />
        </div>
      )}
    </>
  );
}

/**
 * Rule 3: what the animal dish brings more of, in ONE category, with the two values and the sourced
 * solution (data/conseils.json); without a sourced advice, the facts only. Nothing to report: no box.
 */
export function AnimalBetterBox({ items, title = REMAINING_TITLE, collapsible = false, per = "par portion" }: { items: AdvantageView[]; title?: string; collapsible?: boolean; per?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-panel bg-win-animal p-5">
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      <Split items={items} collapsible={collapsible} per={per} />
    </section>
  );
}

/** Overview (and /aliment): every point, grouped by category. */
export function AnimalBetterSummary({ items, title = REMAINING_TITLE, collapsible = false, per = "par portion" }: { items: AdvantageView[]; title?: string; collapsible?: boolean; per?: string }) {
  const groups = advantagesByCategory(items);
  if (groups.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-panel bg-win-animal p-5">
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      {/* Desktop: two columns of groups, or the items of a single group in two columns. */}
      <div className={`flex flex-col gap-3 ${groups.length > 1 ? "xl:grid xl:grid-cols-2 xl:gap-x-8" : ""}`}>
        {groups.map((g) => (
          <div key={g.category} className="flex flex-col gap-2">
            <h3 className="m-0 text-[14px] font-bold">En {(LABEL.get(g.category) ?? g.category).toLowerCase()}</h3>
            <Split items={g.items} collapsible={collapsible} per={per} wide={groups.length === 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
