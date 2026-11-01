import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/compare/config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-zinc-700">
        <p>
          <strong>Pas de conseil médical.</strong> {MEDICAL_DISCLAIMER}
        </p>
        <p>
          Chiffres issus de bases publiques (Ciqual, Agribalyse…) : voir les{" "}
          <Link href="/sources" className="underline">sources et licences</Link> et la{" "}
          <Link href="/methodologie" className="underline">méthodologie</Link>.
        </p>
      </div>
    </footer>
  );
}
