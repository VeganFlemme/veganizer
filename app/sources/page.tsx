import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { listSources } from "@/lib/compare/data";
import { publicLicense } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sources et licences",
  alternates: { canonical: "/sources" },
  description: "Toutes les sources de données de Veganizer, avec leur version, leur licence et leurs conditions de réutilisation.",
};

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

// Unknown licence or commercial use: nothing is shown (follow-up in docs/A_VERIFIER.md and public.sources).
function Commercial({ value }: { value: boolean }) {
  return value ? <>autorisé</> : <strong>non autorisé (usage non commercial)</strong>;
}

export default async function SourcesPage() {
  const sources = await listSources();
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Sources et licences">
        <p className="m-0">
          Chaque chiffre affiché sur Veganizer est rattaché à l’une de ces sources. Nous indiquons la version utilisée et, quand elles sont connues, la licence et les
          conditions d’usage commercial. Les bases sous licence ODbL (Open Food Facts, Open Prices) imposent de citer la source et de partager les bases dérivées sous la même licence.
        </p>
        <p className="m-0 text-[14px] text-on-dark-3">
          Toutes les sources ne sont pas encore utilisées dans les comparaisons : voir la <Link href="/methodologie">méthodologie</Link>.
        </p>
      </PageHero>
      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-8 md:py-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10 min-[1440px]:px-12">
      {sources.length > 0 && (
        <nav aria-label="Liste des sources" className="hidden rounded-panel bg-surface p-4 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <h2 className="m-0 mb-2 text-[17px] font-extrabold">Sommaire</h2>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14px]">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {sources.length === 0 ? (
        <p className="m-0 italic text-ink-3">Liste des sources : donnée manquante.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 min-[1920px]:grid-cols-3">
          {sources.map((s) => (
            <li key={s.id} id={s.id} className="scroll-mt-20 rounded-panel bg-surface p-5">
              <h2 className="m-0 text-[17px] font-extrabold">
                {s.url ? (
                  <a href={s.url} rel="noopener noreferrer">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-[14px] sm:grid-cols-[max-content_1fr]">
                {s.publisher && (
                  <>
                    <dt className="text-ink-2">Éditeur</dt>
                    <dd>{s.publisher}</dd>
                  </>
                )}
                <dt className="text-ink-2">Version</dt>
                <dd>{s.version ?? "non précisée"}</dd>
                {publicLicense(s.license) && (
                  <>
                    <dt className="text-ink-2">Licence</dt>
                    <dd>{publicLicense(s.license)}</dd>
                  </>
                )}
                {s.commercial_use != null && (
                  <>
                    <dt className="text-ink-2">Usage commercial</dt>
                    <dd>
                      <Commercial value={s.commercial_use} />
                    </dd>
                  </>
                )}
                {s.share_alike && (
                  <>
                    <dt className="text-ink-2">Partage à l’identique</dt>
                    <dd>oui : les bases dérivées doivent garder la même licence</dd>
                  </>
                )}
                {s.accessed_on && (
                  <>
                    <dt className="text-ink-2">Consultée le</dt>
                    <dd>{dateFr.format(new Date(s.accessed_on))}</dd>
                  </>
                )}
                {s.notes && (
                  <>
                    <dt className="text-ink-2">Remarque</dt>
                    <dd>{s.notes}</dd>
                  </>
                )}
                <dt className="text-ink-2">Identifiant</dt>
                <dd className="break-all">{s.id}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
      </div>
    </main>
  );
}
