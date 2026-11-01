import Link from "next/link";
import { HomeExplorer } from "@/components/HomeExplorer";
import { Dot } from "@/components/ui/Dot";
import { getPairPage, listPairs } from "@/lib/compare/data";

// Pair shown first (editorial choice, docs/A_VERIFIER.md): the first pair of the roadmap mock-ups.
const FEATURED = "boeuf-bourguignon";
const SEGMENT: Record<string, string> = { vegetal: "bg-plant", animal: "bg-animal", egal: "bg-line", insuffisant: "bg-line" };

async function Featured({ slug }: { slug: string }) {
  const model = await getPairPage(slug);
  const v = model?.variants.maison ?? model?.variants.commerce;
  if (!model || !v) return null;
  const verdict = v.scores.verdict;
  return (
    <Link href={`/compare/${slug}`} className="flex flex-col gap-[14px] rounded-verdict bg-surface p-5 text-ink no-underline shadow-float hover:text-ink md:max-w-[560px] md:p-6">
      <span className="flex flex-col gap-[6px]">
        <span className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.02em]">
          <Dot series="animal" size={9} /> {model.animal.name}
        </span>
        <span className="flex items-center gap-2 text-[16px] font-semibold text-ink-2">
          <Dot series="plant" size={9} /> {v.dish.name}
        </span>
      </span>
      <span className="flex items-baseline gap-[10px]">
        <span className="text-[44px] font-extrabold leading-[0.95] tracking-[-0.05em]">
          {verdict.vegetalWins} sur {verdict.total}
        </span>
        <span className="text-[15px] leading-[1.3] text-ink-2">catégories gagnées par le végétal</span>
      </span>
      <span className="grid grid-cols-5 gap-1">
        {verdict.categories.map((c) => (
          <span key={c.id} className="flex min-w-0 flex-col gap-[5px]">
            <span aria-hidden="true" className={`h-2 rounded-[4px] ${SEGMENT[c.winner]}`} />
            <span className="text-[11px] leading-tight text-ink-2">
              {c.short} <span className="num">{c.animalPoints}–{c.vegetalPoints}</span>
            </span>
          </span>
        ))}
      </span>
      <span className="text-[15px] font-bold text-action">Voir la comparaison complète</span>
    </Link>
  );
}

export default async function Home() {
  const pairs = await listPairs();
  const featured = pairs.find((p) => p.slug === FEATURED)?.slug ?? pairs[0]?.slug;
  return (
    <main className="flex flex-1 flex-col pb-8">
      <HomeExplorer pairs={pairs} featured={featured ? <Featured slug={featured} /> : null} />
      <section className="mx-auto w-full max-w-[1200px] px-5 pt-[22px] md:px-8">
        <div className="flex flex-col gap-[10px] rounded-panel bg-surface p-5 md:max-w-[640px]">
          <h2 className="m-0 text-[19px] font-extrabold">Ton plat n’est pas dans la liste ?</h2>
          <p className="m-0 text-[15px] leading-normal text-ink-2">Saisis tes ingrédients et leurs grammes : le site calcule les cinq catégories et propose une version végétale.</p>
          <Link href="/recette" className="flex h-[46px] items-center self-start rounded-btn bg-action px-[18px] text-[15px] font-bold text-white no-underline hover:bg-action-hover hover:text-white">
            Analyser ma recette
          </Link>
        </div>
      </section>
    </main>
  );
}
