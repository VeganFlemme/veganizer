import { Dot } from "./Dot";

/** ● a – v ●: indicators won by the animal dish (left) and the plant dish (right). */
export function ScorePill({ animal, vegetal, size = "md" }: { animal: number; vegetal: number; size?: "sm" | "md" | "lg" }) {
  const text = { sm: "text-[15px]", md: "text-[16px]", lg: "text-[22px] md:text-[30px]" }[size];
  const dot = size === "lg" ? 9 : 7;
  return (
    <span role="img" aria-label={`Indicateurs gagnés : plat animal ${animal}, version végétale ${vegetal}`} className={`num inline-flex items-center gap-[6px] font-extrabold ${text}`}>
      <Dot series="animal" size={dot} />
      <span aria-hidden="true">
        {animal}
        <span className="px-[3px] font-medium text-ink-3">–</span>
        {vegetal}
      </span>
      <Dot series="plant" size={dot} />
    </span>
  );
}
