// db/queries.ts
import { db } from "@/db";
import { reportUploads, projects, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  sector: string;
  filename: string;
  storagePath: string | null;
  uploadedAt: Date;
  projectId: number | null;
  projectName: string | null;
  clientName: string | null;
};

export async function getReportUploadsWithRelations(): Promise<UploadWithRelations[]> {
  const rows = await db
    .select({
      id: reportUploads.id,
      sector: reportUploads.sector,
      filename: reportUploads.filename,
      storagePath: reportUploads.storagePath,
      uploadedAt: reportUploads.uploadedAt,
      projectId: reportUploads.projectId,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(reportUploads)
    .leftJoin(projects, eq(projects.id, reportUploads.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(reportUploads.uploadedAt));

  return rows.map(r => ({
    id: r.id,
    sector: r.sector,
    filename: r.filename,
    storagePath: r.storagePath,
    uploadedAt: r.uploadedAt,
    projectId: r.projectId,
    projectName: r.projectName ?? null,
    clientName: r.clientName ?? null,
  }));
}