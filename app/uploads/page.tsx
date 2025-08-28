import { getUploadsWithRelations } from "@/db/queries";

export default async function UploadsPage() {
  const data = await getUploadsWithRelations();

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Uploaded Reports</h1>
      <ul className="space-y-3">
        {data.map((u) => (
          <li key={u.id} className="border rounded p-3">
            <div className="font-medium">{u.filename}</div>
            <div className="text-sm text-gray-600">
              Sector: {u.sector} • Uploaded: {new Date(u.uploadedAt).toLocaleString()}
            </div>
            <div className="text-sm">
              Project: {u.project?.name ?? "—"} • Client: {u.client?.name ?? "—"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}