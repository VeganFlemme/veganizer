import scoreRules from "@/data/score_rules.json";

interface Src {
  publisher: string;
  title?: string;
  url?: string;
  date?: string;
  pages?: string;
  quote?: string;
  note?: string;
}

const DIRECTION = { lower_is_better: "moins = mieux", higher_is_better: "plus = mieux" } as const;

/** "Comment on désigne un vainqueur": method and rules read from data/score_rules.json. */
export function ScoreMethod() {
  const m = scoreRules.method;
  return (
    <div className="flex flex-col gap-3">
      <p>
        Chaque catégorie (nutrition, santé, environnement, protection animale, économie) a une liste d’indicateurs et, pour chacun, un
        sens : « moins = mieux » ou « plus = mieux ». Le score d’une catégorie compte les indicateurs où chaque plat fait mieux.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>{m.point}</li>
        <li>{m.missing}</li>
        <li>{m.winner}</li>
        <li>{m.provisional}</li>
        <li>{m.verdict}</li>
      </ul>
      <p className="text-sm">
        Version {scoreRules.version} du {scoreRules.date}. {scoreRules.status}
      </p>
      {scoreRules.categories.map((c) => (
        <details key={c.id} className="rounded-xl bg-surface px-4 py-3">
          <summary className="cursor-pointer font-semibold">
            {c.label} : {c.indicators.length} indicateur{c.indicators.length > 1 ? "s" : ""} comptés
          </summary>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {c.indicators.map((i) => {
              const s = i.source as Src;
              return (
                <li key={i.id}>
                  <strong>{i.label}</strong> ({DIRECTION[i.direction as keyof typeof DIRECTION]}). {i.justification}{" "}
                  <span className="text-ink-3">
                    Source :{" "}
                    {s.url ? (
                      <a href={s.url} className="underline" rel="noopener noreferrer">
                        {s.publisher}
                        {s.title ? `, « ${s.title} »` : ""}
                      </a>
                    ) : (
                      <>
                        {s.publisher}
                        {s.title ? `, « ${s.title} »` : ""}
                      </>
                    )}
                    {s.date ? `, ${s.date}` : ""}
                    {s.pages ? `, ${s.pages}` : ""}
                    {s.quote ? ` : « ${s.quote} »` : ""}
                    {s.note ? ` (${s.note})` : ""}.
                  </span>
                </li>
              );
            })}
          </ul>
          {c.displayedNotCounted.length > 0 && (
            <>
              <p className="mt-2 text-sm font-semibold">Affichés, non comptés</p>
              <ul className="list-disc pl-5 text-sm">
                {c.displayedNotCounted.map((x) => (
                  <li key={x.id}>{x.reason}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      ))}
    </div>
  );
}
