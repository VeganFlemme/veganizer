import type { ReactNode } from "react";
import { MissingValue } from "./MissingValue";

export interface FaceToFaceRow {
  id: string;
  label: ReactNode;
  /** Right-hand note on the label line, e.g. the gap "−87 %". */
  aside?: ReactNode;
  animal: number | null;
  vegetal: number | null;
  /** Text shown at the outer ends (formatted value with unit). */
  format: (x: number) => string;
}

const HEIGHT = { sm: "h-2", md: "h-[10px]", lg: "h-[18px]" } as const;

/**
 * Two bars from a central axis (2 px gap), animal on the left, plant on the right, values at the
 * outer ends. Each row has its own scale unless sameScale. No bar for a missing or negative value.
 */
export function FaceToFaceBar({ rows, sameScale = false, thickness = "md", valueWidth = "52px" }: { rows: FaceToFaceRow[]; sameScale?: boolean; thickness?: keyof typeof HEIGHT; valueWidth?: string }) {
  const pos = (x: number | null) => (x != null && x > 0 ? x : 0);
  const globalMax = Math.max(0, ...rows.flatMap((r) => [pos(r.animal), pos(r.vegetal)]));
  return (
    <div className="flex flex-col">
      {rows.map((r) => {
        const max = sameScale ? globalMax : Math.max(pos(r.animal), pos(r.vegetal));
        const w = (x: number | null) => (max > 0 ? `${(pos(x) / max) * 100}%` : "0%");
        return (
          <div key={r.id} className="flex flex-col gap-[6px] border-t border-line-soft py-[10px] first:border-t-0 first:pt-0">
            {(r.label || r.aside) && (
              <span className="flex justify-between gap-2 text-[14px]">
                <span className="font-semibold">{r.label}</span>
                {r.aside && <span className="num text-ink-2">{r.aside}</span>}
              </span>
            )}
            <span className="num grid items-center gap-[2px] text-[13px] md:text-[14px]" style={{ gridTemplateColumns: `minmax(${valueWidth}, auto) minmax(0, 1fr) minmax(0, 1fr) minmax(${valueWidth}, auto)` }}>
              <span className="pr-[6px] text-right">{r.animal == null ? <MissingValue /> : r.format(r.animal)}</span>
              <span className="flex justify-end" aria-hidden="true">
                <span className={`${HEIGHT[thickness]} rounded-l-[4px] bg-animal`} style={{ width: w(r.animal) }} />
              </span>
              <span className="flex" aria-hidden="true">
                <span className={`${HEIGHT[thickness]} rounded-r-[4px] bg-plant`} style={{ width: w(r.vegetal) }} />
              </span>
              <span className="pl-[6px]">{r.vegetal == null ? <MissingValue /> : r.format(r.vegetal)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
