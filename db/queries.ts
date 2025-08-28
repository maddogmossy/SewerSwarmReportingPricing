import { db, uploads, projects, clients } from "@/db";
import { desc, eq } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  sector: string;
  filename: string;
  storagePath: string | null;
  uploadedAt: Date;
  project: { id: number | null; name: string | null } | null;
  client: { id: number | null; name: string | null } | null;
};

export async function getUploadsWithRelations(): Promise<UploadWithRelations[]> {
  const rows = await db
    .select({
      id: uploads.id,
      sector: uploads.sector,
      filename: uploads.filename,
      storagePath: uploads.storagePath,
      uploadedAt: uploads.uploadedAt,
      projectId: uploads.projectId,
      projectName: projects.name,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(uploads)
    .leftJoin(projects, eq(projects.id, uploads.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(uploads.uploadedAt));

  return rows.map(r => ({
    id: r.id,
    sector: r.sector,
    filename: r.filename,
    storagePath: r.storagePath,
    uploadedAt: r.uploadedAt,
    project: r.projectId ? { id: r.projectId, name: r.projectName ?? null } : null,
    client: r.clientId ? { id: r.clientId, name: r.clientName ?? null } : null,
  }));
}