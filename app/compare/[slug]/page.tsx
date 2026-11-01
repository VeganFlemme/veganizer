import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PairView } from "@/components/compare/PairView";
import { ErrorReport } from "@/components/ErrorReport";
import { SourcesFooter } from "@/components/ui/SourcesFooter";
import { getPairPage, listPairs } from "@/lib/compare/data";
import { CLIMATE_MAIN } from "@/lib/compare/config";
import { publicLicense, signedGap } from "@/lib/format";

// Static pages, regenerated at most once a day (cacheLife revalidate = 86 400 s in lib/compare/data.ts:
// with Cache Components, `export const revalidate` is replaced by cacheLife). Unknown slugs are 404.
// The tab (?onglet=) is read in the browser: the page stays static.

export async function generateStaticParams() {
  const pairs = await listPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPairPage(slug);
  if (!model) return {};
  const v = model.variants.maison ?? model.variants.commerce;
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
  const model = await getPairPage(slug);
  if (!model) notFound();
  const v = model.variants.maison ?? model.variants.commerce;
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
      <PairView model={model} badge={`Paire vérifiée, recette pour ${model.animal.servings} portions`} />
      <div id="signaler" className="mx-auto w-full max-w-[1200px] scroll-mt-20 px-5 pb-6 md:px-8">
        <ErrorReport page={`/compare/${slug}`} />
      </div>
      <SourcesFooter sources={Object.values(model.sources)} dataHref={`/compare/${slug}/donnees`} />
    </main>
  );
}
