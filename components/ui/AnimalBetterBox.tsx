import type { AdvantageView } from "@/lib/compare/view";

/** Rule 3: every point where the animal dish does better, with the sourced solution (data/conseils.json). */
export function AnimalBetterBox({ items, title = "Là où le plat animal fait mieux", none = "Sur les indicateurs affichés, le plat animal ne fait mieux sur aucun point." }: { items: AdvantageView[]; title?: string; none?: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-panel bg-win-animal p-5">
      <h2 className="m-0 text-[16px] font-extrabold md:text-[17px]">{title}</h2>
      {items.length === 0 ? (
        <p className="m-0 text-[14px] leading-normal">{none}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((x) => (
            <li key={x.criterion} className="text-[14px] leading-normal">
              <strong>{x.name}.</strong>
              {x.partial && <span className="text-animal-note"> D’après des données partielles.</span>}{" "}
              {x.conseil ? (
                <>
                  {x.conseil.texte}{" "}
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
                </>
              ) : (
                <span className="text-animal-note">Pas encore de conseil sourcé pour ce point.</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
