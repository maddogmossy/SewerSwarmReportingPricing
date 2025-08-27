// db/queries.ts
import { db } from "@/db";
import { uploadsTable, projects, clients } from "@/db/schema";
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
      id: uploadsTable.id,
      sector: uploadsTable.sector,
      filename: uploadsTable.filename,
      storagePath: uploadsTable.storagePath,
      uploadedAt: uploadsTable.uploadedAt,
      projectId: uploadsTable.projectId,
      projectName: projects.name,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(uploadsTable)
    .leftJoin(projects, eq(projects.id, uploadsTable.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(uploadsTable.uploadedAt));

  return rows.map((r) => ({
    id: r.id,
    sector: r.sector,
    filename: r.filename,
    storagePath: r.storagePath,
    uploadedAt: r.uploadedAt,
    project: r.projectId ? { id: r.projectId, name: r.projectName ?? null } : null,
    client: r.clientId ? { id: r.clientId, name: r.clientName ?? null } : null,
  }));
}