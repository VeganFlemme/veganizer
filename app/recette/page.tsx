import type { Metadata } from "next";
import Link from "next/link";
import { RecipeBuilderClient } from "@/components/recipe/RecipeBuilderClient";

export const metadata: Metadata = {
  title: "Analyser ma recette",
  description: "Saisis les ingrédients de ta recette : nutrition, santé, environnement, protection animale et économie, puis une version végétale ingrédient par ingrédient.",
  alternates: { canonical: "/recette" },
};

export default function RecipePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-8">
      <section className="on-dark bg-ink text-white">
        <div className="mx-auto flex max-w-[1440px] min-[1440px]:px-12 flex-col gap-4 px-5 pb-8 pt-2 md:px-8 md:pb-10 md:pt-6">
          <span className="self-start rounded-full bg-white/8 px-3 py-1 text-[13px] font-bold text-on-dark-1">Ta recette</span>
          <h1 className="m-0 text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[52px]">Analyser ma recette</h1>
          <p className="m-0 max-w-[720px] text-[16px] leading-normal text-on-dark-2">
            Ajoute tes ingrédients et leurs grammes : le site calcule les cinq catégories avec les mêmes bases publiques que les autres comparaisons, puis propose une
            version végétale ingrédient par ingrédient. Le calcul se fait dans ton navigateur, sans compte.
          </p>
          <p className="m-0 text-[14px] text-on-dark-3">
            Résultat indicatif : la recette n’est pas relue par l’équipe.{" "}
            <Link href="/methodologie#ta-recette" className="text-on-dark-1 underline hover:text-white">
              Méthode
            </Link>
          </p>
        </div>
      </section>
      <RecipeBuilderClient />
    </main>
  );
}
