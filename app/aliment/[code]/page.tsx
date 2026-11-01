import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorReport } from "@/components/ErrorReport";
import { FoodAlone } from "@/components/compare/FoodAlone";
import { AutoPairView } from "@/components/compare/AutoPairView";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { buildAutoPage } from "@/lib/compare/auto";
import { getAutoFood } from "@/lib/compare/auto-data";
import { getFoodPage } from "@/lib/compare/data";

// Rendered on first request and cached one day (cacheLife in lib/compare/data.ts).
// A few codes are prerendered; every other code of the catalogue renders on demand.
export async function generateStaticParams() {
  return [{ code: "6255" }, { code: "22000" }, { code: "36005" }];
}

export async function generateMetadata({ params }: PageProps<"/aliment/[code]">): Promise<Metadata> {
  const { code } = await params;
  const auto = await getAutoFood(code);
  const name = auto ? auto.input.raw.animal.name_fr : (await getFoodPage(code))?.food.name;
  if (!name) return {};
  return {
    title: `${name} : comparaison automatique`,
    description: `${name} comparé aux protéines végétales du catalogue Ciqual / Agribalyse, pour 100 g : nutrition, santé, environnement, animaux, économie.`,
    alternates: { canonical: `/aliment/${code}` },
  };
}

/** Same mention on every comparison (decision of Matt, 17 h 25). */
function badge(official: string | null) {
  return (
    <>
      Comparaison automatique d’après Ciqual et Agribalyse, pour 100 g ·{" "}
      <Link href="/methodologie#choix-proteine" className="text-on-dark-1 underline hover:text-white">
        Méthode
      </Link>
      {official ? <> · recette officielle Agribalyse ({official})</> : null}
    </>
  );
}

export default async function FoodPage({ params }: PageProps<"/aliment/[code]">) {
  const { code } = await params;
  // Animal food or AGRIBALYSE dish with a retained official recipe: the visitor chooses the protein.
  const auto = await getAutoFood(code);
  const built = auto && buildAutoPage(auto.input, auto.defaultCode);
  const page = built ? null : await getFoodPage(code);
  if (!built && !page) notFound();
  const name = built ? built.model.animal.name : page!.food.name;
  const sources = built ? Object.values(built.model.sources) : Object.values(page!.food.sources);

  return (
    <main className="flex flex-1 flex-col">
      {built && auto ? (
        <AutoPairView input={auto.input} defaultCode={auto.defaultCode} wins={auto.wins} badge={badge(auto.input.recipe.kind === "officielle" ? (auto.input.recipe.officialName ?? null) : null)} />
      ) : (
        <FoodAlone model={page!.food} badge={badge(null)} />
      )}
      <div id="signaler" className={`mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-6 md:px-8 min-[1440px]:px-12 ${built ? "xl:pl-[256px] min-[1440px]:pl-[272px]" : ""}`}>
        <ErrorReport
          page={`/aliment/${code}`}
          title="Signaler une erreur"
          intro="Un chiffre te semble faux, ou une protéine manque à la liste ? Écris-nous : chaque message est relu."
          buttonLabel="Envoyer"
          defaultMessage={`À propos de « ${name} » (code ${code}) : `}
        />
      </div>
      <SourcesFooter sources={sources} indent={!!built} />
    </main>
  );
}
