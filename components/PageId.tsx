// components/PageId.tsx
"use client";
import React from "react";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export default function PageId({
  id,
  corner = "top-right",
}: {
  id: string;
  corner?: Corner;
}) {
  const position = {
    "top-right": "top-2 right-2",
    "top-left": "top-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
  }[corner];

  return (
    <div className={`absolute ${position} bg-gray-800 text-white text-xs px-2 py-1 rounded`}>
      {id}
    </div>
  );
}
