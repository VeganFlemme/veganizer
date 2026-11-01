import type { Metadata } from "next";
import { PageHero, Prose, ProseSection } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Veganizer traite : signalements d’erreur, recettes, absence de traceur.",
  alternates: { canonical: "/confidentialite" },
};

// Publisher, contact and retention given by Matt (2026-11-01).
const CONTROLLER = "VeganFlemme, éditeur du site";
const CONTACT = "veganflemme@gmail.com";
const REPORT_RETENTION = "12 mois";

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Politique de confidentialité">
        <p className="m-0">Veganizer collecte le moins de données possible : pas de compte, pas de publicité, pas de mesure d’audience.</p>
      </PageHero>
      <Prose>
        <ProseSection id="responsable" title="Responsable du traitement">
          <p className="m-0">
            {CONTROLLER} (contact : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>). Pour exercer tes droits (accès, rectification, effacement, opposition), écris à :{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Tu peux aussi saisir la CNIL
            (
            <a href="https://www.cnil.fr" rel="noopener noreferrer">
              cnil.fr
            </a>
            ).
          </p>
        </ProseSection>
        <ProseSection id="signalements" title="Signalements d’erreur">
          <p className="m-0">
            Le formulaire « Signaler une erreur » enregistre trois choses : la page concernée, ton message et la date d’envoi. Aucun nom, aucune adresse e-mail ni
            adresse IP n’est enregistré par Veganizer ; le formulaire demande de ne pas écrire de donnée personnelle dans le message. Ces messages servent
            uniquement à corriger le site et ne sont lisibles que par l’équipe. Durée de conservation : {REPORT_RETENTION}. La suppression est
            automatique : chaque nuit, une tâche planifiée de la base de données (extension pg_cron de Supabase) efface les signalements de plus de 12 mois.
          </p>
          <p className="m-0">Base légale : intérêt légitime (fiabilité des informations publiées).</p>
        </ProseSection>
        <ProseSection id="recettes" title="Recettes analysées (« Analyser ma recette »)">
          <p className="m-0">
            Les ingrédients que tu saisis sont gardés dans ton navigateur (stockage local) pour que tu retrouves ta recette ; ils ne sont pas enregistrés par
            Veganizer. Pour le calcul, le navigateur demande au site les données publiques des aliments choisis (leurs codes Ciqual), sans nom ni quantité. Le
            bouton « Tout effacer » supprime la recette de ton navigateur.
          </p>
          <p className="m-0">
            Comptes utilisateurs : aucun pour l’instant (pas de connexion par e-mail). Cette page sera mise à jour avant leur ouverture (Supabase Auth).
          </p>
        </ProseSection>
        <ProseSection id="cookies" title="Cookies et traceurs">
          <p className="m-0">
            Veganizer ne dépose aucun cookie publicitaire ni de mesure d’audience : c’est pourquoi aucun bandeau de consentement n’est affiché. La police de
            caractères est servie par le site lui-même (pas d’appel à Google Fonts).
          </p>
        </ProseSection>
        <ProseSection id="hebergeurs" title="Hébergeurs">
          <p className="m-0">
            Le site est hébergé par Vercel Inc. (États-Unis) et la base de données par Supabase (serveurs à Francfort). Comme tout hébergeur, ils peuvent conserver
            des journaux techniques (dont l’adresse IP) pour faire fonctionner et sécuriser le service, selon leurs propres politiques :{" "}
            <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer">
              Vercel
            </a>
            ,{" "}
            <a href="https://supabase.com/privacy" rel="noopener noreferrer">
              Supabase
            </a>
            .
          </p>
        </ProseSection>
      </Prose>
    </main>
  );
}
