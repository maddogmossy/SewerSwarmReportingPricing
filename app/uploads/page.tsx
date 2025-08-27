// app/uploads/page.tsx
import { getUploadsWithRelations } from "@/db/queries";

export default async function UploadsPage() {
  const items = await getUploadsWithRelations();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Uploaded Reports</h1>
      <div className="mt-6 space-y-4">
        {items.length === 0 && <p>No uploads yet.</p>}
        {items.map((u) => (
          <div key={u.id} className="rounded border p-4">
            <div className="font-mono text-sm">{u.filename}</div>
            <div className="text-slate-600">
              Sector: <b>{u.sector}</b>
              {" · "}
              Project: <b>{u.project?.name ?? "—"}</b>
              {" · "}
              Client: <b>{u.client?.name ?? "—"}</b>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Path: {u.storagePath ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}