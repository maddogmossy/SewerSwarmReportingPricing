"use client";

import * as React from "react";

type Position =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const posClass: Record<Position, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

export function DevLabel({
  id,
  position = "top-right",
  title = "Page",
}: {
  id: string;
  position?: Position;
  title?: string;
}) {
  return (
    <span
      className={`pointer-events-none select-none fixed z-50 rounded-md border border-slate-300 bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm ${posClass[position]}`}
      aria-hidden="true"
    >
      {title}: <span className="ml-1 text-primary">{id}</span>
    </span>
  );
}

// Also default-export to be safe if someone does `import DevLabel from ...`
export default DevLabel;