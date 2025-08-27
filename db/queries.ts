// db/queries.ts
import { db } from "@/db";
import { reportUploads, projects, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  filename: string;
  sector: string;
  uploadedAt: Date | null;
  projectId: number | null;
  projectName: string | null;
  clientName: string | null;
};

export async function listUploads(): Promise<UploadWithRelations[]> {
  const rows = await db
    .select({
      id: reportUploads.id,
      filename: reportUploads.filename,
      sector: reportUploads.sector,
      uploadedAt: reportUploads.uploadedAt,
      projectId: reportUploads.projectId,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(reportUploads)
    .leftJoin(projects, eq(projects.id, reportUploads.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(reportUploads.uploadedAt));

  return rows;
}