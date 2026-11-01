import type { Basis } from "@/lib/scoring";
import { ChipGroup } from "./ChipGroup";

export const UNIT_OPTIONS: { id: Basis; label: string; long: string }[] = [
  { id: "perServing", label: "Portion", long: "Par portion" },
  { id: "per100kcal", label: "100 kcal", long: "Pour 100 kcal" },
  { id: "per10gProtein", label: "10 g prot.", long: "Pour 10 g de protéines" },
];

/** Per serving / per 100 kcal / per 10 g protein (CLAUDE.md, rule 4). Compact buttons. */
export function UnitSwitch({ value, onChange, servingLabel = "Portion" }: { value: Basis; onChange: (v: Basis) => void; servingLabel?: string }) {
  const options = UNIT_OPTIONS.map((u) => (u.id === "perServing" ? { id: u.id, label: servingLabel } : u));
  return <ChipGroup tone="light" label="Unité de comparaison" options={options} value={value} onChange={onChange} />;
}
