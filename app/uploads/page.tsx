// app/uploads/page.tsx
import { getReportUploadsWithRelations } from "@/db/queries";

export const revalidate = 0; // keep it simple during dev

export default async function UploadsPage() {
  const rows = await getReportUploadsWithRelations();

  return (
    <main style={{ padding: 24 }}>
      <h1>Uploaded Reports</h1>
      {rows.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>When</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Sector</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Filename</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Project</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Client</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Storage Path</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>{new Date(r.uploadedAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{r.sector}</td>
                <td style={{ padding: 8 }}>{r.filename}</td>
                <td style={{ padding: 8 }}>{r.project?.name ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.client?.name ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.storagePath ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}