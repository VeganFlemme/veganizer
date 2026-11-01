"use client";

import { useMemo, type ReactNode } from "react";
import { buildAutoPage, NO_CODE_PREFIX, type AutoInput } from "@/lib/compare/auto";
import { PairView } from "./PairView";
import { useAdjust } from "./useAdjust";
import { useQueryParam } from "./useQueryParam";

/**
 * Automatic comparison (suite V1, decision of Matt 17 h 25): the visitor chooses the plant protein
 * (?proteine=<code>), the whole page is recomputed in the browser from the data of the page (same
 * pure engine as the server). Only the chosen protein is computed: one model per protein would be
 * too heavy to send.
 */
export function AutoPairView({
  input,
  defaultCode,
  wins,
  badge,
  headingAs = "h1",
}: {
  input: AutoInput;
  defaultCode: string;
  wins: { wins: number; total: number } | null;
  badge: ReactNode;
  headingAs?: "h1" | "h2";
}) {
  const [urlCode, setUrlCode] = useQueryParam("proteine");
  const valid = urlCode != null && input.candidates.some((c) => c.code === urlCode);
  const code = valid ? urlCode! : defaultCode;
  const built = useMemo(() => buildAutoPage(input, code), [input, code]);
  const adjust = useAdjust(input, code);
  if (!built) return <p className="px-5">Comparaison indisponible.</p>;
  const names = new Map(input.raw.foods.map((f) => [f.code, f.name_fr]));
  const unmatched = built.unmatched.filter((c) => !c.startsWith(NO_CODE_PREFIX)).map((c) => names.get(c) ?? c);
  const sentence = wins && wins.total > 0 ? `Sur le climat, la version végétale fait mieux avec ${wins.wins} protéine${wins.wins > 1 ? "s" : ""} sur ${wins.total}.` : undefined;
  return (
    <PairView
      model={built.model}
      badge={badge}
      headingAs={headingAs}
      variant={code}
      onVariantChange={(c) => setUrlCode(c === defaultCode ? null : c)}
      choiceSentence={sentence}
      adjusted={adjust.adjusted}
      adjustRequest={adjust.request}
      onAdjust={adjust.setRequest}
      gaps={adjust.gaps}
      notice={
        unmatched.length > 0 ? (
          <p className="m-0 rounded-btn bg-white/8 px-3 py-2">
            Ingrédient animal sans règle de remplacement, laissé tel quel : {unmatched.join(", ")}. La version végétale n’en est donc pas une : signalez-le.
          </p>
        ) : null
      }
    />
  );
}
