import type { ReactNode } from "react";

/**
 * Winner of a table row (suite V1, step 4, point 0): the better value in bold with « ✓ », in the
 * colour of the dish that wins (the ✓ and the bold carry the information, the colour only helps).
 * Only for an established verdict (ranges not overlapping): ties, overlaps and partial data get none.
 */
export function WinnerValue({ side, winner, children }: { side: "animal" | "vegetal"; winner: "animal" | "vegetal" | "egal" | null | undefined; children: ReactNode }) {
  if (winner !== side) return <>{children}</>;
  return (
    // The ✓ may go on its own line in a narrow cell (the value keeps its own wrapping rules).
    <strong className={`font-extrabold whitespace-normal ${side === "animal" ? "text-animal-note" : "text-action"}`}>
      <span aria-hidden="true">✓ </span>
      {children}
      <span className="sr-only"> (meilleure valeur)</span>
    </strong>
  );
}

/** « ↑ plus = mieux » / « ↓ moins = mieux » under the name of an indicator; nothing without a direction. */
export function DirectionHint({ direction }: { direction: "up" | "down" | "none" | null | undefined }) {
  if (direction !== "up" && direction !== "down") return null;
  return <span className="block text-[11px] font-normal leading-snug text-ink-3">{direction === "up" ? "↑ plus = mieux" : "↓ moins = mieux"}</span>;
}
