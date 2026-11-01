import { MISSING } from "@/lib/format";

/** "donnée manquante", never 0 (CLAUDE.md, rule 1). */
export function MissingValue({ label = MISSING }: { label?: string }) {
  return <span className="italic text-ink-3">{label}</span>;
}
