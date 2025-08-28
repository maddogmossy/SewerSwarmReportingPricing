import { getUploadsWithRelations } from "@/db/queries";

export default async function UploadedReportsPage() {
  const items = await getUploadsWithRelations();

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">P4 · Uploaded Reports</h1>

      {items.length === 0 ? (
        <p className="text-gray-600">No uploads yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {items.map((u) => (
            <li key={u.id} className="p-4">
              <div className="font-medium">{u.filename}</div>
              <div className="text-sm text-gray-600">
                Sector: {u.sector} · Uploaded: {new Date(u.uploadedAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Project: {u.project?.name ?? "—"} {u.project?.id ? `(ID ${u.project.id})` : ""}
              </div>
              <div className="text-sm text-gray-600">
                Client: {u.client?.name ?? "—"} {u.client?.id ? `(ID ${u.client.id})` : ""}
              </div>
              {u.storagePath && (
                <div className="text-sm text-gray-600">Path: {u.storagePath}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}