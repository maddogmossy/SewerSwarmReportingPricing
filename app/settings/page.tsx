// app/settings/page.tsx
import Link from "next/link";
import { DevLabel } from "@/components/PageId";

export default function SettingsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 relative">
      <DevLabel id="P-Settings" position="top-right" />
      <h1 className="text-3xl font-bold text-slate-900">Pricing Settings</h1>
      <p className="text-slate-600 mt-2">Customize pricing (placeholder page).</p>
      <div className="mt-6">
        <Link href="/" className="text-primary underline">← Back to Home (P1)</Link>
      </div>
    </main>
  );
}