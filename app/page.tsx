import Link from "next/link";
import { PairGrid } from "@/components/PairGrid";
import { listPairs } from "@/lib/compare/data";

export default async function Home() {
  const pairs = await listPairs();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-tight">Votre plat préféré, en version végétale : qu’est-ce que ça change ?</h1>
        <p className="max-w-2xl text-lg text-zinc-800">
          Veganizer compare un plat courant et son alternative végétale, maison ou du commerce, sur la nutrition, la santé,
          le climat, les animaux et le coût. Chaque chiffre vient d’une base publique citée, y compris quand le plat animal
          fait mieux.
        </p>
        <p className="text-sm text-zinc-700">
          <Link href="/methodologie" className="underline">Comment nous calculons</Link> ·{" "}
          <Link href="/sources" className="underline">Sources et licences</Link>
        </p>
      </section>
      <section aria-labelledby="plats" className="flex flex-col gap-4">
        <h2 id="plats" className="text-xl font-semibold">
          Les plats comparés
        </h2>
        {pairs.length === 0 ? <p>Aucune comparaison publiée pour l’instant.</p> : <PairGrid pairs={pairs} />}
      </section>
    </main>
  );
}
