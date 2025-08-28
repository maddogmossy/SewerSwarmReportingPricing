import { getUploadsWithRelations } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function UploadsListPage() {
  const rows = await getUploadsWithRelations();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">P4 · Uploaded Reports</h1>

      {!rows.length ? (
        <p className="text-sm text-gray-600">No uploads yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{r.filename}</div>
                  <div className="text-xs text-gray-500">
                    Sector: {r.sector} · Uploaded: {new Date(r.uploadedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Project: {r.project?.name ?? "—"} (id {r.project?.id ?? "—"}) · Client: {r.client?.name ?? "—"}
                  </div>
                  {r.storagePath && (
                    <div className="text-xs text-gray-500">Path: {r.storagePath}</div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}