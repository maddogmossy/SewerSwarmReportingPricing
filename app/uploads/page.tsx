// app/uploads/page.tsx
import { getUploadsWithRelations } from "@/db/queries";

export default async function UploadsPage() {
  const list = await getUploadsWithRelations();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Uploads</h1>
      <ul className="space-y-2">
        {list.map((u) => (
          <li key={u.id} className="border p-3 rounded">
            <div className="font-medium">{u.filename}</div>
            <div className="text-sm text-gray-500">
              sector: {u.sector} · path: {u.storagePath ?? "(none)"} · uploaded:{" "}
              {new Date(u.uploadedAt).toLocaleString()}
            </div>
            <div className="text-sm">
              project: {u.project?.name ?? "(none)"} · client: {u.client?.name ?? "(none)"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}