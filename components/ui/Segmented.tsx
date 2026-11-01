// Segmented buttons with aria-pressed (VariantSwitch on the dark band, UnitSwitch on light).
export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  tone: "dark" | "light";
}) {
  const box = tone === "dark" ? "rounded-select bg-white/8" : "rounded-btn bg-track";
  return (
    <div role="group" aria-label={label} className={`grid gap-1 p-1 ${box}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.id === value;
        const cls =
          tone === "dark"
            ? on
              ? "bg-surface text-ink"
              : "bg-transparent text-white hover:bg-white/10"
            : on
              ? "bg-surface text-ink"
              : "bg-transparent text-ink hover:bg-white/50";
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={`min-h-11 cursor-pointer rounded-[10px] border-0 px-3 text-[13px] font-bold md:px-5 md:text-[15px] ${tone === "dark" ? "text-[15px]" : ""} ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
