import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorReport } from "@/components/ErrorReport";
import { FoodCompare } from "@/components/compare/FoodCompare";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { getFoodPage } from "@/lib/compare/data";

// Rendered on first request and cached one day (cacheLife in lib/compare/data.ts).
// A few codes are prerendered; every other code of the catalogue renders on demand.
export async function generateStaticParams() {
  return [{ code: "6255" }, { code: "22000" }, { code: "36005" }];
}

export async function generateMetadata({ params }: PageProps<"/aliment/[code]">): Promise<Metadata> {
  const { code } = await params;
  const model = await getFoodPage(code);
  if (!model) return {};
  return {
    title: `${model.name} : comparaison simplifiée`,
    description: `${model.name} comparé à des alternatives végétales du catalogue Ciqual / Agribalyse : nutrition, environnement, animaux, pour 100 g.`,
    alternates: { canonical: `/aliment/${code}` },
  };
}

export default async function FoodPage({ params }: PageProps<"/aliment/[code]">) {
  const { code } = await params;
  const model = await getFoodPage(code);
  if (!model) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <FoodCompare model={model} />
      <div id="signaler" className="mx-auto w-full max-w-[1200px] scroll-mt-20 px-5 pb-6 md:px-8">
        <ErrorReport
          page={`/aliment/${model.code}`}
          title="Proposer une paire vérifiée"
          intro="Tu connais une alternative végétale qui joue le même rôle ? Propose-la, ou signale une erreur : chaque message est relu."
          buttonLabel="Proposer une paire vérifiée"
          defaultMessage={`Je propose une paire vérifiée pour « ${model.name} » (code ${model.code}) : `}
        />
      </div>
      <SourcesFooter sources={Object.values(model.sources)} />
    </main>
  );
}
