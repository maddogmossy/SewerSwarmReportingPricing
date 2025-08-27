// app/uploads/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function UploadedReportsPage() {
  // Fetch uploads newest → oldest
  const rows = await db
    .select()
    .from(uploads)
    .orderBy(desc(uploads.uploadedAt ?? uploads.id)); // fallback to id if uploadedAt not in schema

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <DevLabel id="P4" />

      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C5" />
        <h1 className="text-2xl font-extrabold text-slate-900">Uploaded Reports</h1>
        <p className="mt-2 text-slate-600">
          Lists the files you’ve uploaded by sector (newest first).
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 text-slate-500">No uploads yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-200">
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{r.filename}</div>
                  <div className="text-sm text-slate-600">
                    Sector: <span className="font-semibold">{r.sector}</span>
                    {r.projectId ? (
                      <> · Project ID: <span className="font-mono">{r.projectId}</span></>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">
                    Uploaded:{" "}
                    {r.uploadedAt
                      ? new Date(r.uploadedAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex gap-4">
          <Link href="/upload" className="text-blue-600 hover:underline">
            ← Back to sectors
          </Link>
        </div>
      </section>
    </main>
  );
}