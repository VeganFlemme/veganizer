import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Page introuvable">
        <p className="m-0">Ce plat n’existe pas (ou pas encore) sur Veganizer.</p>
      </PageHero>
      <Prose>
        <p className="m-0">
          <Link href="/">Voir les plats comparés</Link> ou <Link href="/recette">analyser ta propre recette</Link>.
        </p>
      </Prose>
    </main>
  );
}
