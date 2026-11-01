import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMethodologyStats, type MethodologyStats } from "@/lib/methodology/data";

export const metadata: Metadata = {
  title: "Méthodologie — Veganizer",
  description:
    "Comment Veganizer calcule ses comparaisons : formule, sources, hypothèses, valeurs négatives et données manquantes.",
};

// Methodology threshold (not a data value): coverage below this triggers a warning.
const COVERAGE_WARNING = 0.95;

const integerFr = new Intl.NumberFormat("fr-FR");
const percentFr = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

function Missing() {
  return <span className="text-amber-700">donnée manquante</span>;
}

function Count({ value }: { value: number | null }) {
  return value === null ? <Missing /> : <>{integerFr.format(value)}</>;
}

function Percent({ value }: { value: number | null }) {
  return value === null ? <Missing /> : <>{percentFr.format(value)}</>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const valueFr = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 4 });

function AnimalFactors({ stats }: { stats: MethodologyStats }) {
  if (stats.animalFactors.length === 0) return <p>Facteurs : <Missing />.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="mb-1 text-left font-medium">Facteurs utilisés (lus dans la base)</caption>
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="py-1 pr-2">Indicateur</th>
            <th className="py-1 pr-2">Catégorie</th>
            <th className="py-1 pr-2">Valeur</th>
            <th className="py-1">Base, source et remarques</th>
          </tr>
        </thead>
        <tbody>
          {stats.animalFactors.map((f) => (
            <tr key={`${f.indicator}-${f.category}-${f.sourceId}`} className="border-b border-zinc-200 align-top">
              <td className="py-1 pr-2">{f.indicator}</td>
              <td className="py-1 pr-2">{f.category}</td>
              <td className="py-1 pr-2">{valueFr.format(f.value)}</td>
              <td className="py-1 text-xs text-zinc-700">
                {f.unitBasis} — <Link href={`/sources#${f.sourceId}`} className="underline">{f.sourceId}</Link>
                {f.notes ? `. ${f.notes}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm leading-relaxed">
      {children}
    </p>
  );
}

const SECTIONS = [
  ["principe", "Le principe : comparer à fonction égale"],
  ["paires", "Les paires de plats : maison et du commerce"],
  ["formule", "La formule de calcul"],
  ["cout-climat", "Le coût climat"],
  ["animaux", "Animaux : une estimation basse"],
  ["sante-circ", "Santé : le classement du CIRC"],
  ["prix", "Prix : quand nous les affichons"],
  ["sources", "Les sources"],
  ["hypotheses", "Catégories animales et hypothèses par défaut"],
  ["aucun-ingredient-animal", "« Aucun ingrédient animal identifié »"],
  ["valeurs-negatives", "Pourquoi certaines valeurs sont négatives"],
  ["donnees-manquantes", "Pourquoi il manque des données, et pourquoi jamais 0"],
  ["sante", "Santé : pas de conseil médical"],
] as const;

function Sources({ stats }: { stats: MethodologyStats }) {
  return (
    <Section id="sources" title="Les sources">
      <p>
        Les comparaisons reposent sur des bases publiques de référence. Chaque valeur affichée est
        rattachée à sa source, avec sa version et sa licence.
      </p>
      {stats.sources.length === 0 ? (
        <p>
          Liste des sources : <Missing />.
        </p>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {stats.sources.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong>
              {s.publisher && <> ({s.publisher})</>}
              {s.version && <>, version {s.version}</>} — licence : {s.license}.
            </li>
          ))}
        </ul>
      )}
      <p>
        Aujourd’hui : <Count value={stats.ciqualFoods} /> aliments décrits par Ciqual (composition
        nutritionnelle pour 100 g) et <Count value={stats.agribalyseProducts} /> produits décrits par
        Agribalyse (impacts environnementaux par kg de produit). Les deux bases partagent le même code
        aliment, ce qui permet de les relier.
      </p>
      <p>
        Agribalyse distingue parfois plusieurs <em>variantes</em> d’un même aliment : de saison ou hors
        saison, importé par bateau ou par avion, d’origine France… Dans nos recettes, nous utilisons la
        variante qui correspond au cas réel. Une variante reprend la composition nutritionnelle de
        l’aliment Ciqual seulement s’il s’agit du même aliment, dans le même état (une poudre
        réhydratée n’a pas la composition de la poudre sèche).
      </p>
      <p>
        <Link href="/sources" className="underline">
          Voir la liste complète des sources, leurs versions et leurs licences
        </Link>
        .
      </p>
    </Section>
  );
}

function Hypotheses({ stats }: { stats: MethodologyStats }) {
  return (
    <Section id="hypotheses" title="Catégories animales et hypothèses par défaut">
      <p>
        Chaque aliment d’origine animale est rattaché à une catégorie d’animal (bovin, poule pondeuse,
        vache laitière, saumon d’élevage, poisson sauvage…). Ces catégories serviront à estimer les
        impacts sur les animaux, qui diffèrent beaucoup d’une espèce et d’un mode d’élevage à l’autre.
        Au total, <Count value={stats.animalFoods} /> aliments sont identifiés comme contenant des
        produits animaux.
      </p>
      <p>
        Quand le nom de l’aliment ne précise pas l’espèce ou l’origine, nous appliquons les hypothèses
        suivantes. Elles sont signalées aliment par aliment dans nos données :
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Saumon sans origine précisée</strong> : considéré comme saumon d’élevage. Le saumon
          explicitement sauvage (ou du Pacifique) est classé « poisson sauvage ».
        </li>
        <li>
          <strong>Crevettes sans origine précisée</strong> : considérées comme crevettes d’élevage. Les
          crevettes grises, nordiques ou indiquées sauvages sont classées « crevette sauvage ».
        </li>
        <li>
          <strong>Foie gras sans espèce précisée</strong> : considéré comme foie gras de canard.
        </li>
        <li>
          <strong>Viande de « poule »</strong> : il s’agit de poules pondeuses de réforme, c’est-à-dire
          abattues en fin de carrière de ponte. Elles sont rattachées à la catégorie « poule pondeuse ».
        </li>
        <li>
          <strong>Pangas et tilapia</strong> : considérés comme poissons d’élevage.
        </li>
        <li>
          <strong>Autres poissons sans origine précisée</strong> alors que l’espèce est souvent élevée
          (bar, dorade royale, turbot, anguille, truite…) : classés « poisson d’origine inconnue »
          plutôt que de trancher arbitrairement entre élevage et pêche.
        </li>
      </ul>
      <p>
        Les <strong>plats composés</strong> (quiche, poisson pané, gâteau…) sont signalés comme
        contenant des produits animaux, mais sans catégorie : on ne connaît pas la part de leur masse
        qui est d’origine animale (<Count value={stats.mixedFoods} /> aliments sont dans ce cas). C’est
        pourquoi les recettes comparées sur Veganizer sont décrites ingrédient par ingrédient.
      </p>
    </Section>
  );
}

function Negatives({ stats }: { stats: MethodologyStats }) {
  return (
    <Section id="valeurs-negatives" title="Pourquoi certaines valeurs sont négatives">
      <p>Agribalyse publie, pour certains produits, des valeurs inférieures à zéro :</p>
      <ul className="list-disc space-y-1 pl-5">
        {stats.negatives.map((n) => (
          <li key={n.id}>
            {n.name}
            {n.unit && <> ({n.unit})</>} : <Count value={n.negatives} /> produits.
          </li>
        ))}
      </ul>
      <p>
        Une valeur négative signifie que la méthode de calcul attribue au produit un effet net
        favorable sur cet indicateur. Pour les émissions liées au <em>changement d’affectation des
        sols</em>, il s’agit d’un stockage de carbone dans les sols ou la végétation plutôt que d’un
        déstockage. L’<em>utilisation des sols</em>, elle, n’est pas une surface : c’est un indice de
        qualité des sols (méthode européenne EF 3.1), qui peut être négatif lorsque la méthode estime
        que le produit améliore cet indice.
      </p>
      <p>
        Nous affichons ces valeurs <strong>telles que publiées</strong>, sans les ramener à zéro : les
        modifier reviendrait à changer la source et fausserait les totaux. Le total d’un plat peut donc
        être inférieur à la somme de ses ingrédients dont la valeur est positive. Pour le détail des
        calculs, voir la{" "}
        <a href="https://doc.agribalyse.fr" className="underline" rel="noopener" target="_blank">
          documentation officielle d’Agribalyse
        </a>
        .
      </p>
    </Section>
  );
}

function MissingData({ stats }: { stats: MethodologyStats }) {
  const b12 = stats.nutrients.find((n) => n.id === "vit_b12_ug");
  return (
    <Section id="donnees-manquantes" title="Pourquoi il manque des données, et pourquoi jamais 0">
      <p>
        La table Ciqual rassemble des résultats d’analyses en laboratoire. Tous les constituants n’ont
        pas été mesurés pour tous les aliments, et certains le sont beaucoup moins souvent que
        d’autres (voir le tableau). Par exemple, la vitamine B12 n’a pas de valeur chiffrée pour{" "}
        <Percent value={b12?.missingShare ?? null} /> des aliments Ciqual.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-zinc-600">
            Part des aliments Ciqual sans valeur chiffrée (sur <Count value={stats.ciqualFoods} />{" "}
            aliments)
          </caption>
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-2 pr-4 font-medium">Nutriment</th>
              <th className="py-2 font-medium">Sans valeur chiffrée</th>
            </tr>
          </thead>
          <tbody>
            {stats.nutrients.map((n) => (
              <tr key={n.id} className="border-b border-zinc-100">
                <td className="py-2 pr-4">{n.name}</td>
                <td className="py-2">
                  <Percent value={n.missingShare} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Ciqual distingue trois situations, que nous respectons :</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Valeur non disponible</strong> (« - » dans Ciqual) : nous affichons « donnée
          manquante ».
        </li>
        <li>
          <strong>« traces »</strong> : le constituant est présent en quantité trop faible pour être
          chiffrée ; nous affichons « traces ».
        </li>
        <li>
          <strong>« &lt; x »</strong> : la teneur est inférieure au seuil que l’analyse peut mesurer ;
          nous affichons « inférieur à x ».
        </li>
      </ul>
      <p>
        <strong>Pourquoi jamais 0 à la place ?</strong> Écrire 0, c’est affirmer que l’aliment n’en
        contient pas, alors que personne ne l’a mesuré. Remplacer une donnée absente par 0 fausserait
        la comparaison : un plat paraîtrait plus pauvre en vitamine B12, ou moins émetteur, qu’il ne
        l’est réellement. Nous calculons donc avec les seules données disponibles et nous indiquons la{" "}
        <em>couverture</em>, c’est-à-dire la part de la masse du plat pour laquelle la donnée existe.
        En dessous de {percentFr.format(COVERAGE_WARNING)}, un avertissement s’affiche.
      </p>
      <p>
        Nous ne comblons pas les trous par des estimations. Si nous le faisons un jour (par exemple
        avec la table CALNUT de l’ANSES), ces valeurs seront signalées comme estimées.
      </p>
    </Section>
  );
}

export default async function MethodologiePage() {
  const stats = await getMethodologyStats();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16 leading-relaxed">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Méthodologie</h1>
        <p className="text-lg text-zinc-600">
          Veganizer compare un plat contenant des produits animaux et son alternative végétale sur
          cinq plans : nutrition, santé, climat et environnement, animaux, coût. Chaque chiffre vient
          d’une source publique citée. Quand une donnée manque, nous l’écrivons.
        </p>
        <nav aria-label="Sommaire">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SECTIONS.map(([id, title]) => (
              <li key={id}>
                <a href={`#${id}`} className="underline">
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Section id="principe" title="Le principe : comparer à fonction égale">
        <p>
          Nous comparons deux plats qui jouent le même rôle dans le repas, en portions réalistes. Les
          résultats sont aussi rapportés à 100 kcal et à 10 g de protéines, pour comparer à apport
          égal.
        </p>
        <p>
          Nous montrons aussi les points où le plat animal fait mieux (vitamine B12, qualité des
          protéines, prix…), avec la solution correspondante : aliment enrichi, complément, association
          de protéines.
        </p>
      </Section>

      <Section id="paires" title="Les paires de plats : maison et du commerce">
        <p>
          Chaque plat animal est comparé à deux alternatives végétales, pour 4 portions : une version
          <strong> faite maison</strong> (tofu, tempeh, légumineuses, légumes…) et une version avec un
          <strong> produit du commerce</strong> prêt à l’emploi (haché végétal, galette, seitan,
          tranches ou râpé végétal…). Les accompagnements sont les mêmes des deux côtés.
        </p>
        <p>Une recette n’est publiée que si elle respecte ces critères :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>proportions réalistes de la cuisine française courante ;</li>
          <li>portion consommée entre 300 et 500 g ;</li>
          <li>même rôle dans le repas que le plat animal ;</li>
          <li>au moins 70 % des protéines du plat animal ;</li>
          <li>données disponibles pour au moins 95 % de la masse du plat ;</li>
          <li>
            uniquement des aliments simples (pas de plat préparé comme ingrédient), pour que les
            impacts par espèce animale restent calculables.
          </li>
        </ul>
        <p>
          Quand aucun code ne couvre exactement l’ingrédient (carotte cuite, champignon de Paris…),
          nous retenons l’option la plus proche disposant de données complètes, de la même façon
          dans les deux plats. Chaque choix est consigné dans le dépôt du projet
          (<a href="https://github.com/VeganFlemme/veganizer/blob/main/docs/DECISIONS.md" className="underline" rel="noopener noreferrer">journal des décisions</a>).
        </p>
      </Section>

      <Section id="formule" title="La formule de calcul">
        <p>
          Chaque recette est décrite ingrédient par ingrédient, en grammes, à l’état réellement
          consommé (un ingrédient cuit est pesé cuit). L’impact d’un plat, par portion, est la somme
          des impacts de ses ingrédients :
        </p>
        <Formula>
          Impact par portion = Σ (grammes de l’ingrédient ÷ 1 000 × impact par kg) ÷ nombre de
          portions
        </Formula>
        <p>Les nutriments se calculent de la même façon, à partir des teneurs pour 100 g :</p>
        <Formula>
          Nutriment par portion = Σ (grammes de l’ingrédient ÷ 100 × teneur pour 100 g) ÷ nombre de
          portions
        </Formula>
        <p>L’écart entre les deux plats est exprimé par rapport au plat animal :</p>
        <Formula>Écart (%) = (plat animal − plat végétal) ÷ |plat animal| × 100</Formula>
        <p>
          Un écart positif signifie que l’alternative végétale a une valeur plus faible ; un écart
          négatif, qu’elle a une valeur plus élevée. Selon l’indicateur, plus faible est mieux
          (émissions, eau…) ou moins bien (protéines, fer…) : l’interface l’indique à chaque fois.
        </p>
        <p>
          <strong>Incertitude.</strong> Agribalyse attribue à chaque produit une note de qualité des
          données (DQR) de 1 (très fiable) à 5 (très incertaine) : nous affichons la moins bonne note
          parmi les ingrédients du plat. Quand une source publie une fourchette (valeur basse et
          valeur haute), nous l’affichons aussi. Agribalyse 3.2 ne publie pas de fourchette par
          aliment : pour ces indicateurs, la page l’indique et affiche la valeur centrale avec son DQR.
        </p>
        <p>
          La valeur absolue au dénominateur garde un sens à l’écart quand la valeur publiée du plat
          animal est négative. Quand la valeur du plat animal vaut 0 ou manque, l’écart n’est pas
          calculé.
        </p>
      </Section>

      <Section id="cout-climat" title="Le coût climat">
        <p>
          Le coût climat d’une portion est ses émissions (kg CO₂e, Agribalyse) multipliées par la
          valeur de l’action pour le climat publiée par France Stratégie (rapport Quinet, mars 2025),
          en euros 2023 par tonne. Pour une année sans valeur publiée, nous appliquons la règle de
          croissance indiquée par la source ; la page le précise alors.
        </p>
        <p>
          C’est un coût pour la collectivité (dommages climatiques évités ou causés), pas un prix
          payé en caisse.
        </p>
      </Section>

      <Section id="animaux" title="Animaux : une estimation basse">
        <AnimalFactors stats={stats} />
        <p>
          Pour la viande, nous divisons le nombre d’animaux abattus en France par la production de viande
          en poids de carcasse (FAOSTAT, chiffres officiels, dernière année disponible ; la fourchette
          couvre les cinq dernières années). Nous appliquons ce facteur au poids de viande consommée :
          comme un kilo de viande cuite et désossée vient de plus d’un kilo de carcasse, le résultat
          est une <strong>estimation basse</strong>.
        </p>
        <p>
          Les bovins sont une moyenne tous âges (veaux compris), les ovins aussi. Le veau vient de la
          statistique agricole annuelle (Agreste : veaux de boucherie finis, têtes et tonnes équivalent
          carcasse). Les poissons et les œufs n’ont pas encore de facteur d’animaux par kg : ils
          apparaissent comme « donnée manquante ».
        </p>
        <p>
          <strong>Douleur.</strong> Les heures de douleur par animal viennent du Welfare Footprint
          Institute (Schuck-Paim &amp; Alonso, licence CC BY 4.0), via Our World in Data. Ce sont des
          estimations minimales (seules les heures éveillées comptent, certaines atteintes au
          bien-être ne sont pas incluses). Elles sont données par intensité (gênante, pénible,
          invalidante, atroce) et ne sont jamais additionnées. Nous n’utilisons que les valeurs
          publiées en heures ou en secondes. Pour le poulet, la valeur retenue est celle des souches
          à croissance rapide (standard) ; celle des souches à croissance plus lente est donnée pour
          information dans le tableau ci-dessus. Pour les poules, les cages conventionnelles sont
          interdites dans l’Union européenne (directive 1999/74/CE, article 5, paragraphe 2) : nous
          retenons la volière sans cage, avec les cages aménagées comme borne haute ; ces chiffres ne
          couvrent que la période de ponte et ne sont pas encore rapportés au kg d’œufs.
        </p>
        <p>
          <strong>Jours de vie en élevage.</strong> Pour la viande : âge d’abattage du produit courant
          (cahiers des charges label rouge, ministère de l’Agriculture) multiplié par le nombre
          d’animaux par kg. Pour le lait : 365 jours divisés par le rendement annuel d’une vache
          (FAOSTAT) ; seule la lactation est comptée (élevage des génisses et des veaux exclu). Appliqué aux fromages et au beurre au poids du produit, c’est une estimation basse.
        </p>
      </Section>

      <Section id="sante-circ" title="Santé : le classement du CIRC">
        <p>
          Le Centre international de recherche sur le cancer (monographie n° 114, 2018) classe la
          viande transformée comme cancérogène pour l’humain (groupe 1) et la viande rouge comme
          probablement cancérogène (groupe 2A). Nous indiquons combien de grammes de chacune contient
          une portion, selon les définitions du CIRC (p. 37). Le groupe indique la solidité des
          preuves, pas l’ampleur du risque.
        </p>
        <p>
          Nous situons aussi chaque plat par rapport aux repères de Santé publique France pour les
          adultes (2019) : viande hors volaille (au plus 500 g par semaine) et charcuterie (au plus
          150 g par semaine), exprimées en part du repère hebdomadaire ; poisson (deux fois par
          semaine) et légumes secs (au moins deux fois par semaine), indiqués en grammes par portion.
          Ce ne sont pas des conseils personnalisés : parlez-en à un professionnel de santé.
        </p>
        <p>
          L’indice HENI (minutes de vie en bonne santé, Stylianou et al., 2021) n’est pas utilisé :
          ses données ne sont pas publiées sous licence ouverte et portent sur des aliments
          américains.
        </p>
      </Section>

      <Section id="prix" title="Prix : quand nous les affichons">
        <p>
          Les prix viennent des relevés citoyens Open Prices (licence ODbL) : prix au kilo en France,
          hors promotions, médiane sur 12 mois, avec au moins 5 relevés par aliment. Le prix d’un plat
          n’est affiché que si ces prix couvrent au moins 95 % de sa masse ; sinon nous indiquons la
          part couverte.
        </p>
      </Section>

      <Sources stats={stats} />
      <Hypotheses stats={stats} />

      <Section id="aucun-ingredient-animal" title="« Aucun ingrédient animal identifié »">
        <p>
          Pour chaque aliment, nous cherchons la présence de produits animaux dans son nom (Ciqual,
          Agribalyse) et, quand il existe, dans le détail de ses ingrédients publié par Agribalyse.
          Quand rien n’est trouvé, l’aliment est marqué « aucun ingrédient animal identifié ».
        </p>
        <p>
          Ce n’est <strong>pas une garantie</strong> que l’aliment est végétalien : une recette
          industrielle peut contenir du lait, des œufs, du beurre ou de la gélatine sans que son nom
          le dise. Veganizer n’affiche donc jamais « vegan » sur cette seule base. En cas de doute,
          la liste des ingrédients sur l’emballage fait foi.
        </p>
      </Section>

      <Negatives stats={stats} />
      <MissingData stats={stats} />

      <Section id="sante" title="Santé : pas de conseil médical">
        <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3">
          Les informations de Veganizer sont générales et ne remplacent pas l’avis d’un professionnel
          de santé (médecin, diététicien·ne). Pour toute question sur votre alimentation, notamment en
          cas de grossesse, de maladie ou pour un enfant, consultez un professionnel.
        </p>
      </Section>

      <Link href="/" className="underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
