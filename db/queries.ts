// db/queries.ts
import { db } from "@/db";
import { clients, projects, reportUploads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  sector: string;
  filename: string;
  storagePath: string | null;
  uploadedAt: Date;
  projectId: number | null;
  projectName: string | null;
  clientId: number | null;
  clientName: string | null;
};

// Simple list with client/project names
export async function listUploads(): Promise<UploadWithRelations[]> {
  const rows = await db
    .select({
      id: reportUploads.id,
      sector: reportUploads.sector,
      filename: reportUploads.filename,
      storagePath: reportUploads.storagePath,
      uploadedAt: reportUploads.uploadedAt,
      projectId: reportUploads.projectId,
      projectName: projects.name,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(reportUploads)
    .leftJoin(projects, eq(projects.id, reportUploads.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(reportUploads.uploadedAt));

  return rows.map((r) => ({
    id: r.id,
    sector: r.sector,
    filename: r.filename,
    storagePath: r.storagePath,
    uploadedAt: r.uploadedAt,
    projectId: r.projectId,
    projectName: r.projectName ?? null,
    clientId: r.clientId ?? null,
    clientName: r.clientName ?? null,
  }));
}