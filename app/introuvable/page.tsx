import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-3xl font-bold">Page introuvable</h1>
      <p>Ce plat n’existe pas (ou pas encore) sur Veganizer.</p>
      <p>
        <Link href="/" className="underline">
          Voir les plats comparés
        </Link>
      </p>
    </main>
  );
}
