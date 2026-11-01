import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareView } from "@/components/compare/CompareView";
import { ErrorReport } from "@/components/ErrorReport";
import { getPairPage, listPairs } from "@/lib/compare/data";
import { CLIMATE_MAIN } from "@/lib/compare/config";
import { gapSentence } from "@/lib/format";

// Static pages, regenerated at most once a day (cacheLife revalidate = 86 400 s in lib/compare/data.ts:
// with Cache Components, `export const revalidate` is replaced by cacheLife). Unknown slugs are 404.

export async function generateStaticParams() {
  const pairs = await listPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPairPage(slug);
  if (!model) return {};
  const maison = model.variants.maison;
  const co2 = maison?.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
  const description =
    maison && co2?.reductionPercent != null
      ? `${maison.dish.name} : ${gapSentence(co2.reductionPercent)} de CO₂e par portion que le plat d’origine (${model.animal.name}). Nutrition, climat, coût : les chiffres sourcés.`
      : `${model.animal.name} et son alternative végétale : les chiffres sourcés.`;
  return {
    title: `${model.animal.name} : et en version végétale ?`,
    description,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: { title: `${model.animal.name} : et en version végétale ?`, description },
  };
}

export default async function ComparePage({ params }: PageProps<"/compare/[slug]">) {
  const { slug } = await params;
  const model = await getPairPage(slug);
  if (!model) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label="Fil d’Ariane" className="text-sm">
        <Link href="/" className="underline">
          Accueil
        </Link>{" "}
        › {model.animal.name}
      </nav>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-tight">{model.animal.name} : et en version végétale ?</h1>
        {model.animal.description && <p className="text-zinc-800">{model.animal.description}</p>}
        <p className="text-sm text-zinc-700">
          Recettes pour {model.animal.servings} portions, à fonction égale (même rôle dans le repas). Chiffres calculés ingrédient par
          ingrédient : <Link href="/methodologie" className="underline">méthode</Link>.
        </p>
      </header>
      <CompareView model={model} />
      <ErrorReport page={`/compare/${slug}`} />
    </main>
  );
}
