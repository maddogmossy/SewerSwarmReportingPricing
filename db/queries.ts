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

// List all uploads (newest first)
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

  return rows;
}

// List uploads filtered by sector (e.g., "S1")
export async function listUploadsBySector(sector: string): Promise<UploadWithRelations[]> {
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
    .where