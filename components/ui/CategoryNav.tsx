import type { CategoryScoreView } from "@/lib/compare/scores";
import { ScorePill } from "./ScorePill";
import { Dot } from "./Dot";
import { WINNER_BG, WINNER_SERIES } from "./WinnerBadge";

// Short winner labels for the narrow column (the full label is in the tab itself).
const SHORT = { vegetal: "Végétal", animal: "Animal", egal: "Égalité", insuffisant: "Données insuff." } as const;

/**
 * Desktop (from 1 280 px): the categories as a left column, sticky while scrolling, with the score
 * and the winner of each (review of 2026-11-01). Same state and URL (?onglet=) as the tab bar,
 * which phones keep.
 */
export function CategoryNav<T extends string>({
  items,
  active,
  onChange,
  scores,
  className = "",
}: {
  items: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  scores: Partial<Record<string, CategoryScoreView>>;
  className?: string;
}) {
  return (
    <nav aria-label="Catégories de la comparaison" className={className}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((t) => {
          const on = t.id === active;
          const s = scores[t.id];
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => onChange(t.id)}
                className={`flex w-full cursor-pointer flex-col gap-1 rounded-card border px-3 py-[6px] text-left ${on ? "border-ink bg-surface shadow-card" : "border-transparent bg-transparent hover:bg-surface"}`}
              >
                <span className="text-[15px] font-extrabold leading-tight">{t.label}</span>
                {s?.constructed && <span className="rounded-[8px] bg-track px-2 py-[3px] text-[13px] font-bold">{s.constructedLabel ?? "Écarts comblés"}</span>}
                {s && !s.constructed && (
                  <span className={`flex items-center justify-between gap-2 rounded-[8px] px-2 py-[3px] ${WINNER_BG[s.winner]}`}>
                    <span className="inline-flex items-center gap-[6px] whitespace-nowrap text-[13px] font-extrabold">
                      <Dot series={WINNER_SERIES[s.winner]} />
                      <span>
                        {SHORT[s.winner]}
                        {s.provisional && s.winner !== "insuffisant" && <span className="font-medium text-ink-2">, prov.</span>}
                      </span>
                    </span>
                    <span className="flex-none">
                      <ScorePill animal={s.animalPoints} vegetal={s.vegetalPoints} size="sm" />
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
