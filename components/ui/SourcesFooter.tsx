import Link from "next/link";
import { publicLicense } from "@/lib/format";
import type { SourceRow } from "@/lib/compare/view";

/** Sources of the page + Méthodologie, Signaler une erreur, Télécharger les données. */
export function SourcesFooter({ sources, reportHref = "#signaler", dataHref }: { sources: SourceRow[]; reportHref?: string; dataHref?: string }) {
  return (
    <footer className="mx-auto flex w-full max-w-[1200px] flex-col gap-[10px] px-5 pb-8 pt-2 text-[13px] leading-normal text-ink-2 md:px-8 md:text-[14px]">
      <h2 className="m-0 text-[13px] font-bold text-ink md:text-[14px]">Sources de cette page</h2>
      {sources.length === 0 ? (
        <p className="m-0">Aucune source utilisée.</p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {sources.map((s) => (
            <li key={s.id}>
              <Link href={`/sources#${s.id}`} className="underline">
                {s.name}
                {s.version ? ` ${s.version}` : ""}
              </Link>{" "}
              {(publicLicense(s.license) || s.commercial_use === false) && (
                <span className="text-ink-3">
                  ({[publicLicense(s.license), s.commercial_use === false ? "usage non commercial" : null].filter(Boolean).join(", ")})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Liens de la page" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/methodologie" className="inline-flex min-h-11 items-center">
          Méthodologie
        </Link>
        <a href={reportHref} className="inline-flex min-h-11 items-center">
          Signaler une erreur
        </a>
        {dataHref && (
          <a href={dataHref} className="inline-flex min-h-11 items-center" download>
            Télécharger les données
          </a>
        )}
      </nav>
    </footer>
  );
}
