import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoPairView } from "@/components/compare/AutoPairView";
import { ErrorReport } from "@/components/ErrorReport";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { buildAutoPage } from "@/lib/compare/auto";
import { getAutoPair } from "@/lib/compare/auto-data";
import { listPairs } from "@/lib/compare/data";
import { recipeHref } from "@/lib/compare/recipe-link";
import { CLIMATE_MAIN } from "@/lib/compare/config";
import { publicLicense, signedGap } from "@/lib/format";

// Static pages, regenerated at most once a day (cacheLife revalidate = 86 400 s in lib/compare/data.ts:
// with Cache Components, `export const revalidate` is replaced by cacheLife). Unknown slugs are 404.
// The tab (?onglet=), the view (?vue=) and the protein (?proteine=) are read in the browser: the page
// stays static; the page of the closest protein is rendered on the server.

async function defaultModel(slug: string) {
  const pair = await getAutoPair(slug);
  const built = pair && buildAutoPage(pair.input, pair.defaultCode);
  return pair && built ? { pair, model: built.model } : null;
}

export async function generateStaticParams() {
  const pairs = await listPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await defaultModel(slug);
  if (!d) return {};
  const { model } = d;
  const v = model.variants[d.pair.defaultCode];
  const co2 = v?.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
  const verdict = v?.scores.verdict;
  const title = `${model.animal.name} face à sa version végétale`;
  const description =
    v && verdict
      ? `${model.animal.name} contre ${v.dish.name} : ${verdict.vegetalWins} catégories sur ${verdict.total} gagnées par la version végétale${
          co2?.reductionPercent != null ? `, ${signedGap(co2.reductionPercent)} de CO₂e par portion` : ""
        }. Nutrition, santé, environnement, protection animale, économie : chiffres sourcés.`
      : `${model.animal.name} et sa version végétale : les chiffres sourcés.`;
  return {
    title,
    description,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function ComparePage({ params }: PageProps<"/compare/[slug]">) {
  const { slug } = await params;
  const d = await defaultModel(slug);
  if (!d) notFound();
  const { model, pair } = d;
  const v = model.variants[pair.defaultCode];
  const recipe = pair.input.recipe;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${model.animal.name} face à sa version végétale`,
    inLanguage: "fr",
    isBasedOn: Object.values(model.sources).map((s) => ({ "@type": "Dataset", name: s.name, version: s.version ?? undefined, license: publicLicense(s.license) ?? undefined, url: s.url ?? undefined })),
    about: [{ "@type": "Recipe", name: model.animal.name }, ...(v ? [{ "@type": "Recipe", name: v.dish.name }] : [])],
  };

  return (
    <main className="flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <AutoPairView
        input={pair.input}
        defaultCode={pair.defaultCode}
        wins={pair.wins}
        badge={
          <>
            Comparaison automatique d’après Ciqual et Agribalyse ·{" "}
            <Link href="/methodologie#choix-proteine" className="text-on-dark-1 underline hover:text-white">
              Méthode
            </Link>{" "}
            ·{" "}
            {recipe.kind === "officielle" ? (
              <>
                recette officielle Agribalyse ({recipe.officialName}), à l’échelle de nos {model.animal.servings} portions
                {recipe.sidesNote ? `, accompagnement de notre recette type : ${recipe.sidesNote}` : ""}
              </>
            ) : (
              <>recette type rédigée par Veganizer, pour {model.animal.servings} portions</>
            )}{" "}
            ·{" "}
            <Link href={recipeHref(model.animal, (c) => pair.input.raw.foods.find((f) => f.code === c)?.factor_code)} className="text-on-dark-1 underline hover:text-white">
              Modifier cette recette
            </Link>
          </>
        }
      />
      <div id="signaler" className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-6 md:px-8 min-[1440px]:px-12 xl:pl-[256px] min-[1440px]:pl-[272px]">
        <ErrorReport page={`/compare/${slug}`} />
      </div>
      <SourcesFooter sources={Object.values(model.sources)} dataHref={`/compare/${slug}/donnees`} indent />
    </main>
  );
}
