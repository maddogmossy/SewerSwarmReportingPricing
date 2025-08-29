// app/uploads/page.tsx
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

type Row = {
  id: number | string;
  sector?: string | null;
  uploadedAt?: Date | string | null;
  originalName?: string | null;
  fileName?: string | null;
  objectKey?: string | null;
};

function fmt(d?: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString();
}

export default async function UploadedReportsPage() {
  // Pull the most recent uploads (newest first)
  const rows = (await db
    .select()
    .from(uploads)
    .orderBy(desc((uploads as any).uploadedAt ?? (uploads as any).id))
    .limit(50)) as Row[];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Uploaded Reports</h1>
          <div className="rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            P4
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          Lists the files you’ve uploaded by sector (newest first).
        </p>

        <div className="mt-6 divide-y">
          {rows.length === 0 && (
            <p className="text-gray-600">No uploads yet.</p>
          )}
          {rows.map((r) => {
            const name = r.originalName ?? r.fileName ?? r.objectKey ?? "file";
            const sector =
              (r.sector || "").toUpperCase(); // e.g., "S1"
            return (
              <div key={String(r.id)} className="py-5">
                <div className="text-lg font-semibold">{name}</div>
                <div className="mt-1 text-gray-700">
                  Sector: <span className="font-medium">{sector || "—"}</span>
                </div>
                <div className="text-gray-600">
                  Uploaded: {fmt(r.uploadedAt) || "—"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
