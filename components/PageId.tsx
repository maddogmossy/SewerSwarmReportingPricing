// components/PageId.tsx
"use client";

import React, { createContext, useContext, useRef } from "react";

/* ---------------- Types ---------------- */
type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

type DevLabelProps = {
  id: string;
  position?: Corner;
  className?: string;
};

type CardIdProps = {
  id: string;
  position?: Corner;
  className?: string;
};

/* --------------- Helpers --------------- */
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

/* --------- Manual (explicit) labels ---------- */
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

/* --------------- Global counters --------------- */
type Ctx = {
  nextPageId: () => number;
  nextCardId: () => number;
};

const DevCountersContext = createContext<Ctx | null>(null);

/** Wrap the whole app with this (in app/layout.tsx) to get global, unique IDs. */
export function DevCountersProvider({ children }: { children: React.ReactNode }) {
  // refs persist for the life of the provider (app lifetime)
  const pageRef = useRef(0);
  const cardRef = useRef(0);

  const ctx: Ctx = {
    nextPageId: () => {
      pageRef.current += 1;
      return pageRef.current;
    },
    nextCardId: () => {
      cardRef.current += 1;
      return cardRef.current;
    },
  };

  return <DevCountersContext.Provider value={ctx}>{children}</DevCountersContext.Provider>;
}

function useDevCounters() {
  const ctx = useContext(DevCountersContext);
  if (!ctx) throw new Error("DevCountersProvider missing. Wrap your app in <DevCountersProvider>.");
  return ctx;
}

/* --------------- Auto IDs (global) --------------- */
/** Renders a global unique page label like P1, P2, P3… */
export function AutoDevLabel({ position = "top-right", className = "" }: { position?: Corner; className?: string }) {
  const { nextPageId } = useDevCounters();
  const idRef = useRef<number>();
  if (!idRef.current) idRef.current = nextPageId();
  return <DevLabel id={`P${idRef.current}`} position={position} className={className} />;
}

/** Renders a global unique card label like C1, C2, C3… */
export function AutoCardId({ position = "top-right", className = "" }: { position?: Corner; className?: string }) {
  const { nextCardId } = useDevCounters();
  const idRef = useRef<number>();
  if (!idRef.current) idRef.current = nextCardId();
  return <CardId id={`C${idRef.current}`} position={position} className={className} />;
}