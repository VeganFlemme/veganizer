import type { Metadata } from "next";
import Link from "next/link";
import { RecipeBuilderClient } from "@/components/recipe/RecipeBuilderClient";

export const metadata: Metadata = {
  title: "Analyse ta recette",
  description: "Saisissez les ingrédients de votre recette : nutrition, climat, animaux et coût, puis une version végétale ingrédient par ingrédient.",
};

export default function RecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <span className="self-start rounded-full border border-sky-800 bg-sky-50 px-3 py-0.5 text-sm font-medium text-sky-900">Ta recette</span>
        <h1 className="text-3xl font-bold leading-tight">Analyse ta recette</h1>
        <p className="text-zinc-800">
          Ajoutez vos ingrédients et leurs quantités : Veganizer calcule nutrition, climat, animaux et coût avec les mêmes bases publiques que
          les paires vérifiées, puis propose une version végétale ingrédient par ingrédient. Le calcul se fait dans votre navigateur, sans compte.
        </p>
        <p className="text-sm text-zinc-700">
          Résultat indicatif : la recette n’est pas relue par l’équipe. <Link href="/methodologie#ta-recette" className="underline">Méthode</Link>
        </p>
      </header>
      <RecipeBuilderClient />
    </main>
  );
}
