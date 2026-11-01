import type { Metadata } from "next";
import { formatValue, NBSP, publicLicense } from "@/lib/format";
import Link from "next/link";
import type { ReactNode } from "react";
import complementsFile from "@/data/complements.json";
import { PageHero, Prose } from "@/components/ui/PageHero";
import { ScoreMethod } from "@/components/methodology/ScoreMethod";
import { getMethodologyStats, type MethodologyStats } from "@/lib/methodology/data";

export const metadata: Metadata = {
  title: "Méthodologie",
  alternates: { canonical: "/methodologie" },
  description:
    "Comment Veganizer calcule ses comparaisons : formule, sources, hypothèses, valeurs négatives et données manquantes.",
};

// Methodology threshold (not a data value): coverage below this triggers a warning.
const COVERAGE_WARNING = 0.95;

const integerFr = new Intl.NumberFormat("fr-FR");
const percentFr = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

function Missing() {
  return <span className="italic text-ink-3">donnée manquante</span>;
}

function Count({ value }: { value: number | null }) {
  return value === null ? <Missing /> : <>{integerFr.format(value)}</>;
}

function Percent({ value }: { value: number | null }) {
  return value === null ? <Missing /> : <>{percentFr.format(value)}</>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3 rounded-panel bg-surface p-5 md:p-6">
      <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] md:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}


function AnimalFactors({ stats }: { stats: MethodologyStats }) {
  if (stats.animalFactors.length === 0) return <p>Facteurs : <Missing />.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm lg:table-fixed">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[18%]" />
          <col className="w-[13%]" />
          <col />
        </colgroup>
        <caption className="mb-1 text-left font-medium">Facteurs utilisés (lus dans la base)</caption>
        <thead>
          <tr className="border-b border-line">
            <th className="py-1 pr-2">Indicateur</th>
            <th className="py-1 pr-2">Catégorie</th>
            <th className="py-1 pr-2">Valeur</th>
            <th className="py-1">Base, source et remarques</th>
          </tr>
        </thead>
        <tbody>
          {stats.animalFactors.map((f) => (
            <tr key={`${f.indicator}-${f.category}-${f.sourceId}`} className="border-b border-line-soft align-top">
              <td className="py-1 pr-2">{f.indicator}</td>
              <td className="py-1 pr-2">{f.category}</td>
              <td className="num py-1 pr-2 whitespace-nowrap">{formatValue(f.value)}</td>
              <td className="py-1 text-xs text-ink-2 [overflow-wrap:anywhere]">
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
    <p className="rounded-select bg-track px-4 py-3 text-sm leading-relaxed">
      {children}
    </p>
  );
}

const SECTIONS = [
  ["principe", "Le principe : comparer à fonction égale"],
  ["paires", "Les plats et leur version végétale"],
  ["recettes-types", "Recettes types et recettes officielles"],
  ["version-complete", "Version de base et version complétée"],
  ["choix-proteine", "La protéine au choix"],
  ["ta-recette", "« Analyse ta recette »"],
  ["formule", "La formule de calcul"],
  ["vainqueur", "Comment on désigne un vainqueur"],
  ["cout-climat", "Le coût climat"],
  ["animaux", "Animaux : une estimation basse"],
  ["sante-circ", "Santé : le classement du CIRC"],
  ["prix", "Prix : quand nous les affichons"],
  ["sources", "Les sources"],
  ["hypotheses", "Catégories animales et hypothèses par défaut"],
  ["aucun-ingredient-animal", "« Aucun ingrédient animal identifié »"],
  ["valeurs-negatives", "Pourquoi certaines valeurs sont négatives"],
  ["oeufs-agribalyse", "Œufs : des impacts sous-évalués selon l’ADEME"],
  ["liste-donnees-manquantes", "Données manquantes : ce qui manque et pourquoi"],
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
              {s.version && <>, version {s.version}</>}
              {publicLicense(s.license) ? <> — licence : {publicLicense(s.license)}</> : null}.
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
    <>
    <Section id="oeufs-agribalyse" title="Œufs : des impacts sous-évalués selon l’ADEME">
      <p>
        La notice du tableur Agribalyse 3.2 des produits alimentaires (dernière modification le 21 août 2025) signale une erreur « concernant les
        facteurs d’impacts relatifs aux produits &quot;Oeufs&quot; (et donc à tous les produits contenant des oeufs) » : « les impacts affichés en l’état
        sont considérés comme sous-évalués. Une mise à jour est en cours. » Nous affichons les valeurs telles que publiées et, sur chaque comparaison dont une recette contient un œuf, un avertissement :
        les valeurs de ce plat sont probablement trop basses. Pour une omelette ou une quiche, l’écart réel avec la version végétale est donc
        probablement plus grand que celui affiché.
      </p>
      <p>
        La même notice signale l’inverse pour le quinoa produit en France (impacts sur-évalués) ; aucune de nos recettes n’en contient.
      </p>
      <p className="text-sm">
        Source : ADEME, AGRIBALYSE 3.2, tableur des produits alimentaires, onglet « Notice », 
        <a href="https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/XTENSJ" rel="noopener noreferrer">entrepôt Recherche Data Gouv</a>.
      </p>
    </Section>
    <Section id="liste-donnees-manquantes" title="Données manquantes : ce qui manque et pourquoi">
      <p>Ces données ne sont pas encore affichées. Elles restent « donnée manquante », jamais 0, tant qu’une source officielle ne peut pas être citée à la page près.</p>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Âges d’abattage</strong> des bovins, des vaches de réforme, des veaux, des agneaux, des dindes et des canards : aucun âge du « produit courant » trouvé dans une publication officielle française citable (seuls les cahiers des charges label rouge donnent des minimums, non représentatifs).</li>
        <li><strong>Animaux tués pour les œufs et le lait</strong> (poules et vaches de réforme, poussins mâles, veaux) : choix de ne pas créer ce facteur pour l’instant.</li>
        <li><strong>Jours de vie pour le beurre et la crème</strong> : coproduits du lait écrémé, pas de règle de répartition sourcée.</li>
        <li><strong>Douleur</strong> des porcs, des bovins et des poissons, et douleurs gênante, pénible et invalidante du poulet : pas de valeurs publiées en heures dans une source ouverte (le Welfare Footprint Institute publie certaines valeurs en jours de 16 h, que nous n’utilisons pas).</li>
        <li><strong>Poissons et crustacés</strong> autres que le saumon d’élevage, le cabillaud et le lieu noir : pas encore de correspondance relue avec les tableaux de Mood et al.</li>
        <li><strong>Prix</strong> de la plupart des ingrédients cuits (pâtes, riz, légumineuses, pommes de terre, légumes cuits) : il faudrait un rendement de cuisson officiel et ouvert ; et de nombreux produits n’ont pas assez de relevés publics. Le prix d’un plat n’est affiché que si 95 % de sa masse est couverte.</li>
        <li><strong>CALNUT</strong> (ANSES), qui comblerait des nutriments manquants de Ciqual : site ciqual.anses.fr en maintenance.</li>
        <li><strong>Minutes de vie en bonne santé (HENI)</strong> : données non publiées sous licence ouverte.</li>
        <li><strong>Article complet EAT-Lancet 2025</strong> (The Lancet) : inaccessible depuis notre environnement ; le résumé d’EAT Forum sert de source provisoire.</li>
      </ul>
    </Section>

    <Section id="donnees-manquantes" title="Pourquoi il manque des données, et pourquoi jamais 0">
      <p>
        La table Ciqual rassemble des résultats d’analyses en laboratoire. Tous les constituants n’ont
        pas été mesurés pour tous les aliments, et certains le sont beaucoup moins souvent que
        d’autres (voir le tableau). Par exemple, la vitamine B12 n’a pas de valeur chiffrée pour{" "}
        <Percent value={b12?.missingShare ?? null} /> des aliments Ciqual.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-ink-2">
            Part des aliments Ciqual sans valeur chiffrée (sur <Count value={stats.ciqualFoods} />{" "}
            aliments)
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">Nutriment</th>
              <th className="py-2 font-medium">Sans valeur chiffrée</th>
            </tr>
          </thead>
          <tbody>
            {stats.nutrients.map((n) => (
              <tr key={n.id} className="border-b border-line-soft">
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
          <strong>« &lt; x »</strong> : la teneur est inférieure à x, une « valeur maximale » selon la
          documentation de Ciqual 2025 (p. 21, description du fichier XML). Ce n’est pas une donnée manquante : la teneur est
          connue, entre 0 et x. Dans un plat, nous l’additionnons avec 0 pour la borne basse et avec x
          pour la borne haute, et nous affichons la fourchette obtenue. Jamais x/2 ni une autre
          valeur choisie par nous.
        </li>
        <li>
          <strong>« traces »</strong> : selon la documentation de Ciqual 2025 (p. 10, § 3.2.3), le
          constituant est détecté sans pouvoir être quantifié, ou estimé très faible sans pouvoir être
          considéré nul. La documentation ne dit pas comment le compter dans une recette : nous le
          traitons comme une donnée manquante.
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
    </>
  );
}

export default async function MethodologiePage() {
  const stats = await getMethodologyStats();

  return (
    <main className="flex flex-1 flex-col">
      <PageHero title="Méthodologie">
        <p className="m-0">
          Veganizer compare un plat contenant des produits animaux et sa version végétale sur cinq catégories : nutrition, santé, environnement, protection
          animale, économie. Chaque chiffre vient d’une source publique citée. Quand une donnée manque, nous l’écrivons.
        </p>
      </PageHero>
      <Prose
        toc={
          <nav aria-label="Sommaire" className="rounded-panel bg-surface p-5 md:p-6 lg:p-4">
            <h2 className="m-0 mb-2 text-[17px] font-extrabold">Sommaire</h2>
            <ol className="m-0 list-decimal space-y-1 pl-5 text-[15px] lg:text-[14px]">
              {SECTIONS.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`}>{title}</a>
                </li>
              ))}
            </ol>
          </nav>
        }
      >

      <Section id="principe" title="Le principe : comparer à fonction égale">
        <p>
          Nous comparons deux plats qui jouent le même rôle dans le repas, en portions réalistes. Les
          résultats sont aussi rapportés à 100 kcal et à 10 g de protéines, pour comparer à apport
          égal.
        </p>
        <p>
          Nous montrons aussi, sous le titre « Ce qui reste à couvrir », tout ce que le plat animal apporte de plus (vitamine B12,
          qualité des protéines, prix…), avec les valeurs des deux plats et la solution sourcée : aliment enrichi, complément, association
          de protéines. Les indicateurs où « moins = mieux » (sucres, sel, acides gras saturés…) sont présentés à part, avec les valeurs et
          les ingrédients qui en apportent le plus ; sans conseil sourcé, seulement les faits.
        </p>
      </Section>

      <Section id="paires" title="Les plats et leur version végétale">
        <p>
          Chaque plat est d’abord une <strong>recette du plat animal</strong> : la recette officielle d’Agribalyse quand nous pouvons la reprendre (voir
          ci-dessous), sinon une <strong>recette type rédigée par Veganizer</strong>. Ces recettes types ont été écrites par une IA, puis contrôlées par des
          règles et des tests automatiques (masses, portions réalistes, ingrédients simples, données disponibles pour au moins 95 % de la masse) ; aucune n’a
          été relue par un professionnel. Chaque page permet d’ouvrir la recette dans « Analyse ta recette » pour la modifier.
        </p>
        <p>
          La <strong>version végétale n’est plus écrite à la main</strong> : elle est calculée à partir de la recette du plat animal, par une règle unique
          (voir « La protéine au choix »). Les versions « faite maison » et « du commerce » écrites auparavant ne servent plus ; les produits du commerce
          (haché végétal, galettes, nuggets…) font partie de la liste des protéines proposées.
        </p>
        <p>
          Quand aucun code ne couvre exactement un ingrédient (carotte cuite, champignon de Paris…), nous retenons l’option la plus proche disposant de données
          complètes. Chaque choix est consigné dans le dépôt du projet (
          <a href="https://github.com/VeganFlemme/veganizer/blob/main/docs/DECISIONS.md" className="underline" rel="noopener noreferrer">journal des décisions</a>).
        </p>
      </Section>

      <Section id="recettes-types" title="Recettes types et recettes officielles">
        <p>
          Les recettes de nos paires sont des <strong>recettes types rédigées par Veganizer</strong>, ingrédient par ingrédient. L’ADEME ne publie pas
          les recettes de la version 3.2 d’Agribalyse : l’annexe 9 de son rapport méthodologique indique que « le détail des recettes n’est
          disponible que dans les logiciels d’ACV ».
        </p>
        <p>
          La version précédente, <strong>Agribalyse 3.0</strong>, est en revanche rediffusée en entier sur data.gouv.fr sous Licence Ouverte. Elle
          donne la masse de chaque ingrédient de chaque plat composé. Nous n’en reprenons une recette que si sa liste d’ingrédients est la même que
          celle du détail par ingrédient de la version 3.2, et si au moins 95 % de sa masse correspond à un aliment Ciqual. C’est le cas de 102 plats
          sur 285 ; les autres plats (ajoutés ou renommés depuis la 3.0, ingrédients différents, ingrédients sans données comme le champignon de
          Paris) sont écartés.
        </p>
        <p>
          Un plat recalculé à partir de sa recette n’a pas exactement l’impact publié pour le plat entier : il manque les étapes propres au plat
          (cuisson à l’usine, emballage, transport, stockage). Sur ces 102 plats, le recalcul donne en médiane 81 % des émissions publiées
          (98 % pour le hachis parmentier, 96 % pour le pot-au-feu, 84 % pour les lasagnes à la bolognaise). C’est pourquoi nous comparons
          toujours une recette à une recette, calculées de la même façon, jamais un plat officiel à une recette recalculée.
        </p>
        <p className="text-sm">
          Sources : ADEME, AGRIBALYSE 3.2, rapport méthodologique « Alimentation » et ses annexes, 
          <a href="https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/XTENSJ" rel="noopener noreferrer">entrepôt Recherche Data Gouv</a> ; base AGRIBALYSE 3.0 complète, 
          <a href="https://www.data.gouv.fr/fr/datasets/agribalyse/" rel="noopener noreferrer">rediffusion sur data.gouv.fr</a> (Licence
          Ouverte 2.0), consultées le 1er novembre 2026.
        </p>
      </Section>

      <Section id="version-complete" title="Version de base et version complétée">
        <p>
          <strong>La référence reste le plat tel qu’on le mange.</strong> La « version de base » compare des portions réalistes, avec les mêmes accompagnements des
          deux côtés : c’est la vue par défaut, et ses scores sont les scores de référence. Deux raisons. Selon l’ANSES, la référence nutritionnelle en protéines
          des adultes en bonne santé est de 0,83 g par kg de poids et par jour, et en France « les apports énergétiques et protéiques atteignent les références
          nutritionnelles » ; l’apport moyen des adultes, mesuré par l’étude INCA 1, était de 1,4 g par kg et par jour (AFSSA, 2007). Les références
          nutritionnelles de l’ANSES sont des apports par jour (mg/j, µg/j), et pour les protéines l’ANSES indique que varier les sources sur la journée
          suffit. Nous en concluons qu’un plat isolé n’a pas à couvrir à lui seul ces références ; ce n’est pas une phrase de l’ANSES.
        </p>
        <p>
          <strong>La version complétée</strong> répond à l’objection « il manque des protéines, du calcium… ». Le plat animal ne change pas. La version végétale
          reçoit autant de protéines que lui : seule sa protéine principale (celle qui apporte le plus de protéines parmi les ingrédients qui diffèrent du plat
          animal) est augmentée. Puis ses autres manques sont comblés par les plus petites quantités d’aliments d’une liste blanche relue (aliments courants
          d’abord, aliments enrichis seulement s’il le faut), sans jamais dépasser une limite de sécurité de l’ANSES (calcium, fer, zinc, iode, vitamine D, par
          jour, appliquées au total de la portion). Tous les onglets, le climat, les animaux et le prix sont recalculés et comparés normalement ; la nutrition
          affiche « écarts comblés par construction » au lieu d’un score, pour rester équitable. La vitamine B12, l’EPA + DHA et la vitamine D, qu’aucun aliment
          de la liste ne comble, sont indiquées « à couvrir hors de ce plat » : complément ou aliment enrichi, sans dose, avec un professionnel de santé.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {complementsFile.foods.map((f) => (
            <li key={f.code}>
              <strong>{f.label}</strong> ({f.kind === "enrichi" ? "aliment enrichi" : "aliment courant"}, au plus {f.maxGramsPerServing}
              {NBSP}g par portion) : {f.justification}
            </li>
          ))}
        </ul>
        <p>
          <strong>Pourquoi le plat animal n’est plus complété.</strong> Une version précédente complétait aussi le plat animal là où la version végétale faisait
          mieux (fibres…). Nous l’avons retiré : la question posée est « que faudrait-il ajouter à la version végétale pour égaler le plat animal ? ». Compléter
          les deux plats reviendrait à comparer deux plats que personne ne mange ; les avantages de la version végétale restent visibles dans la version de base.
          Ce sélecteur remplace les vues « Portion réaliste », « À protéines égales » et « Avec compléments ».
        </p>
        <p>
          <strong>Choix des protéines végétales des recettes</strong> : dans chaque version maison, la protéine végétale la plus proche du rôle de la viande, pour
          approcher les protéines du plat animal à portion réaliste sans dépasser le plafond de +20 % en masse. Plats à base de haché et pièces de viande :
          protéines de soja texturées réhydratées (comptées comme « fait maison ») ; œufs, fromage et poisson : tofu. Lentilles et pois chiches ne sont gardés que
          lorsqu’ils remplacent réellement un ingrédient du plat d’origine. Les fibres, elles, sont trop faibles en France : 20 g par jour en moyenne chez les
          adultes, pour une référence de 30 g.
        </p>
        <p className="text-sm text-ink-3">
          Sources : ANSES, «{NBSP}Protéines : rôle, sources et apports recommandés{NBSP}», page mise à jour le 22/12/2025 (
          <a href="https://www.anses.fr/fr/content/les-prot%C3%A9ines" className="underline" rel="noopener noreferrer">anses.fr</a>) ; AFSSA, «{NBSP}Apport en protéines : consommation, qualité, besoins et recommandations{NBSP}», 2007, p. 111 du PDF, note 13 (INCA 1) (
          <a href="https://www.anses.fr/fr/system/files/NUT-Ra-Proteines.pdf" className="underline" rel="noopener noreferrer">PDF</a>) ; ANSES, «{NBSP}Les références nutritionnelles en vitamines et minéraux{NBSP}», page du 21/02/2025 (
          <a href={complementsFile.dailyNeeds.source.url} className="underline" rel="noopener noreferrer">anses.fr</a>) ; ANSES, «{NBSP}Actualisation des repères du PNNS{NBSP}», 2016, p. 22 du PDF (fibres) (
          <a href="https://www.anses.fr/fr/system/files/NUT2012SA0103Ra-1.pdf" className="underline" rel="noopener noreferrer">PDF</a>) ; ANSES, dossier de presse INCA 3, 2017, p. 11 du PDF (
          <a href="https://www.anses.fr/fr/system/files/PRES2017DPA04.pdf" className="underline" rel="noopener noreferrer">PDF</a>).
        </p>
      </Section>

      <Section id="choix-proteine" title="La protéine au choix : une comparaison automatique">
        <p>
          Veganizer interroge les bases officielles (Ciqual, Agribalyse) : toutes les comparaisons sont automatiques, aucune n’a été relue par un
          professionnel. Sur chaque page (plat, aliment, « Analyse ta recette »), vous choisissez la protéine végétale qui remplace l’ingrédient animal
          principal. Le choix reste dans l’adresse de la page (<code>?proteine=</code>).
        </p>
        <p>
          <strong>Les protéines proposées</strong> sont lues dans la base, sans liste écrite à la main : aliments sans ingrédient animal identifié (noms
          Ciqual et Agribalyse, détail Agribalyse par ingrédient), dont les protéines, les lipides, l’énergie et les émissions sont connus ; classés dans
          les légumineuses, les ingrédients pour végétariens, les substituts de viande ou de charcuterie, ou les plats végétariens et composés ; prêts à
          manger (ni secs ni crus) ; et « riches en protéines » au sens du règlement (CE) n° 1924/2006 (au moins 20 % de l’énergie apportée par les
          protéines).
        </p>
        <p>
          <strong>Le classement</strong> ne lit que les données nutritionnelles : toutes les protéines proposées jouent le même rôle (une source de
          protéines à la place de l’ingrédient animal principal), puis elles sont rangées par écart de protéines pour 100 g avec cet ingrédient (au
          gramme près), puis par écart de lipides, puis par écart d’énergie. Jamais selon les émissions, le prix ou le score. La première de la liste est
          affichée par défaut, avec la raison de son rang (« la plus proche en protéines »).
        </p>
        <p>
          <strong>La règle de remplacement</strong> est unique. L’ingrédient animal principal (l’ingrédient animal qui apporte le plus de protéines, parmi
          les « sources de protéines » du même règlement : au moins 12 % de l’énergie ; le beurre ou la crème ne le sont jamais) est remplacé par la protéine
          choisie, à masse égale dans la version de base et à protéines égales dans la version complétée. Les autres ingrédients animaux (beurre, lait,
          crème, lardons, fromage…) sont remplacés par une table relue, dont chaque ligne est justifiée. Les ingrédients végétaux ne changent pas. Une
          phrase indique pour combien de protéines de la liste la version végétale émet moins de gaz à effet de serre par portion (fourchettes qui ne se
          chevauchent pas).
        </p>
        <p>
          Les <strong>aliments</strong> du catalogue sont comparés de la même façon, pour 100 g : 100 g de l’aliment animal face à 100 g de la protéine
          choisie. La recherche tolère les accents, les fautes légères et quelques abréviations courantes (« bolo », « croque »…).
        </p>
      </Section>

      <Section id="ta-recette" title="« Analyse ta recette »">
        <p>
          Sur la page Recette, vous choisissez des aliments simples du catalogue (jamais un plat
          préparé, pour que les impacts par espèce animale restent calculables), avec leur poids tel
          que mangé. Le calcul utilise le même moteur que les autres comparaisons, dans votre navigateur.
        </p>
        <p>
          La version végétale remplace chaque ingrédient animal selon une table de substitutions relue
          (fichier <code>pipeline/substitutions.csv</code>) : par exemple viande hachée → lentilles
          vertes cuites, charcuterie → tofu fumé, lait → boisson au soja enrichie en calcium. La
          justification de chaque remplacement est affichée ; la masse reste la même sauf dans deux
          cas, calculés à partir des données : le beurre est remplacé par la même quantité de
          matière grasse (grammes d’huile = grammes de beurre × lipides du beurre ÷ lipides de
          l’huile, valeurs Ciqual), et une viande crue remplacée par du seitan, qui se mange tel
          quel, est d’abord ramenée à son poids cuit avec le rendement de cuisson de l’USDA quand il
          est publié (sinon la masse reste la même, ce qui est indiqué). Les ingrédients sans
          remplacement prévu sont gardés et signalés.
        </p>
        <p>
          Aucun compte n’est nécessaire : la recette reste enregistrée dans votre navigateur. L’enregistrement
          en ligne (avec un compte) viendra plus tard.
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
          Pour les nutriments, une teneur publiée « &lt; x » par Ciqual donne une fourchette (de 0 à x
          pour cet ingrédient) : le plat n’a alors qu’une fourchette, sans valeur centrale.
        </p>
        <p>
          <strong>Arrondis.</strong> Une seule règle par unité, partout sur le site : les kg CO₂e et
          les euros avec 2 décimales (« 0,65 », « 1,20 »), les autres valeurs avec 3 chiffres
          significatifs. Une valeur non nulle trop petite pour 2 décimales s’écrit « &lt; 0,01 ».
          Dans le simulateur, le nombre d’animaux épargnés, une estimation basse, est arrondi vers le
          bas (2 chiffres significatifs).
        </p>
        <p>
          La valeur absolue au dénominateur garde un sens à l’écart quand la valeur publiée du plat
          animal est négative. Quand la valeur du plat animal vaut 0 ou manque, l’écart n’est pas
          calculé.
        </p>
      </Section>

      <Section id="vainqueur" title="Comment on désigne un vainqueur">
        <ScoreMethod />
      </Section>

      <Section id="cout-climat" title="Le coût climat">
        <p>
          Le coût climat d’une portion est ses émissions (kg CO₂e, Agribalyse) multipliées par la
          valeur de l’action pour le climat publiée par France Stratégie (rapport Quinet, mars 2025),
          en euros 2023 par tonne. Nous utilisons partout la même année de référence, 2025 (première
          valeur publiée par le rapport), dans les cartes comme dans le simulateur, et l’année est
          toujours affichée. La valeur officielle augmente ensuite chaque année : nos montants sont
          donc prudents pour les années futures.
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
          Les bovins sont une moyenne tous âges (veaux compris), les ovins aussi. Pour le veau, nous
          utilisons la statistique agricole annuelle (Agreste) des veaux de boucherie « finis
          produits » dans l’année (têtes et tonnes équivalent carcasse) : ce n’est pas un comptage
          d’abattage, c’est une approximation acceptée.
        </p>
        <p>
          <strong>Œufs et lait : pas de nombre d’animaux tués.</strong> Une poule pondeuse ou une vache
          laitière n’est pas abattue pour un kilo d’œufs ou de lait ; les rapporter au kilo
          demanderait de répartir les poules et vaches de réforme, les poussins mâles et les veaux.
          Nous avons décidé de ne pas créer ce facteur pour l’instant : le nombre d’animaux tués est
          « donnée manquante » pour les œufs et les produits laitiers, sans être compté comme 0.
        </p>
        <p>
          <strong>Poissons tués.</strong> Nombre de poissons par kg = 1 000 ÷ poids moyen estimé d’un poisson de l’espèce (en grammes), d’après
          Mood et al. (<em>Animal Welfare</em>, 2023 pour les poissons d’élevage, 2024 pour les poissons sauvages, licence CC BY 4.0), avec leur
          fourchette basse et haute : saumon d’élevage, cabillaud et lieu noir à ce jour. Le poids est celui du poisson entier, alors que les
          recettes pèsent du filet cuit : c’est une estimation basse. Les autres espèces, les crevettes et les autres crustacés sont « donnée
          manquante ».
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
          couvrent que la période de ponte. Ils sont rapportés au kg d’œufs avec le cycle de ponte publié par le ministère de l’Agriculture
          (environ 300 œufs en 12 à 13 mois, fiche « Le bien-être et la protection des poules pondeuses », p. 1) et le poids moyen d’un œuf en
          France (60 g, FAO, <em>Technical Conversion Factors</em>) : 18 kg d’œufs par poule. Pour le poulet, seules les
          secondes de douleur atroce sont publiées dans une unité utilisable ; les douleurs gênante,
          pénible et invalidante, publiées en jours, sont « donnée manquante ».
        </p>
        <p>
          <strong>Jours de vie en élevage.</strong> Pour la viande : âge d’abattage du produit courant
          (cahiers des charges label rouge, ministère de l’Agriculture) multiplié par le nombre
          d’animaux par kg. Pour le lait : 365 jours divisés par le rendement annuel d’une vache
          (FAOSTAT) ; seule la lactation est comptée (élevage des génisses et des veaux exclu). Ce facteur s’applique au lait liquide et aux
          yaourts. Pour les fromages au lait de vache, il est multiplié par 7,7 kg de lait par kg de fromage (coefficient d’extraction de
          13 % publié par la FAO pour la France) ; tout le lait est attribué au fromage. Pour le beurre et la crème, coproduits du lait écrémé,
          ce calcul attribuerait au beurre les jours de vie de tout le lait écrémé : faute de règle de répartition sourcée, la valeur est
          « donnée manquante ». Pour les œufs : 365 jours ÷ (257 œufs par poule et par an, FAOSTAT 2023 × 60 g), phase de ponte seulement.
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
          Pour chaque ingrédient, nous retenons une seule source de prix, par ordre de priorité :
          d’abord le Réseau des nouvelles des marchés (RNM, FranceAgriMer : prix au détail en grandes
          et moyennes surfaces, moyennes mensuelles en euros TTC le kilo), puis les relevés citoyens
          Open Prices (licence ODbL). Pour un produit vendu sous code-barres, le prix au kilo est
          calculé avec la quantité indiquée sur la fiche Open Food Facts, uniquement si elle est en
          grammes : un produit vendu au litre demanderait sa masse volumique, ce qui n’est pas une
          simple conversion d’unité.
        </p>
        <p>
          Nous gardons les prix des 12 derniers mois, hors promotions, et publions la médiane à partir
          de 5 relevés (ou 5 moyennes mensuelles). Un prix de produit cru n’est jamais appliqué à un
          ingrédient pesé cuit, sauf par un rendement de cuisson publié : pour les viandes, nous
          utilisons la table de l’USDA (<em>Table of Cooking Yields for Meat and Poultry</em>,
          Release 2, domaine public). Par exemple, le prix du steak haché cuit est celui du steak
          haché cru divisé par son rendement de cuisson à la poêle ; le rendement utilisé est affiché
          avec chaque prix. Les recettes restent pesées cuites ; sans rendement sourcé (légumes, pâtes,
          riz, légumineuses), le prix reste « donnée manquante ». Le prix d’un plat, par portion, pour 100 kcal et pour 10 g de
          protéines, n’est affiché que si ces prix couvrent au moins 95 % de sa masse ; sinon nous
          indiquons la part couverte et le prix au kilo de chaque ingrédient, avec la source, le lieu
          et la période des relevés.
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
        <p className="m-0 rounded-select bg-track px-4 py-3">
          Les informations de Veganizer sont générales et ne remplacent pas l’avis d’un professionnel
          de santé (médecin, diététicien·ne). Pour toute question sur votre alimentation, notamment en
          cas de grossesse, de maladie ou pour un enfant, consultez un professionnel.
        </p>
      </Section>

      </Prose>
    </main>
  );
}
