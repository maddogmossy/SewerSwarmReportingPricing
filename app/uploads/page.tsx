// app/uploads/page.tsx
import { getReportUploadsWithRelations } from "@/db/queries";

export const dynamic = "force-dynamic"; // helpful on Vercel to avoid caching

export default async function UploadedReportsPage() {
  const rows = await getReportUploadsWithRelations();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>P4: Uploaded Reports</h1>
      {!rows.length ? (
        <p style={{ color: "#666" }}>No uploads yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Sector</Th>
              <Th>Filename</Th>
              <Th>Client</Th>
              <Th>Project</Th>
              <Th>Uploaded</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <Td>{r.id}</Td>
                <Td>{r.sector}</Td>
                <Td>{r.filename}</Td>
                <Td>{r.client?.name ?? "—"}</Td>
                <Td>{r.project?.name ?? "—"}</Td>
                <Td>{new Date(r.uploadedAt).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "8px 6px" }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 6px" }}>{children}</td>;
}