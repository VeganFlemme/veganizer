"use client";

import { useCallback, useSyncExternalStore } from "react";

// A URL search parameter as React state, without making the page dynamic: the static HTML is
// rendered with the default value, the browser then reads the real URL (history API).
const EVENT = "veganizer:url";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function useQueryParam(name: string, enabled = true): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (enabled ? new URLSearchParams(window.location.search).get(name) : null),
    () => null,
  );
  const set = useCallback(
    (next: string | null) => {
      if (!enabled) return;
      const url = new URL(window.location.href);
      if (next == null) url.searchParams.delete(name);
      else url.searchParams.set(name, next);
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event(EVENT));
    },
    [name, enabled],
  );
  return [value, set];
}
