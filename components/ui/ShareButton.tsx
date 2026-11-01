"use client";

import { useState } from "react";

/** Shares the current page (Web Share API, otherwise copies the link). */
export function ShareButton({ text, className = "" }: { text?: string; className?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text, url });
      } else {
        await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
        setStatus("Lien copié");
      }
    } catch {
      setStatus(null);
    }
  }
  return (
    <>
      <button type="button" onClick={share} aria-label="Partager cette page" className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-btn border-0 bg-white/8 hover:bg-white/15 ${className}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}
