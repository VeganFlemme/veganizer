import { advantagesByCategory } from "@/lib/compare/config";
import type { AdvantageView } from "@/lib/compare/view";
import scoreRules from "@/data/score_rules.json";

const LABEL = new Map(scoreRules.categories.map((c) => [c.id, c.label]));

function Items({ items }: { items: AdvantageView[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((x) => (
        <li key={x.criterion} className="text-[14px] leading-normal">
          <strong>{x.name}.</strong>
          {x.partial && (
            <span className="text-animal-note">
              {" "}
              D’après des données partielles.
            </span>
          )}{" "}
          {x.conseil ? (
            <>
              {x.conseil.texte}{" "}
              <span className="text-[13px] text-animal-note">
                (
                {x.conseil.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && " ; "}
                    <a
                      href={s.url}
                      rel="noopener noreferrer"
                      className="text-animal-note underline"
                    >
                      {s.publisher}
                      {s.pages ? `, ${s.pages}` : ""}
                    </a>
                  </span>
                ))}
                )
              </span>
            </>
          ) : (
            <span className="text-animal-note">
              Pas encore de conseil sourcé pour ce point.
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Rule 3: the points of ONE category where the animal dish does better, with the sourced solution
 * (data/conseils.json). Nothing to report: no box at all (no sentence repeated under every tab).
 */
export function AnimalBetterBox({
  items,
  title = "Là où le plat animal fait mieux",
}: {
  items: AdvantageView[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-panel bg-win-animal p-5"
    >
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      <Items items={items} />
    </section>
  );
}

/** Overview (and /aliment): every point where the animal dish does better, grouped by category. */
export function AnimalBetterSummary({
  items,
  title = "Là où le plat animal fait mieux",
}: {
  items: AdvantageView[];
  title?: string;
}) {
  const groups = advantagesByCategory(items);
  if (groups.length === 0) return null;
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-panel bg-win-animal p-5"
    >
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      {groups.map((g) => (
        <div key={g.category} className="flex flex-col gap-2">
          <h3 className="m-0 text-[14px] font-bold">
            En {(LABEL.get(g.category) ?? g.category).toLowerCase()}
          </h3>
          <Items items={g.items} />
        </div>
      ))}
    </section>
  );
}
