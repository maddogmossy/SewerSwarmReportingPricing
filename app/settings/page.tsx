// app/settings/page.tsx
"use client";

import React from "react";
import PageId from "../../components/ui/PageId";

export default function SettingsPage() {
  return (
    <main className="relative min-h-screen p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-4">This is the Settings page.</p>
      <PageId id="Settings" />
    </main>
  );
}
