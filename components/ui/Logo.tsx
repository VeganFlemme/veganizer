// Logo: a circle cut vertically, left half "animal", right half "plant", 2 px apart (DESIGN.md § 3).
export const LOGO_PATHS = { animal: "M13 1.04A13 13 0 0 0 13 26.96z", plant: "M15 1.04A13 13 0 0 1 15 26.96z" };

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path d={LOGO_PATHS.animal} fill="#D9662B" />
      <path d={LOGO_PATHS.plant} fill="#0E8A74" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-[9px]">
      <LogoMark size={size} />
      <span className="text-[21px] font-extrabold leading-none tracking-[-0.03em] md:text-[23px]">veganizer</span>
    </span>
  );
}
