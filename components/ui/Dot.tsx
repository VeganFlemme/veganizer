export type Series = "animal" | "plant" | "plant-on-dark" | "neutral";

const COLOR: Record<Series, string> = {
  animal: "bg-animal",
  plant: "bg-plant",
  "plant-on-dark": "bg-plant-on-dark",
  neutral: "bg-line",
};

/** Series mark: the identity of a dish comes from the dot, never from the text colour. */
export function Dot({ series, size = 8, className = "" }: { series: Series; size?: number; className?: string }) {
  return <span aria-hidden="true" className={`inline-block flex-none rounded-full ${COLOR[series]} ${className}`} style={{ width: size, height: size }} />;
}
