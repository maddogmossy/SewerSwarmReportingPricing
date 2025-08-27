// app/upload/page.tsx
import { listUploads } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function UploadsPage() {
  const uploads = await listUploads();

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Uploaded Files
      </h1>

      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>When</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Client</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Project</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Sector</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Filename</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Storage Path</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {new Date(u.uploadedAt).toLocaleString()}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {u.clientName ?? "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {u.projectName ?? "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {u.sector}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {u.filename}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee", wordBreak: "break-all" }}>
                  {u.storagePath ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}