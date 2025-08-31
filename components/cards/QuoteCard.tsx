// components/cards/QuoteCard.tsx
"use client";
import React from "react";
import DevLabel from "../ui/DevLabel";

export default function QuoteCard() {
  return (
    <div className="relative rounded border p-4">
      {/* Card label (C) tied to this component name.
          Add "component:QuoteCard" in LEGACY_LABELS to turn it grey. */}
      <DevLabel kind="card" keyName="QuoteCard" position="top-left" />
      <div className="font-semibold">Quote</div>
      <p className="text-sm text-slate-600">Auto-priced by Sewer Swarm.</p>
    </div>
  );
}
