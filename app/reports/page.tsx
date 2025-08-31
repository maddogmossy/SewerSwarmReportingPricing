import { db } from "@/db";
import { desc } from "drizzle-orm";
import { reports } from "@/db/schema";

export const runtime = "nodejs";

export default async function Reports() {
  const rows = await db.select().from(reports).orderBy(desc(reports.uploadedAt)).limit(50);
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Latest uploads</h1>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.id} className="border p-3 rounded">
            <div className="font-mono text-sm">{r.sectorCode} / {r.sectorTitle}</div>
            <div className="text-sm">{r.clientName} — {r.projectFolder}</div>
            <div className="text-sm">{r.filename} ({r.contentType}, {r.size} bytes)</div>
            <a className="text-blue-600 underline" href={r.url} target="_blank">Open file</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
