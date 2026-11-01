import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorReport } from "@/components/ErrorReport";
import { FoodAlone } from "@/components/compare/FoodAlone";
import { PairView } from "@/components/compare/PairView";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { getFoodPage } from "@/lib/compare/data";

// Rendered on first request and cached one day (cacheLife in lib/compare/data.ts).
// A few codes are prerendered; every other code of the catalogue renders on demand.
export async function generateStaticParams() {
  return [{ code: "6255" }, { code: "22000" }, { code: "36005" }];
}

export async function generateMetadata({ params }: PageProps<"/aliment/[code]">): Promise<Metadata> {
  const { code } = await params;
  const page = await getFoodPage(code);
  if (!page) return {};
  return {
    title: `${page.food.name} : comparaison automatique`,
    description: `${page.food.name} comparé à des alternatives végétales du catalogue Ciqual / Agribalyse, pour 100 g : nutrition, santé, environnement, animaux, économie.`,
    alternates: { canonical: `/aliment/${code}` },
  };
}

/** Same mention on every comparison (decision of Matt, 17 h 25). */
const badge = (
  <>
    Comparaison automatique d’après Ciqual et Agribalyse, pour 100 g ·{" "}
    <Link href="/methodologie" className="text-on-dark-1 underline hover:text-white">
      Méthode
    </Link>
  </>
);

export default async function FoodPage({ params }: PageProps<"/aliment/[code]">) {
  const { code } = await params;
  const page = await getFoodPage(code);
  if (!page) notFound();
  const { pair, food } = page;

  return (
    <main className="flex flex-1 flex-col">
      {pair.choices.length > 0 ? <PairView model={pair} badge={badge} /> : <FoodAlone model={food} badge={badge} />}
      <div id="signaler" className={`mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-6 md:px-8 min-[1440px]:px-12 ${pair.choices.length > 0 ? "xl:pl-[256px] min-[1440px]:pl-[272px]" : ""}`}>
        <ErrorReport
          page={`/aliment/${food.code}`}
          title="Proposer une alternative ou signaler une erreur"
          intro="Tu connais une alternative végétale qui joue le même rôle ? Propose-la, ou signale une erreur : chaque message est relu."
          buttonLabel="Envoyer"
          defaultMessage={`Je propose une alternative pour « ${food.name} » (code ${food.code}) : `}
        />
      </div>
      <SourcesFooter sources={Object.values(pair.choices.length > 0 ? pair.sources : food.sources)} indent={pair.choices.length > 0} />
    </main>
  );
}
