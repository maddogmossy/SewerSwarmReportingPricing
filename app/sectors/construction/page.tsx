// app/sectors/adoption/page.tsx
"use client";
import React from "react";
import DevLabel from "../../../components/ui/DevLabel";

export default function ConstructionSector() {
  return (
    <main className="relative max-w-4xl mx-auto px-4 py-10">
      {/* will find "/sectors/adoption" in LEGACY_LABELS and render grey "P2-A".
          If missing, shows a red new S label like "S". */}
      <DevLabel kind="sector" position="top-right" />
      <h1 className="text-3xl font-bold">Adoption</h1>
    </main>
  );
}
