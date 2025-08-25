// components/DevLabel.tsx
import React from "react";

type Props = {
  id: string;
  position?: "top-right" | "top-left" | "inline";
  className?: string;
};

export default function DevLabel({ id, position = "inline", className }: Props) {
  const pos =
    position === "top-right"
      ? "fixed top-2 right-2"
      : position === "top-left"
      ? "fixed top-2 left-2"
      : "";

  return (
    <span
      className={`${pos} inline-flex items-center rounded bg-slate-900 text-white text-[11px] px-2 py-1 shadow ${className || ""}`}
      aria-label={`dev-id-${id}`}
    >
      {id}
    </span>
  );
}