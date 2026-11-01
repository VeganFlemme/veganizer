import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi Veganizer existe, comment il est fait et comment nous aider à le rendre plus juste.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">À propos de Veganizer</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Pourquoi ce site</h2>
        <p>
          Beaucoup de personnes ont envie de manger plus végétal, mais se demandent ce que cela change vraiment : pour leur santé, pour le climat,
          pour les animaux, pour leur budget. Veganizer répond plat par plat, avec des chiffres issus de bases publiques et sans jugement.
        </p>
        <p>
          Nous montrons aussi les points où le plat animal fait mieux, avec une solution concrète et sourcée : c’est la condition pour que vous
          puissiez nous faire confiance.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Comment c’est fait</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Chaque recette est décrite ingrédient par ingrédient, en grammes, pour le même nombre de portions et le même rôle dans le repas.</li>
          <li>Les valeurs nutritionnelles viennent de la table Ciqual (ANSES), les impacts environnementaux d’Agribalyse (ADEME, INRAE).</li>
          <li>Quand une donnée manque, nous l’écrivons : jamais de zéro par défaut.</li>
          <li>Le code est ouvert et chaque chiffre est relié à sa source.</li>
        </ul>
        <p>
          Détails : <Link href="/methodologie" className="underline">méthodologie</Link> et <Link href="/sources" className="underline">sources</Link>.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Ce que Veganizer n’est pas</h2>
        <p>
          Ce n’est pas un conseil médical. Pour adapter votre alimentation, notamment pendant une grossesse, pour un enfant ou en cas de maladie,
          parlez-en à un professionnel de santé.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Nous aider</h2>
        <p>
          Un chiffre vous semble faux ? Utilisez le bouton « Signaler une erreur » en bas de chaque comparaison, ou ouvrez un ticket sur{" "}
          <a href="https://github.com/VeganFlemme/veganizer/issues" className="underline" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}
