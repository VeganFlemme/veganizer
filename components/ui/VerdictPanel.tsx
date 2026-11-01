import type { VerdictView } from "@/lib/compare/scores";
import { Dot } from "./Dot";
import { WINNER_LABEL } from "./WinnerBadge";

const SEGMENT: Record<string, string> = { vegetal: "bg-plant", animal: "bg-animal", egal: "bg-line", insuffisant: "bg-line" };

/** "X sur 5" + sentence + five segments (winner colour, grey for a tie or missing data) + legend + method. */
export function VerdictPanel({ verdict, base, className = "" }: { verdict: VerdictView; base?: VerdictView; className?: string }) {
  return (
    <section aria-label="Verdict" className={`flex animate-verdict flex-col gap-[14px] rounded-verdict bg-surface p-5 text-ink shadow-float md:p-6 lg:gap-[10px] lg:p-4 ${className}`}>
      <span className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-[15px] font-bold text-ink-2">Verdict</span>
        <span className="text-[13px] text-ink-3">Chiffres : indicateurs gagnés, plat animal – version végétale</span>
      </span>
      <p className="m-0 flex flex-wrap items-baseline gap-x-[14px] gap-y-2 lg:flex-nowrap lg:items-center">
        <span className="text-[58px] font-extrabold leading-[0.9] tracking-[-0.05em] md:text-[64px] lg:text-[48px] lg:whitespace-nowrap">
          {verdict.vegetalWins} sur {verdict.total}
        </span>
        <span className="max-w-[420px] text-[16px] leading-[1.4] md:text-[17px] lg:text-[15px] lg:leading-snug">{verdict.sentence}</span>
      </p>
      {base && (
        // Step 3 quinquies, point 4: the score follows the adjustment; the base recipe stays in view.
        <p className="m-0 rounded-btn bg-track px-3 py-2 text-[14px] font-semibold">
          Recette de base : {base.vegetalWins} sur {base.total} → ta version ajustée : {verdict.vegetalWins} sur {verdict.total}
        </p>
      )}
      <ol className="m-0 grid list-none grid-cols-5 gap-1 p-0 md:gap-[6px] lg:[&_li]:gap-[3px]">
        {verdict.categories.map((c) => (
          <li key={c.id} className="flex min-w-0 flex-col gap-[6px]">
            <span aria-hidden="true" className={`h-[10px] rounded-[4px] ${SEGMENT[c.winner]}`} />
            <span className="text-[11px] font-semibold leading-tight md:text-[13px] lg:text-[12px] lg:[hyphens:auto]">{c.short}</span>
            <span className="num text-[11px] text-ink-2 md:text-[13px]" aria-hidden="true">
              {c.constructed ? (c.constructedLabel?.includes("sauf") ? "comblé, sauf…" : "comblé") : `${c.animalPoints} – ${c.vegetalPoints}`}
            </span>
            <span className="sr-only">
              {c.constructed
                ? `${c.label} : ${(c.constructedLabel ?? "écarts comblés").toLowerCase()} par construction, non comptée.`
                : `${c.label} : ${WINNER_LABEL[c.winner]}, ${c.animalPoints} indicateur(s) pour le plat animal, ${c.vegetalPoints} pour la version végétale.`}
            </span>
          </li>
        ))}
      </ol>
      <span className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px] lg:text-[12px] lg:gap-x-3">
        <span className="inline-flex items-center gap-[6px]">
          <Dot series="plant" /> Végétal gagne
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <Dot series="animal" /> Plat animal gagne
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <Dot series="neutral" /> Égalité ou données insuffisantes
        </span>
      </span>
      <span className="border-t border-line-soft pt-[10px] text-[12px] leading-normal text-ink-3 lg:pt-2">
        {verdict.notes.length > 0 ? verdict.notes.join(" ") : "Score d’une catégorie : nombre d’indicateurs où chaque plat fait mieux. Une donnée manquante n’est jamais comptée."}
      </span>
    </section>
  );
}
