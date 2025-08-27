// app/uploads/page.tsx
import { listUploads } from "@/db/queries";

export default async function UploadsPage() {
  const uploads = await listUploads();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>All Uploads</h1>
      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>File</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Sector</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Project</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Client</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((u) => (
              <tr key={u.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.filename}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.sector}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.projectName || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.clientName || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.uploadedAt ? new Date(u.uploadedAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}