// components/PageId.tsx
import React from "react";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

type DevLabelProps = {
  id: string;
  position?: Corner;      // <-- now supported
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

type CardIdProps = { id: string; className?: string; position?: Corner };
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