import { advantagesByCategory } from "@/lib/compare/config";
import type { AdvantageView } from "@/lib/compare/view";
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

function Items({ items, collapsible, wide = false }: { items: AdvantageView[]; collapsible: boolean; wide?: boolean }) {
  return (
    <ul className={`m-0 flex list-none flex-col gap-3 p-0 ${wide ? "xl:grid xl:grid-cols-2 xl:gap-x-8" : ""}`}>
      {items.map((x) => {
        const [first, rest] = x.conseil ? splitFirstSentence(x.conseil.texte) : ["", ""];
        return (
          <li key={x.criterion} className="text-[14px] leading-normal">
            <strong>{x.name}.</strong>
            {x.partial && <span className="text-animal-note"> D’après des données partielles.</span>}{" "}
            {x.conseil ? (
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
            ) : (
              <span className="text-animal-note">Pas encore de conseil sourcé pour ce point.</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Rule 3: the points of ONE category where the animal dish does better, with the sourced solution
 * (data/conseils.json). Nothing to report: no box at all (no sentence repeated under every tab).
 */
export function AnimalBetterBox({ items, title = "Là où le plat animal fait mieux", collapsible = false }: { items: AdvantageView[]; title?: string; collapsible?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-panel bg-win-animal p-5">
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      <Items items={items} collapsible={collapsible} />
    </section>
  );
}

/** Overview (and /aliment): every point where the animal dish does better, grouped by category. */
export function AnimalBetterSummary({ items, title = "Là où le plat animal fait mieux", collapsible = false }: { items: AdvantageView[]; title?: string; collapsible?: boolean }) {
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
            <Items items={g.items} collapsible={collapsible} wide={groups.length === 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
