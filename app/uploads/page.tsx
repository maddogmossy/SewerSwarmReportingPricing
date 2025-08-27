// app/uploads/page.tsx
import { getUploadsWithRelations } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function UploadsPage() {
  const uploads = await getUploadsWithRelations();

  return (
    <main style={{ padding: 20 }}>
      <h1>Uploads</h1>
      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <ul style={{ lineHeight: 1.8 }}>
          {uploads.map((u) => (
            <li key={u.id}>
              <strong>{u.filename}</strong> — sector {u.sector}
              {u.project?.name ? ` • project: ${u.project.name}` : ""}
              {u.client?.name ? ` • client: ${u.client.name}` : ""}
              {u.storagePath ? ` • path: ${u.storagePath}` : ""}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}