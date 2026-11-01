import type { ReactNode } from "react";

/** Dark band continuing the header, with the page title (text pages). */
export function PageHero({ title, children, badge }: { title: string; children?: ReactNode; badge?: string }) {
  return (
    <section className="on-dark bg-ink text-white">
      <div className="mx-auto flex max-w-[1440px] min-[1440px]:px-12 flex-col gap-4 px-5 pb-8 pt-2 md:px-8 md:pb-10 md:pt-6">
        {badge && <span className="self-start rounded-full bg-white/8 px-3 py-1 text-[13px] font-bold text-on-dark-1">{badge}</span>}
        <h1 className="m-0 text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[52px]">{title}</h1>
        {children && <div className="flex max-w-[760px] flex-col gap-2 text-[16px] leading-normal text-on-dark-2 [&_a]:text-on-dark-1 [&_a]:underline [&_a:hover]:text-white">{children}</div>}
      </div>
    </section>
  );
}

/**
 * Readable column for long texts (methodology, legal pages). With `toc`, from 1 024 px the table of
 * contents is a left column, sticky while scrolling, and lines stay about 70 characters wide.
 */
export function Prose({ children, toc }: { children: ReactNode; toc?: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10 min-[1440px]:px-12">
      {/* Long tables of contents scroll; the fade says there is more (designer review, 2nd pass). */}
      {toc && <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-10 lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]">{toc}</div>}
      <div className={`flex max-w-[760px] flex-col gap-6 text-[16px] leading-normal [&_a]:underline [&_code]:[overflow-wrap:anywhere] lg:max-w-[72ch] ${toc ? "" : "lg:col-span-2"}`}>{children}</div>
    </div>
  );
}

/** A section of a text page, on a white panel. */
export function ProseSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3 rounded-panel bg-surface p-5 md:p-6">
      <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] md:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}
