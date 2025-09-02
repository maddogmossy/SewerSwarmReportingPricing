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
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
}

export default async function UploadedReportsPage() {
  let rows: Row[] = [];

  // Try to read from your existing Drizzle setup if present.
  try {
    // @ts-ignore - dynamic import to avoid build-time resolution if not present
    const { db } = await import("@/db");
    // @ts-ignore
    const { uploads } = await import("@/db/schema");
    // @ts-ignore
    const { desc } = await import("drizzle-orm");

    // @ts-ignore
    rows = await db.select().from(uploads)
      // @ts-ignore
      .orderBy(desc(uploads.uploadedAt ?? uploads.id))
      .limit(50);
  } catch {
    rows = []; // No DB available at build-time; render empty state.
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Uploaded Reports</h1>
          <div className="rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">P4</div>
        </div>
        <p className="mt-2 text-gray-600">Lists the files you’ve uploaded by sector (newest first).</p>

        <div className="mt-6 divide-y">
          {rows.length === 0 && <p className="text-gray-600">No uploads yet.</p>}
          {rows.map((r) => {
            const name = r.originalName ?? r.fileName ?? r.objectKey ?? "file";
            const sector = (r.sector || "").toUpperCase();
            return (
              <div key={String(r.id)} className="py-5">
                <div className="text-lg font-semibold">{name}</div>
                <div className="mt-1 text-gray-700">Sector: <span className="font-medium">{sector || "—"}</span></div>
                <div className="text-gray-600">Uploaded: {fmt(r.uploadedAt) || "—"}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
