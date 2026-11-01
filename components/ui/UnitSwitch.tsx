import type { Basis } from "@/lib/scoring";
import { ChipGroup } from "./ChipGroup";

export const UNIT_OPTIONS: { id: Basis; label: string; long: string }[] = [
  { id: "perServing", label: "Portion", long: "Par portion" },
  { id: "per100g", label: "100 g", long: "Pour 100 g" },
];

/** Per serving / per 100 g (CLAUDE.md, rule 4; step 3 quinquies). Compact buttons. */
export function UnitSwitch({ value, onChange, servingLabel = "Portion" }: { value: Basis; onChange: (v: Basis) => void; servingLabel?: string }) {
  const options = UNIT_OPTIONS.map((u) => (u.id === "perServing" ? { id: u.id, label: servingLabel } : u));
  return <ChipGroup tone="light" label="Unité de comparaison" options={options} value={value} onChange={onChange} />;
}
