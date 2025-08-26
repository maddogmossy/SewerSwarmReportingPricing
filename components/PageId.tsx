// components/PageId.tsx
import React from "react";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

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

export type DevLabelProps = {
  id: string;
  position?: Corner;
  className?: string;
};

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

export type CardIdProps = { id: string; className?: string; position?: Corner };

export function CardId({ id, className = "", position = "top-right" }: CardIdProps) {
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

// Alias so pages can import AutoCardId
export { CardId as AutoCardId };

/**
 * Optional no-op exports so pages that import these don’t break.
 * If you’re not using them, it’s fine to leave as-is.
 */
export function DevCountersProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function AutoDevLabel() {
  return null; // placeholder; we’re using explicit <DevLabel id="P…"/> instead
}

// Also export DevLabel as default so both `import DevLabel …` and `import { DevLabel } …` work
export default DevLabel;