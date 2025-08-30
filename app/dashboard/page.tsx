// app/dashboard/page.tsx
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const rows = await db
    .select()
    .from(uploads)
    .orderBy(desc(uploads.uploadedAt))
    .limit(100);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Uploaded Reports</h1>
      <p className="text-slate-600 mb-6">
        Newest first. Source: <code>uploads</code> table.
      </p>

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.filename}</div>
              <div className="text-sm text-slate-500">{r.sector}</div>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Client: <b>{r.client}</b> · Project: <b>{r.project}</b>
            </div>
            <div className="text-xs text-slate-500 mt-1 break-all">{r.pathname}</div>
            <div className="text-xs text-slate-500 mt-1">
              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : "Unknown"}
            </div>
            <a
              className="text-blue-600 text-sm mt-2 inline-block"
              href={r.url}
              target="_blank"
              rel="noreferrer"
            >
              Open file
            </a>
          </div>
        ))}
        {!rows.length && <div className="text-slate-500">No uploads yet.</div>}
      </div>
    </main>
  );
}