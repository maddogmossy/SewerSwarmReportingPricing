// app/uploads/page.tsx
// Server component (no "use client") so we can query the DB here.

import { db } from "../../db";             // <- relative (two levels up from /app/uploads)
import { reports } from "../../db/schema"; // <- relative

export default async function UploadsPage() {
  // Simple read to prove DB + schema work in prod
  const rows = await db.select().from(reports);

  return (
    <main className="relative min-h-screen p-6">
      <h1 className="text-2xl font-bold">Uploads</h1>

      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">No uploads yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded border p-3">
              <div className="font-medium">{r.filename}</div>
              <div className="text-xs text-gray-500">
                {r.clientName} • {r.sectorTitle} • {r.contentType} • {r.size} bytes
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
