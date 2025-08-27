// app/uploads/page.tsx
import { getReportUploadsWithRelations } from "@/db/queries";

export default async function UploadedReportsPage() {
  const uploads = await getReportUploadsWithRelations();

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Uploaded Reports</h1>

      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <ul className="space-y-4">
          {uploads.map(u => (
            <li key={u.id} className="border rounded p-4">
              <div className="font-medium">{u.filename}</div>
              <div className="text-sm text-gray-600">
                Sector: {u.sector}
                {u.clientName ? ` • Client: ${u.clientName}` : ""}
                {u.projectName ? ` • Project: ${u.projectName}` : ""}
              </div>
              {u.storagePath && (
                <div className="text-xs text-gray-500 break-all mt-1">
                  {u.storagePath}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Uploaded: {new Date(u.uploadedAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}