import type { Metadata } from "next";
import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/compare/config";
import { PageHero, Prose, ProseSection } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  description: "Ce que Veganizer est et n’est pas, réutilisation des données, absence de conseil médical.",
  alternates: { canonical: "/conditions" },
};

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Conditions d’utilisation" />
      <Prose>
        <ProseSection id="objet" title="Objet">
          <p className="m-0">
            Veganizer compare des plats contenant des produits animaux et leur version végétale, à partir de bases de données publiques. Le site est gratuit, sans
            compte et sans publicité.
          </p>
        </ProseSection>
        <ProseSection id="medical" title="Pas de conseil médical">
          <p className="m-0">{MEDICAL_DISCLAIMER}</p>
        </ProseSection>
        <ProseSection id="fiabilite" title="Fiabilité des informations">
          <p className="m-0">
            Chaque chiffre vient d’une source citée, avec ses limites (fourchettes, couverture, qualité des données). Les résultats sont des estimations à fonction
            égale, pas des mesures de ton plat. Une donnée manquante est écrite comme telle, jamais remplacée par 0. Les recettes analysées dans « Analyser ma
            recette » ne sont pas relues. Si tu repères une erreur, <Link href="/a-propos#aider">signale-la</Link> : chaque signalement est relu.
          </p>
        </ProseSection>
        <ProseSection id="reutilisation" title="Réutilisation">
          <p className="m-0">
            Le code est sous licence MIT. Les données restent sous la licence de leur source (voir <Link href="/sources">Sources et licences</Link>) : en
            particulier, les bases dérivées d’Open Prices ou d’Open Food Facts doivent être partagées sous licence ODbL en citant la source, et les sources marquées
            « usage non commercial » ne peuvent pas être réutilisées commercialement.
          </p>
        </ProseSection>
        <ProseSection id="signalements" title="Signalements">
          <p className="m-0">
            N’écris pas de donnée personnelle ni de propos injurieux dans un signalement. Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </ProseSection>
      </Prose>
    </main>
  );
}
