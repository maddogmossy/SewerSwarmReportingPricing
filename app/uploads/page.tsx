// app/uploads/page.tsx
import Link from "next/link";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";
import { DevLabel, CardId } from "@/components/PageId";

export const dynamic = "force-dynamic"; // always fetch fresh data

function fmt(dt?: Date | null) {
  if (!dt) return "—";
  // short, locale-friendly date/time
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export default async function UploadedReportsPage() {
  // Pull the most recent 50 uploads
  const rows = await db
    .select()
    .from(uploads)
    .orderBy(desc(uploads.uploadedAt))
    .limit(50);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <DevLabel id="P4" />

      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C5" />
        <h1 className="text-2xl font-extrabold text-slate-900">Uploaded Reports</h1>
        <p className="mt-2 text-slate-600">
          Latest uploads across all sectors. (Shows up to 50 most recent.)
        </p>
        <div className="mt-4">
          <Link href="/upload" className="text-blue-600 hover:underline">
            ← Back to sectors
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-slate-600">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b px-3 py-2">#</th>
                  <th className="border-b px-3 py-2">Sector</th>
                  <th className="border-b px-3 py-2">Filename</th>
                  <th className="border-b px-3 py-2">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="odd:bg-slate-50">
                    <td className="border-b px-3 py-2 tabular-nums">{idx + 1}</td>
                    <td className="border-b px-3 py-2 font-semibold">{r.sector}</td>
                    <td className="border-b px-3 py-2">{r.filename}</td>
                    <td className="border-b px-3 py-2">{fmt(r.uploadedAt as any)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}