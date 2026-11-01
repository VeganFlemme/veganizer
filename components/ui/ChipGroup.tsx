// Compact choice buttons as wide as their text (alternatives, views): review of 2026-11-01,
// replaces the stretched segmented control for these choices.
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
  wrap = false,
  caption,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  tone: "dark" | "light";
  /** Long labels (food names) may wrap inside their button instead of overflowing on phones. */
  wrap?: boolean;
  /** Small visible label before the buttons (« Alternative », « Version »). */
  caption?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-[6px]">
      {caption && (
        <span aria-hidden="true" className={`mr-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${tone === "dark" ? "text-on-dark-3" : "text-ink-2"}`}>
          {caption}
        </span>
      )}
      {options.map((o) => {
        const on = o.id === value;
        const cls =
          tone === "dark"
            ? on
              ? "border-surface bg-surface text-ink"
              : "border-white/30 bg-transparent text-white hover:border-white/60"
            : on
              ? "border-ink bg-ink text-white"
              : "border-[#C9D5D0] bg-surface text-ink hover:border-ink-3";
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={`min-h-11 max-w-full cursor-pointer rounded-full border px-[14px] text-[14px] font-bold lg:min-h-9 lg:px-3 lg:text-[13px] ${wrap ? "text-left" : "whitespace-nowrap"} ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
