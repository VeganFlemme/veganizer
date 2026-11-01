import type { CategoryWinner } from "@/lib/scoring";
import { Dot, type Series } from "./Dot";

export const WINNER_LABEL: Record<CategoryWinner, string> = {
  vegetal: "Version végétale",
  animal: "Plat animal",
  egal: "Égalité",
  insuffisant: "Données insuffisantes",
};

export const WINNER_SERIES: Record<CategoryWinner, Series> = { vegetal: "plant", animal: "animal", egal: "neutral", insuffisant: "neutral" };
export const WINNER_BG: Record<CategoryWinner, string> = { vegetal: "bg-win-plant", animal: "bg-win-animal", egal: "bg-track", insuffisant: "bg-track" };

export function winnerText(winner: CategoryWinner, provisional: boolean): string {
  return `${WINNER_LABEL[winner]}${provisional && winner !== "insuffisant" ? ", provisoire" : ""}`;
}

/** Dot + winner of a category, with ", provisoire" when the indicators not counted could change the winner. */
export function WinnerBadge({ winner, provisional, size = "md" }: { winner: CategoryWinner; provisional: boolean; size?: "md" | "lg" }) {
  return (
    <span
      title={provisional && winner !== "insuffisant" ? "Provisoire : des indicateurs ne sont pas comptés faute de données, et ils pourraient changer le vainqueur." : undefined}
      className={`inline-flex items-baseline gap-[8px] font-extrabold ${size === "lg" ? "text-[19px] leading-tight tracking-[-0.01em] md:text-[24px]" : "text-[14px]"}`}
    >
      {/* Dot on the first line when the label wraps (« Version végétale, / provisoire »). */}
      <span className="inline-flex shrink-0 self-start items-center" style={{ height: "1lh" }}>
        <Dot series={WINNER_SERIES[winner]} size={size === "lg" ? 10 : 8} />
      </span>
      <span>{winnerText(winner, provisional)}</span>
    </span>
  );
}
