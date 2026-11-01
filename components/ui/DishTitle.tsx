import { Dot } from "./Dot";

/**
 * Size of the dish name on large screens, from its length (review of 2026-11-01): a long name is
 * smaller instead of wrapping on two lines with a lone word. Phone sizes unchanged.
 */
export function titleSizeClass(name: string): string {
  if (name.length > 48) return "md:text-[34px]";
  if (name.length > 30) return "md:text-[40px]";
  return "md:text-[52px]";
}

export function subtitleSizeClass(name: string): string {
  return name.length > 48 ? "md:text-[24px]" : "md:text-[32px]";
}

/** On the dark band: animal dish (orange dot) above, plant alternative (green dot) below. */
export function DishTitle({ animal, vegetal, as: H = "h1" }: { animal: string; vegetal: string | null; as?: "h1" | "h2" }) {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <H
        className={`m-0 flex items-start gap-[10px] text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] [text-wrap:balance] md:gap-[14px] md:leading-[1.02] md:tracking-[-0.04em] ${titleSizeClass(animal)}`}
      >
        {/* Dot aligned on the first line, whatever the number of lines. */}
        <Dot series="animal" size={10} className="mt-[0.42em] md:!h-[14px] md:!w-[14px] md:mt-[0.36em]" />
        <span>{animal}</span>
      </H>
      {vegetal && (
        <p
          className={`m-0 flex items-start gap-[10px] text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-on-dark-1 [text-wrap:balance] md:gap-[14px] md:leading-[1.1] ${subtitleSizeClass(vegetal)}`}
        >
          <Dot series="plant-on-dark" size={10} className="mt-[0.45em] md:!h-[14px] md:!w-[14px] md:mt-[0.4em]" />
          <span>{vegetal}</span>
        </p>
      )}
    </div>
  );
}
