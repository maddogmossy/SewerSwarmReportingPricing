// app/reports/page.tsx
import Link from "next/link";
import { DevLabel } from "@/components/PageId";

export default function ReportsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 relative">
      <DevLabel id="P-Reports" position="top-right" />
      <h1 className="text-3xl font-bold text-slate-900">Uploaded Reports</h1>
      <p className="text-slate-600 mt-2">Report management (placeholder page).</p>
      <div className="mt-6">
        <Link href="/" className="text-primary underline">← Back to Home (P1)</Link>
      </div>
    </main>
  );
}