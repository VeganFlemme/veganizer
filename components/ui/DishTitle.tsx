import { Dot } from "./Dot";

/** On the dark band: animal dish (orange dot) above, plant alternative (green dot) below. */
export function DishTitle({ animal, vegetal, as: H = "h1" }: { animal: string; vegetal: string | null; as?: "h1" | "h2" }) {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <H className="m-0 flex items-center gap-[10px] text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] md:gap-[14px] md:text-[52px] md:leading-none md:tracking-[-0.04em]">
        <Dot series="animal" size={10} className="md:!h-[14px] md:!w-[14px]" />
        {animal}
      </H>
      {vegetal && (
        <p className="m-0 flex items-center gap-[10px] text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-on-dark-1 md:gap-[14px] md:text-[32px] md:leading-[1.1]">
          <Dot series="plant-on-dark" size={10} className="md:!h-[14px] md:!w-[14px]" />
          {vegetal}
        </p>
      )}
    </div>
  );
}
