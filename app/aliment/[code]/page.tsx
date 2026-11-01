import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorReport } from "@/components/ErrorReport";
import { FoodCompare } from "@/components/compare/FoodCompare";
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
    description: `${model.name} comparé à des alternatives végétales du catalogue Ciqual / Agribalyse, pour 100 g.`,
    alternates: { canonical: `/aliment/${code}` },
  };
}

export default async function FoodPage({ params }: PageProps<"/aliment/[code]">) {
  const { code } = await params;
  const model = await getFoodPage(code);
  if (!model) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label="Fil d’Ariane" className="text-sm">
        <Link href="/" className="underline">
          Accueil
        </Link>{" "}
        › {model.name}
      </nav>
      <header className="flex flex-col gap-2">
        <span className="self-start rounded-full border border-amber-800 bg-amber-50 px-3 py-0.5 text-sm font-medium text-amber-900">
          Comparaison simplifiée
        </span>
        <h1 className="text-3xl font-bold leading-tight">{model.name}</h1>
        <p className="text-sm text-zinc-700">
          Code Ciqual / Agribalyse {model.code}
          {model.foodSubgroup && <> · {model.foodSubgroup}</>}.{" "}
          {model.isAnimal
            ? "Comparaison automatique avec des aliments végétaux du catalogue, choisis selon des règles relues (même rôle dans le repas, protéines les plus proches). Ce n’est pas une recette vérifiée : les valeurs sont données pour 100 g."
            : "Aliment sans ingrédient animal identifié dans les bases Ciqual et Agribalyse (ce n’est pas une garantie : vérifiez la liste des ingrédients)."}{" "}
          <Link href="/methodologie#comparaison-simplifiee" className="underline">
            Méthode
          </Link>
        </p>
        {model.isAnimal && model.alternatives.length === 0 && (
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm">Pas encore d’alternative végétale proposée pour cet aliment.</p>
        )}
      </header>
      <FoodCompare model={model} />
      <ErrorReport
        page={`/aliment/${model.code}`}
        title="Proposer une paire vérifiée"
        intro="Vous connaissez une alternative végétale qui joue le même rôle ? Proposez-la, ou signalez une erreur : chaque message est relu."
        buttonLabel="Proposer une paire vérifiée"
        defaultMessage={`Je propose une paire vérifiée pour « ${model.name} » (code ${model.code}) : `}
      />
    </main>
  );
}
