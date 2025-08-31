// app/settings/page.tsx
"use client";
import React from "react";
import DevLabel from "../../components/ui/DevLabel";

export default function SettingsPage() {
  return (
    <main className="relative max-w-4xl mx-auto px-4 py-10">
      {/* Page label (P). Will use legacy if present, else red P. */}
      <DevLabel kind="page" position="top-right" />
      <h1 className="text-3xl font-bold">Settings</h1>
    </main>
  );
}
