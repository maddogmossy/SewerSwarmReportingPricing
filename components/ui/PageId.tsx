// components/ui/PageId.tsx
"use client";
import React from "react";

export type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export default function PageId({
  id,
  corner = "top-right",
  className = "",
}: {
  id: string;
  corner?: Corner;
  className?: string;
}) {
  const positionClass =
    corner === "top-right" ? "top-2 right-2" :
    corner === "top-left" ? "top-2 left-2" :
    corner === "bottom-right" ? "bottom-2 right-2" :
    "bottom-2 left-2";

  return (
    <span
      className={`absolute ${positionClass} z-50 text-xs font-bold px-2 py-1 rounded shadow ${className}`}
      aria-label="Dev Label"
    >
      {id}
    </span>
  );
}
