import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose, ProseSection } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "À propos",
  description: "Pourquoi Veganizer existe, comment il est fait et comment nous aider à le rendre plus juste.",
  alternates: { canonical: "/a-propos" },
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="À propos de Veganizer" />
      <Prose>
        <ProseSection id="pourquoi" title="Pourquoi ce site">
          <p className="m-0">
            Beaucoup de personnes ont envie de manger plus végétal, mais se demandent ce que cela change vraiment : pour leur santé, pour le climat, pour les
            animaux, pour leur budget. Veganizer répond plat par plat, avec des chiffres issus de bases publiques et sans jugement.
          </p>
          <p className="m-0">
            Nous montrons aussi « ce qui reste à couvrir » : tout ce que le plat animal apporte de plus, avec les valeurs des deux plats et une solution
            sourcée. C’est la condition pour que tu puisses nous faire confiance.
          </p>
        </ProseSection>
        <ProseSection id="comment" title="Comment c’est fait">
          <ul className="m-0 list-disc space-y-1 pl-5">
            <li>Chaque recette est décrite ingrédient par ingrédient, en grammes, pour le même nombre de portions et le même rôle dans le repas.</li>
            <li>Les valeurs nutritionnelles viennent de la table Ciqual (ANSES), les impacts environnementaux d’Agribalyse (ADEME, INRAE).</li>
            <li>Quand une donnée manque, nous l’écrivons : jamais de zéro par défaut.</li>
            <li>Le code est ouvert et chaque chiffre est relié à sa source.</li>
            <li>
              Relu par des vérifications automatisées et des agents IA indépendants ; pas encore relu par un professionnel de santé. Le 1er novembre 2026, 80
              valeurs tirées au hasard (nutriments, impacts, plats recalculés) étaient identiques aux fichiers officiels.
            </li>
          </ul>
          <p className="m-0">
            Détails : <Link href="/methodologie">méthodologie</Link> et <Link href="/sources">sources</Link>.
          </p>
        </ProseSection>
        <ProseSection id="pas" title="Ce que Veganizer n’est pas">
          <p className="m-0">
            Ce n’est pas un conseil médical. Pour adapter ton alimentation, notamment pendant une grossesse, pour un enfant ou en cas de maladie, parles-en à un
            professionnel de santé.
          </p>
        </ProseSection>
        <ProseSection id="aider" title="Nous aider">
          <p className="m-0">
            Un chiffre te semble faux ? Utilise le bouton « Signaler une erreur » en bas de chaque comparaison, ou ouvre un ticket sur{" "}
            <a href="https://github.com/VeganFlemme/veganizer/issues" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </ProseSection>
      </Prose>
    </main>
  );
}
