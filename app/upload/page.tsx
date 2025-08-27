// app/upload/page.tsx
import { listUploads } from "@/db/queries";

export default async function UploadsPage() {
  // Fetch all uploads with relations
  const uploads = await listUploads();

  return (
    <main>
      <h1>All Uploads</h1>
      <ul>
        {uploads.map((u) => (
          <li key={u.id}>
            {u.filename} — {u.sector} — Project {u.project?.name ?? "N/A"} — Client {u.client?.name ?? "N/A"}
          </li>
        ))}
      </ul>
    </main>
  );
}