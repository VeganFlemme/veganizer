import type { ReactNode } from "react";
import { Dot } from "./Dot";

export interface DataTableRow {
  id: string;
  name: ReactNode;
  /** Already formatted (or <MissingValue />). */
  animal: ReactNode;
  vegetal: ReactNode;
  /** Note under the row: coverage < 95 %, advantage to the animal dish… */
  note?: ReactNode;
  /** Counted by the score: name in bold. */
  strong?: boolean;
  /** Desktop columns (from 1 440 px): gap in %, face-to-face bar, reliability, source. */
  gap?: ReactNode;
  bar?: ReactNode;
  reliability?: ReactNode;
  source?: ReactNode;
}

/**
 * Three columns on phones: indicator, animal dish, plant dish. From 1 440 px, with `rich`, four
 * more: gap, bar, reliability (coverage, DQR), source (review of 2026-11-01).
 */
export function DataTable({ caption, unitLabel, rows, footer, rich = false }: { caption: string; unitLabel: string; rows: DataTableRow[]; footer?: ReactNode; rich?: boolean }) {
  const x = "hidden min-[1440px]:table-cell";
  // A source repeated on every row is said once, under the table (review of 2026-11-01).
  const sources = new Set(rows.map((r) => (typeof r.source === "string" ? r.source : "")));
  const oneSource = rich && sources.size === 1 ? [...sources][0] : null;
  const showSource = rich && !oneSource;
  return (
    <div className="flex flex-col">
      <table className="w-full table-fixed border-collapse text-[14px] md:text-[15px] [&_.missing]:text-[12px] md:[&_.missing]:text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col />
          <col className={`w-[84px] md:w-[130px] ${rich ? "min-[1440px]:w-[96px]" : ""}`} />
          <col className={`w-[84px] md:w-[130px] ${rich ? "min-[1440px]:w-[96px]" : ""}`} />
          {rich && (
            <>
              <col className="hidden w-[78px] min-[1440px]:table-column" />
              <col className="hidden w-[96px] min-[1440px]:table-column" />
              <col className="hidden w-[96px] min-[1440px]:table-column" />
              {showSource && <col className="hidden w-[92px] min-[1440px]:table-column" />}
            </>
          )}
        </colgroup>
        <thead>
          <tr className="border-b border-line text-[12px] font-bold text-ink-2 md:text-[13px]">
            <th scope="col" className="py-[10px] pr-2 text-left font-bold">
              {unitLabel}
            </th>
            <th scope="col" className="py-[10px] pl-2 text-right font-bold">
              <span className="inline-flex items-center gap-[5px] whitespace-nowrap">
                <Dot series="animal" /> Plat animal
              </span>
            </th>
            <th scope="col" className="py-[10px] pl-2 text-right font-bold">
              <span className="inline-flex items-center gap-[5px] whitespace-nowrap">
                <Dot series="plant" /> Végétal
              </span>
            </th>
            {rich && (
              <>
                <th scope="col" className={`${x} py-[10px] pl-3 text-right font-bold`}>Écart</th>
                <th scope="col" className={`${x} py-[10px] pl-3 text-left font-bold`}>
                  <span className="sr-only">Barres face-à-face</span>
                </th>
                <th scope="col" className={`${x} py-[10px] pl-3 text-left font-bold`}>
                  Fiabilité
                </th>
                {showSource && <th scope="col" className={`${x} py-[10px] pl-3 text-left font-bold`}>Source</th>}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line-soft align-top">
              <th scope="row" className="py-[10px] pr-2 text-left font-normal xl:py-[6px]">
                <span className={r.strong ? "font-semibold" : ""}>{r.name}</span>
                {r.note && <span className="mt-[3px] block text-[12px] leading-snug text-animal-note">{r.note}</span>}
              </th>
              <td className="num py-[10px] pl-2 text-right xl:py-[6px]">{r.animal}</td>
              <td className="num py-[10px] pl-2 text-right xl:py-[6px]">{r.vegetal}</td>
              {rich && (
                <>
                  <td className={`${x} num py-[6px] pl-3 text-right`}>{r.gap}</td>
                  <td className={`${x} py-[6px] pl-3 pt-[12px]`}>{r.bar}</td>
                  <td className={`${x} py-[6px] pl-3 text-[12px] leading-snug text-ink-2`}>{r.reliability}</td>
                  {showSource && <td className={`${x} py-[6px] pl-3 text-[12px] leading-snug text-ink-2`}>{r.source}</td>}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {oneSource && oneSource !== "—" && <div className="hidden pt-2 text-[12px] text-ink-3 min-[1440px]:block">Source de toutes les lignes : {oneSource}.</div>}
      {footer && <div className="pt-3 text-[13px] leading-normal text-ink-3">{footer}</div>}
    </div>
  );
}
