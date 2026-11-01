import type { ReactNode } from "react";
import type { CategoryScoreView } from "@/lib/compare/scores";
import { WinnerRow } from "./CategoryBanner";

/** Whole card is a button that opens the tab of the category. */
export function CategoryCard({
  score,
  title,
  onOpen,
  controls,
  children,
}: {
  score: CategoryScoreView;
  title: string;
  onOpen: () => void;
  controls?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-controls={controls}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-card bg-surface p-[18px] text-left text-ink shadow-card hover:ring-1 hover:ring-line md:rounded-panel md:p-[22px]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[17px] font-extrabold tracking-[-0.01em] md:text-[19px]">{title}</span>
        <span className="text-[14px] font-semibold text-action">Tout voir</span>
      </span>
      <WinnerRow score={score} />
      {children}
      <span className="text-[13px] leading-normal text-ink-2">{score.summary}</span>
    </button>
  );
}
