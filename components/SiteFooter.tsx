import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/compare/config";

const LINKS = [
  { href: "/methodologie", label: "Méthodologie" },
  { href: "/sources", label: "Sources" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[10px] px-5 pb-8 pt-[22px] text-[13px] leading-normal text-ink-2 md:px-8 md:text-[14px]">
        <p className="m-0">
          <strong className="text-ink">Pas de conseil médical.</strong> {MEDICAL_DISCLAIMER}
        </p>
        <p className="m-0">Données publiques : Ciqual 2025 (ANSES), Agribalyse 3.2 (ADEME), FAOSTAT (FAO), CIRC, France Stratégie.</p>
        <nav aria-label="Pied de page" className="flex flex-wrap gap-x-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
