import { MISSING } from "@/lib/format";

/**
 * "donnée manquante", never 0 (CLAUDE.md, rule 1). The short default label stays on one line from
 * 768 px (smaller in tables); narrow phone columns may wrap it.
 */
export function MissingValue({ label = MISSING }: { label?: string }) {
  return <span className={`missing italic text-ink-3 ${label === MISSING ? "md:whitespace-nowrap" : ""}`}>{label}</span>;
}
