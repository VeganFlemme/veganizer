import { Segmented } from "./Segmented";

export type VariantId = "maison" | "commerce";
const LABEL: Record<VariantId, string> = { maison: "Fait maison", commerce: "Du commerce" };

/** "Fait maison" / "Du commerce": recomputes the whole page. */
export function VariantSwitch({ value, available, onChange }: { value: VariantId; available: VariantId[]; onChange: (v: VariantId) => void }) {
  if (available.length < 2) return null;
  return <Segmented tone="dark" label="Version de l’alternative végétale" options={available.map((id) => ({ id, label: LABEL[id] }))} value={value} onChange={onChange} />;
}
