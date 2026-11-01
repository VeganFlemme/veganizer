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
}

/** Three columns: indicator, animal dish, plant dish. Header with the series dots. */
export function DataTable({ caption, unitLabel, rows, footer }: { caption: string; unitLabel: string; rows: DataTableRow[]; footer?: ReactNode }) {
  return (
    <div className="flex flex-col">
      <table className="w-full table-fixed border-collapse text-[14px] md:text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col />
          <col className="w-[84px] md:w-[130px]" />
          <col className="w-[84px] md:w-[130px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-[12px] font-bold text-ink-2 md:text-[13px]">
            <th scope="col" className="py-[10px] pr-2 text-left font-bold">
              {unitLabel}
            </th>
            <th scope="col" className="py-[10px] pl-2 text-right font-bold">
              <span className="inline-flex items-center gap-[5px]">
                <Dot series="animal" /> Plat animal
              </span>
            </th>
            <th scope="col" className="py-[10px] pl-2 text-right font-bold">
              <span className="inline-flex items-center gap-[5px]">
                <Dot series="plant" /> Végétal
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line-soft align-top">
              <th scope="row" className="py-[10px] pr-2 text-left font-normal">
                <span className={r.strong ? "font-semibold" : ""}>{r.name}</span>
                {r.note && <span className="mt-[3px] block text-[12px] leading-snug text-animal-note">{r.note}</span>}
              </th>
              <td className="num break-words py-[10px] pl-2 text-right">{r.animal}</td>
              <td className="num break-words py-[10px] pl-2 text-right">{r.vegetal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {footer && <div className="pt-3 text-[13px] leading-normal text-ink-3">{footer}</div>}
    </div>
  );
}
