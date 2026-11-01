"use client";

import { useEffect, useMemo } from "react";
import { adjustParams, baseGaps, buildAdjusted, parseAdjust, ADJUST_ALL, type AutoInput } from "@/lib/compare/auto";
import type { AdjustRequest } from "@/lib/scoring";
import { useQueryParam } from "./useQueryParam";

/**
 * Step 3 quinquies: the adjustment of the plant version, kept in the URL (?ajuste=, ?quantite=),
 * computed in the browser. The old ?vue=complete becomes ?ajuste=tout.
 */
export function useAdjust(input: AutoInput | null, code: string | null, enabled = true) {
  const [ajuste, setAjuste] = useQueryParam("ajuste", enabled);
  const [quantite, setQuantite] = useQueryParam("quantite", enabled);
  const [vue, setVue] = useQueryParam("vue", enabled);
  useEffect(() => {
    if (vue === "complete") {
      setVue(null);
      setAjuste(ADJUST_ALL);
    }
  }, [vue, setVue, setAjuste]);
  const request = parseAdjust(vue === "complete" ? ADJUST_ALL : ajuste, quantite);
  const key = `${ajuste ?? ""}|${quantite ?? ""}|${vue ?? ""}`;
  const adjusted = useMemo(() => (input && code && request ? buildAdjusted(input, code, request) : null), [input, code, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const gaps = useMemo(() => (input && code ? baseGaps(input, code) : []), [input, code]);
  const setRequest = (r: AdjustRequest | null) => {
    const p = adjustParams(r);
    setAjuste(p.ajuste);
    setQuantite(p.quantite);
  };
  return { request, setRequest, adjusted, gaps };
}
