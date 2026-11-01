import Link from "next/link";

const LINKS = [
  { href: "/recette", label: "Analyse ta recette" },
  { href: "/methodologie", label: "Méthodologie" },
  { href: "/sources", label: "Sources" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Aller au contenu
      </a>
      <nav aria-label="Navigation principale" className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          Veganizer
        </Link>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-zinc-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
