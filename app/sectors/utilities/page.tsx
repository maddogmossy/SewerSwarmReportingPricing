"use client";
import React from "react";
import DevLabel from "../../../components/ui/DevLabel"; // <-- add this

export default function UtilitiesSector() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 relative">
      <DevLabel id="P2-U" position="top-right" />
      <h1 className="text-3xl font-bold">Utilities</h1>
      <p className="text-slate-600 mt-2">WRc SRM standards.</p>
    </main>
  );
}
