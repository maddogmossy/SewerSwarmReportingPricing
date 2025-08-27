// app/uploads/page.tsx
import { getReportUploadsWithRelations } from "@/db/queries";

export default async function UploadsPage() {
  const uploads = await getReportUploadsWithRelations();

  return (
    <main style={{ padding: 24 }}>
      <h1>Uploads</h1>
      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <ul style={{ lineHeight: 1.7 }}>
          {uploads.map((u) => (
            <li key={u.id}>
              <strong>{u.filename}</strong> — {u.sector}
              {u.project?.name ? <> — Project: {u.project.name}</> : null}
              {u.client?.name ? <> — Client: {u.client.name}</> : null}
              {u.storagePath ? (
                <>
                  {" "}
                  — <code>{u.storagePath}</code>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}