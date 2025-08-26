// components/PageId.tsx
"use client";

import React, { createContext, useContext, useRef } from "react";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type DevLabelProps = {
  id: string;
  position?: Corner;
  className?: string;
};

export type CardIdProps = {
  id: string;
  position?: Corner;
  className?: string;
};

function cornerToClasses(pos: Corner = "top-right") {
  switch (pos) {
    case "top-left":
      return "left-3 top-3";
    case "bottom-right":
      return "right-3 bottom-3";
    case "bottom-left":
      return "left-3 bottom-3";
    default:
      return "right-3 top-3";
  }
}

/** Manual page label (e.g. <DevLabel id="P1" />) */
export function DevLabel({ id, position = "top-right", className = "" }: DevLabelProps) {
  return (
    <span
      className={[
        "absolute rounded-md bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white shadow",
        cornerToClasses(position),
        className,
      ].join(" ")}
    >
      {id}
    </span>
  );
}

/** Manual card label (e.g. <CardId id="C3" />) */
export function CardId({ id, position = "top-right", className = "" }: CardIdProps) {
  return (
    <span
      className={[
        "absolute rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white shadow",
        cornerToClasses(position),
        className,
      ].join(" ")}
    >
      {id}
    </span>
  );
}

/* -----------------------------------------------------------
   Auto counters (optional): AutoDevLabel / AutoCardId
   These generate P1, P2... and C1, C2... automatically.
   Works with DevCountersProvider; also has a global fallback.
----------------------------------------------------------- */

type CtxType = { getNext: (prefix: string) => number };
const Ctx = createContext<CtxType | null>(null);

export function DevCountersProvider({ children }: { children: React.ReactNode }) {
  const countersRef = useRef<Record<string, number>>({});

  const getNext = (prefix: string) => {
    countersRef.current[prefix] = (countersRef.current[prefix] ?? 0) + 1;
    return countersRef.current[prefix];
  };

  return <Ctx.Provider value={{ getNext }}>{children}</Ctx.Provider>;
}

// Fallback global counters if provider is not used
const globalCounts: Record<string, number> = {};

function useStableAutoNumber(prefix: string) {
  const ctx = useContext(Ctx);
  const getNext = ctx?.getNext ?? ((p: string) => {
    globalCounts[p] = (globalCounts[p] ?? 0) + 1;
    return globalCounts[p];
  });

  // Ensure the number is stable per component instance
  const nRef = useRef<number | null>(null);
  if (nRef.current === null) {
    nRef.current = getNext(prefix);
  }
  return nRef.current;
}

/** Automatically renders P1, P2, ... */
export function AutoDevLabel({
  position = "top-right",
  className = "",
}: Omit<DevLabelProps, "id">) {
  const n = useStableAutoNumber("P");
  return <DevLabel id={`P${n}`} position={position} className={className} />;
}

/** Automatically renders C1, C2, ... */
export function AutoCardId({
  position = "top-right",
  className = "",
}: Omit<CardIdProps, "id">) {
  const n = useStableAutoNumber("C");
  return <CardId id={`C${n}`} position={position} className={className} />;
}