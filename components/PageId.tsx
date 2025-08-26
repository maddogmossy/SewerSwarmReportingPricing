// components/PageId.tsx
"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/**
 * DEV-ONLY labels. They auto-number and never render in production.
 *
 * - <AutoDevLabel /> shows P# once per page.
 * - <AutoCardId /> shows C# for each card in render order.
 *
 * If you still pass an explicit id (e.g., <AutoCardId id="S1" />) it wins.
 */

const DevCountersCtx = createContext<{ pageShown: boolean; cardCounter: number } | null>(null);

export function DevCountersProvider({ children }: { children: React.ReactNode }) {
  // Stable counters for a single render tree
  const state = useRef({ pageShown: false, cardCounter: 0 }).current;
  return <DevCountersCtx.Provider value={state}>{children}</DevCountersCtx.Provider>;
}

function useCounters() {
  const ctx = useContext(DevCountersCtx);
  if (!ctx) throw new Error("DevCountersProvider missing — wrap your page <main> with it.");
  return ctx;
}

// Small chip UI
function Chip({ text, className }: { text: string; className?: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span
      className={clsx(
        "pointer-events-none absolute right-3 top-3 rounded-md bg-slate-800/90 px-2 py-1 text-xs font-semibold text-white",
        className
      )}
    >
      {text}
    </span>
  );
}

/** Auto page label: renders once as P# (derived from route hash) */
export function AutoDevLabel({ id }: { id?: string }) {
  if (process.env.NODE_ENV === "production") return null;

  const pathname = usePathname() || "/";
  const { pageShown } = useCounters();
  const shownRef = useRef(false);

  // Create a stable pseudo-number from pathname (same across reloads)
  const pNumber = useMemo(() => {
    let h = 0;
    for (const ch of pathname) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    // keep it short but consistent
    return (h % 97) + 1; // 1..98
  }, [pathname]);

  if (shownRef.current) return null;
  shownRef.current = true;

  return (
    <div className="relative h-0">
      <Chip text={(id ?? `P${pNumber}`)} />
    </div>
  );
}

/** Auto card id: increments per card; explicit id wins (e.g., S1) */
export function AutoCardId({ id }: { id?: string }) {
  if (process.env.NODE_ENV === "production") return null;

  const counters = useCounters();
  const number = useRef<number | null>(null);

  if (!number.current) {
    counters.cardCounter += 1;
    number.current = counters.cardCounter;
  }

  return <Chip text={id ?? `C${number.current}`} />;
}