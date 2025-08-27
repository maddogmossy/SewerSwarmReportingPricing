import { reportUploads as uploads } from "@/db/schema";
import { clients, projects, uploads } from "@/db/schema";
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

export async function getUploadsWithRelations(): Promise<UploadWithRelations[]> {
  const rows = await db
    .select({
      id: uploads.id,
      sector: uploads.sector,
      filename: uploads.filename,
      storagePath: uploads.storagePath,
      uploadedAt: uploads.uploadedAt,
      projectId: projects.id,
      projectName: projects.name,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(uploads)
    .leftJoin(projects, eq(uploads.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(desc(uploads.uploadedAt));

  return rows;
}