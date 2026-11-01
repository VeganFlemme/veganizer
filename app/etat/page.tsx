import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "État de la base",
  description: "Vérification des droits de lecture publics sur la base Supabase.",
};

const CARBON_INDICATOR = "ghg_100y_kgco2e";
const CARBON_YEARS = [2025, 2050] as const;

const numberFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 6 });

function Value({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="italic text-ink-3">donnée manquante</span>;
  }
  return <>{numberFr.format(value)}</>;
}

async function DatabaseStatus() {
  // Always read live data: this page proves that public grants work.
  await connection();
  const supabase = await createClient();

  const [sources, indicators, carbon] = await Promise.all([
    supabase.from("sources").select("*", { count: "exact", head: true }),
    supabase.from("indicators").select("*", { count: "exact", head: true }),
    supabase
      .from("monetization_factors")
      .select("year, eur_per_unit, method, source_id")
      .eq("indicator_id", CARBON_INDICATOR)
      .in("year", [...CARBON_YEARS])
      .order("year"),
  ]);

  const errors = [
    ["sources", sources.error],
    ["indicators", indicators.error],
    ["monetization_factors", carbon.error],
  ].filter(([, error]) => error) as [string, { code?: string; message: string }][];

  return (
    <div className="flex flex-col gap-6">
      {errors.length > 0 && (
        <section className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Erreurs de lecture</h2>
          <ul className="mt-2 list-disc pl-5 font-mono text-sm">
            {errors.map(([table, error]) => (
              <li key={table}>
                {table} : {error.code ? `[${error.code}] ` : ""}
                {error.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="font-medium">Sources</dt>
        <dd data-testid="sources-count">
          <Value value={sources.error ? null : sources.count} />
        </dd>
        <dt className="font-medium">Indicateurs</dt>
        <dd data-testid="indicators-count">
          <Value value={indicators.error ? null : indicators.count} />
        </dd>
      </dl>

      <section>
        <h2 className="text-lg font-semibold">Valeur de l’action pour le climat</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {CARBON_YEARS.map((year) => {
            const row = carbon.data?.find((r) => r.year === year);
            return (
              <li key={year} data-testid={`carbon-${year}`}>
                {year} : <Value value={row?.eur_per_unit} /> € par kg de CO₂e
                {row && (
                  <span className="text-sm text-ink-3">
                    {" "}
                    ({row.method}, source <code>{row.source_id}</code>)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default function EtatPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">État de la base</h1>
      <p className="text-ink-2">
        Lecture en direct avec la clé publique : cette page vérifie que les
        droits de lecture publics fonctionnent.
      </p>
      <Suspense fallback={<p>Chargement…</p>}>
        <DatabaseStatus />
      </Suspense>
      <Link href="/" className="underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
