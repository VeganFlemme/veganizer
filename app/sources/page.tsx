import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { listSources } from "@/lib/compare/data";

export const metadata: Metadata = {
  title: "Sources et licences",
  alternates: { canonical: "/sources" },
  description: "Toutes les sources de données de Veganizer, avec leur version, leur licence et leurs conditions de réutilisation.",
};

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function Commercial({ value }: { value: boolean | null }) {
  if (value === true) return <>autorisé</>;
  if (value === false) return <strong>non autorisé (usage non commercial)</strong>;
  return <>à vérifier</>;
}

export default async function SourcesPage() {
  const sources = await listSources();
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Sources et licences">
        <p className="m-0">
          Chaque chiffre affiché sur Veganizer est rattaché à l’une de ces sources. Nous indiquons la version utilisée, la licence et si un usage commercial est
          permis. Les bases sous licence ODbL (Open Food Facts, Open Prices) imposent de citer la source et de partager les bases dérivées sous la même licence.
        </p>
        <p className="m-0 text-[14px] text-on-dark-3">
          Toutes les sources ne sont pas encore utilisées dans les comparaisons : voir la <Link href="/methodologie">méthodologie</Link>.
        </p>
      </PageHero>
      <div className="mx-auto w-full max-w-[1200px] px-5 py-6 md:px-8 md:py-8">
      {sources.length === 0 ? (
        <p className="m-0 italic text-ink-3">Liste des sources : donnée manquante.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
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
                <dt className="text-ink-2">Licence</dt>
                <dd>{s.license}</dd>
                <dt className="text-ink-2">Usage commercial</dt>
                <dd>
                  <Commercial value={s.commercial_use} />
                </dd>
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
