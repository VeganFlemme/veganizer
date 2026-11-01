import Link from "next/link";
import { Logo } from "./Logo";
import { ShareButton } from "./ShareButton";

const LINKS = [
  { href: "/methodologie", label: "Méthodologie" },
  { href: "/sources", label: "Sources" },
  { href: "/recette", label: "Analyser ma recette" },
];

const SearchIcon = ({ color = "#FFFFFF" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

/** Dark band: logo, search, share (phone: 44 px icon buttons with aria-label). */
export function SiteHeader() {
  return (
    <header className="on-dark bg-ink text-white">
      <a href="#contenu" className="sr-only rounded-btn bg-surface px-3 py-2 text-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30">
        Aller au contenu
      </a>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-[14px] md:px-8 md:py-[18px]">
        <Link href="/" aria-label="Veganizer, accueil" className="text-white no-underline hover:text-white">
          <Logo />
        </Link>
        <form action="/" method="get" role="search" className="hidden h-[46px] max-w-[460px] flex-[1_1_320px] items-center gap-[10px] rounded-btn bg-white/8 px-[14px] md:flex">
          <SearchIcon color="#B9D9CF" />
          <label htmlFor="recherche-entete" className="sr-only">
            Rechercher un plat
          </label>
          <input
            id="recherche-entete"
            name="q"
            type="search"
            placeholder="Comparer un autre plat"
            className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[15px] text-white placeholder:text-on-dark-3 focus-visible:outline-none"
          />
        </form>
        <nav aria-label="Navigation principale" className="hidden gap-[22px] text-[15px] font-semibold md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-on-dark-1 no-underline hover:text-white hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-[6px] md:hidden">
          <Link href="/#recherche" aria-label="Rechercher un plat" className="flex h-11 w-11 items-center justify-center rounded-btn bg-white/8">
            <SearchIcon />
          </Link>
          <ShareButton />
          <details className="relative">
            <summary aria-label="Ouvrir le menu" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-btn bg-white/8 [&::-webkit-details-marker]:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </summary>
            <nav aria-label="Navigation principale" className="absolute right-0 top-[52px] z-30 flex w-60 flex-col rounded-panel bg-surface p-2 shadow-float">
              {[{ href: "/", label: "Accueil" }, ...LINKS, { href: "/a-propos", label: "À propos" }].map((l) => (
                <Link key={l.href} href={l.href} className="flex min-h-11 items-center rounded-btn px-3 text-[15px] font-semibold text-ink no-underline hover:bg-ground">
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
