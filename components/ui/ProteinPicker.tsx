"use client";

import { useId, useState } from "react";
import type { Choice } from "@/lib/compare/view";

/**
 * Choice of the plant protein (suite V1, step 3 ter): a list that unfolds in the toolbar, each line
 * with the name, the reason of its rank (proximity, data only) and the protein per 100 g. The
 * reason of the current choice and the climate sentence are written under the toolbar (PairView).
 */
export function ProteinPicker({ choices, value, onChange }: { choices: Choice[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const current = choices.find((c) => c.id === value);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-[6px]">
        <span aria-hidden="true" className="mr-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-on-dark-3">
          Protéine
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => setOpen(!open)}
          className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border border-surface bg-surface px-[14px] text-left text-[14px] font-bold text-ink lg:min-h-9 lg:px-3 lg:text-[13px]"
        >
          <span className="min-w-0">{current?.label ?? "Choisir"}</span>
          <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
          <span className="sr-only">{open ? "fermer la liste des protéines" : `changer de protéine (${choices.length} au choix)`}</span>
        </button>
      </div>
      {open && (
        <ul id={`${id}-list`} aria-label="Protéines végétales, classées par proximité" className="m-0 max-h-[340px] list-none overflow-y-auto rounded-select bg-white/6 p-1">
          {choices.map((c) => {
            const on = c.id === value;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer flex-col gap-[2px] rounded-btn px-3 py-2 text-left ${on ? "bg-surface text-ink" : "text-white hover:bg-white/10"}`}
                >
                  <span className="text-[14px] font-bold">{c.label}</span>
                  <span className={`text-[12px] ${on ? "text-ink-2" : "text-on-dark-2"}`}>
                    {c.reason}
                    {c.detail && !c.reason?.includes("g pour 100 g") && !c.reason?.includes("g de protéines") ? ` · ${c.detail}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
