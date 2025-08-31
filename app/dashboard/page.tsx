import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const rows = await db.select().from(reports).orderBy(desc(reports.uploadedAt)).limit(50);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Uploaded Reports</h1>
      <div className="space-y-4">
        {rows.map(r => (
          <div key={r.id} className="rounded-lg border p-4 bg-white">
            <div className="font-semibold">{r.filename}</div>
            <div className="text-sm text-slate-600">
              Client: {r.clientName} · Project: {r.projectFolder}
            </div>
            <div className="text-xs text-slate-500">{r.url}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
