import type { Metadata } from "next";
import Link from "next/link";
import { listSources } from "@/lib/compare/data";

export const metadata: Metadata = {
  title: "Sources et licences",
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Sources et licences</h1>
        <p className="text-zinc-800">
          Chaque chiffre affiché sur Veganizer est rattaché à l’une de ces sources. Nous indiquons la version utilisée, la licence et si un usage
          commercial est permis. Les bases sous licence ODbL (Open Food Facts, Open Prices) imposent de citer la source et de partager les bases
          dérivées sous la même licence.
        </p>
        <p className="text-sm text-zinc-700">
          Toutes les sources ne sont pas encore utilisées dans les comparaisons : voir la <Link href="/methodologie" className="underline">méthodologie</Link>.
        </p>
      </header>
      {sources.length === 0 ? (
        <p className="text-amber-800">Liste des sources : donnée manquante.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sources.map((s) => (
            <li key={s.id} id={s.id} className="scroll-mt-8 rounded-xl border border-zinc-300 p-4">
              <h2 className="text-lg font-semibold">
                {s.url ? (
                  <a href={s.url} className="underline" rel="noopener noreferrer">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </h2>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                {s.publisher && (
                  <>
                    <dt className="text-zinc-700">Éditeur</dt>
                    <dd>{s.publisher}</dd>
                  </>
                )}
                <dt className="text-zinc-700">Version</dt>
                <dd>{s.version ?? "non précisée"}</dd>
                <dt className="text-zinc-700">Licence</dt>
                <dd>{s.license}</dd>
                <dt className="text-zinc-700">Usage commercial</dt>
                <dd>
                  <Commercial value={s.commercial_use} />
                </dd>
                {s.share_alike && (
                  <>
                    <dt className="text-zinc-700">Partage à l’identique</dt>
                    <dd>oui : les bases dérivées doivent garder la même licence</dd>
                  </>
                )}
                {s.accessed_on && (
                  <>
                    <dt className="text-zinc-700">Consultée le</dt>
                    <dd>{dateFr.format(new Date(s.accessed_on))}</dd>
                  </>
                )}
                {s.notes && (
                  <>
                    <dt className="text-zinc-700">Remarque</dt>
                    <dd>{s.notes}</dd>
                  </>
                )}
                <dt className="text-zinc-700">Identifiant</dt>
                <dd className="font-mono">{s.id}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
