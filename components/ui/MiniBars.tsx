// Face-to-face bars in a table cell (desktop): animal to the left, plant to the right of the axis,
// same scale for the two values of the row. A missing value draws no bar.
export function MiniBars({ animal, vegetal }: { animal: number | null; vegetal: number | null }) {
  const max = Math.max(Math.abs(animal ?? 0), Math.abs(vegetal ?? 0));
  const w = (x: number | null) => (x == null || max === 0 ? 0 : (Math.abs(x) / max) * 100);
  return (
    <span aria-hidden="true" className="grid w-full grid-cols-2 items-center gap-[2px]">
      <span className="flex h-[10px] justify-end">
        <span className="h-full rounded-l-[4px] bg-animal" style={{ width: `${w(animal)}%` }} />
      </span>
      <span className="flex h-[10px]">
        <span className="h-full rounded-r-[4px] bg-plant" style={{ width: `${w(vegetal)}%` }} />
      </span>
    </span>
  );
}
