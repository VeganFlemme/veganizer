"use client";

import type { KeyboardEvent } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

export const tabId = (base: string, id: string) => `${base}-onglet-${id}`;
export const panelId = (base: string, id: string) => `${base}-panneau-${id}`;

/** role="tablist", sticky, horizontal scroll on phones; arrows, Home and End move between tabs. */
export function TabBar<T extends string>({ tabs, active, onChange, base, label }: { tabs: TabDef<T>[]; active: T; onChange: (id: T) => void; base: string; label: string }) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === active);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length];
    onChange(t.id);
    document.getElementById(tabId(base, t.id))?.focus();
  }
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-surface">
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="mx-auto flex max-w-[1200px] gap-[6px] overflow-x-auto px-5 py-3 md:gap-2 md:px-8">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={tabId(base, t.id)}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={panelId(base, t.id)}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={`h-11 flex-none cursor-pointer whitespace-nowrap rounded-full border px-[14px] text-[14px] font-bold md:px-[18px] md:text-[15px] ${
                on ? "border-ink bg-ink text-white" : "border-[#C9D5D0] bg-surface text-ink hover:border-ink-3"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
