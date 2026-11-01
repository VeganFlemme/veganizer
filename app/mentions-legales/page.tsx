import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose, ProseSection } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergement et propriété intellectuelle de Veganizer.",
  alternates: { canonical: "/mentions-legales" },
};

// Publisher, contact and director of publication given by Matt (2026-11-01). No personal address:
// non-professional publisher, article 1-1, II of the LCEN (loi n° 2004-575, version in force since
// 2024-05-23): the host's name and address are shown instead (docs/JOURNAL.md). Nothing is invented here.
const PUBLISHER = "VeganFlemme";
const CONTACT = "veganflemme@gmail.com";

export default function LegalPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Mentions légales" />
      <Prose>
        <ProseSection id="editeur" title="Éditeur du site">
          <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
            <dt className="font-semibold">Éditeur</dt>
            <dd className="m-0">{PUBLISHER}</dd>
            <dt className="font-semibold">Adresse</dt>
            <dd className="m-0">
              Éditeur à titre non professionnel : conformément à l’article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie
              numérique, son adresse n’est pas publiée ; ses éléments d’identification ont été communiqués à l’hébergeur du site, dont le nom et l’adresse
              figurent ci-dessous.
            </dd>
            <dt className="font-semibold">Contact</dt>
            <dd className="m-0">
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
            </dd>
            <dt className="font-semibold">Directeur de la publication</dt>
            <dd className="m-0">{PUBLISHER}</dd>
          </dl>
          <p className="m-0">Veganizer est un projet non commercial.</p>
        </ProseSection>
        <ProseSection id="hebergement" title="Hébergement">
          <p className="m-0">
            Site : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis, contact : privacy@vercel.com (
            <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer">
              vercel.com
            </a>
            ).
          </p>
          <p className="m-0">
            Base de données : Supabase Pte. Ltd. (
            <a href="https://supabase.com/privacy" rel="noopener noreferrer">
              supabase.com
            </a>
            , contact : privacy@supabase.com), serveurs situés à Francfort (Allemagne).
          </p>
        </ProseSection>
        <ProseSection id="propriete" title="Propriété intellectuelle et données">
          <p className="m-0">
            Le code du site est publié sous licence MIT sur{" "}
            <a href="https://github.com/VeganFlemme/veganizer" rel="noopener noreferrer">
              GitHub
            </a>
            . Les données affichées viennent de bases publiques, chacune avec sa licence (Licence Ouverte, ODbL, CC BY…) : voir la page{" "}
            <Link href="/sources">Sources et licences</Link>. Les prix issus d’Open Prices restent sous licence ODbL.
          </p>
        </ProseSection>
        <ProseSection id="sante" title="Pas de conseil médical">
          <p className="m-0">
            Les informations de Veganizer sont générales et ne remplacent pas l’avis d’un professionnel de santé (médecin, diététicien·ne). Voir aussi les{" "}
            <Link href="/conditions">conditions d’utilisation</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </ProseSection>
      </Prose>
    </main>
  );
}
