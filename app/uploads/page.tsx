// app/uploads/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";

export default function UploadedReportsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 relative">
      <DevLabel id="P4" position="top-left" />

      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C5" />
        <h1 className="text-2xl font-extrabold text-slate-900">Uploaded Reports</h1>
        <p className="mt-2 text-slate-600">
          This will list client → project → files after we wire storage & database.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
        </div>
      </section>
    </main>
  );
}