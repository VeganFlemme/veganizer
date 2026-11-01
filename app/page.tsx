import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">Veganizer — en construction</h1>
      <p className="text-lg text-zinc-600">
        Veganizer comparera, chiffres sourcés à l’appui, un plat contenant des
        produits animaux et son alternative végétale : nutrition, santé, climat,
        animaux et coût.
      </p>
      <Link href="/methodologie" className="underline">
        Comment nous calculons : la méthodologie
      </Link>
      <Link href="/etat" className="underline">
        Voir l’état de la base
      </Link>
    </main>
  );
}
