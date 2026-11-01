"use client";

import { useQueryParam } from "@/components/compare/useQueryParam";

/** « Télécharger les données » for the view on screen: same protein and adjustment (step 4 reviews). */
export function DataLink({ href }: { href: string }) {
  const [proteine] = useQueryParam("proteine");
  const [ajuste] = useQueryParam("ajuste");
  const [quantite] = useQueryParam("quantite");
  const q = new URLSearchParams();
  if (proteine) q.set("proteine", proteine);
  if (ajuste) q.set("ajuste", ajuste);
  if (quantite) q.set("quantite", quantite);
  const s = q.toString();
  return (
    <a href={s ? `${href}?${s}` : href} className="inline-flex min-h-11 items-center" download>
      Télécharger les données
    </a>
  );
}
