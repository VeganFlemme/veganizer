import { CONSTRUCTED_TEXT, type CategoryScoreView } from "@/lib/compare/scores";
import { ScorePill } from "./ScorePill";
import { WINNER_BG, WinnerBadge } from "./WinnerBadge";

/** Row inside a card: winner badge on the left, score pill on the right. */
export function WinnerRow({ score }: { score: CategoryScoreView }) {
  if (score.constructed) return <span className="rounded-btn bg-track px-3 py-[9px] text-[14px] font-extrabold">{CONSTRUCTED_TEXT}</span>;
  return (
    <span className={`flex items-center justify-between gap-2 rounded-btn px-3 py-[9px] lg:py-[6px] ${WINNER_BG[score.winner]}`}>
      <WinnerBadge winner={score.winner} provisional={score.provisional} />
      <ScorePill animal={score.animalPoints} vegetal={score.vegetalPoints} size="sm" />
    </span>
  );
}

/** Top of a detailed tab: "Vainqueur en …", score and the sentence it rests on (DESIGN.md, principle 3). */
export function CategoryBanner({ score, unitLabel }: { score: CategoryScoreView; unitLabel?: string }) {
  if (score.constructed)
    return (
      <div className="flex flex-col gap-2 rounded-panel bg-track p-4 md:p-5">
        <span className="text-[19px] font-extrabold md:text-[22px]">{CONSTRUCTED_TEXT}</span>
        <p className="m-0 text-[13px] leading-normal md:text-[14px]">{score.sentence}</p>
      </div>
    );
  return (
    <div className={`flex flex-col gap-3 rounded-panel p-4 md:p-5 ${WINNER_BG[score.winner]}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col gap-[3px]">
          <span className="text-[13px] text-ink-2 md:text-[14px]">
            Vainqueur en {score.label.toLowerCase()}
            {unitLabel ? `, ${unitLabel}` : ""}
          </span>
          <WinnerBadge winner={score.winner} provisional={score.provisional} size="lg" />
        </span>
        <span className="flex flex-col items-end gap-[3px]">
          <ScorePill animal={score.animalPoints} vegetal={score.vegetalPoints} size="lg" />
          <span className="text-[12px] text-ink-2">indicateurs gagnés</span>
        </span>
      </div>
      <p className="m-0 text-[13px] leading-normal text-ink md:text-[14px]">{score.sentence}</p>
    </div>
  );
}
