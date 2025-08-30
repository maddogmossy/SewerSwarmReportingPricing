// db/queries.ts
import { db } from "@/db";
import { uploads, projects, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Define a type for joined uploads with relations
export type UploadWithRelations = {
  id: number;
  sector: string;
  client: string;
  project: string;
  filename: string;
  url: string;
  pathname: string;
  size: number | null;
  uploadedAt: Date;
};

// Get recent uploads (default limit 100)
export async function getRecentUploads(limit = 100): Promise<UploadWithRelations[]> {
  const rows = await db
    .select()
    .from(uploads)
    .orderBy(desc(uploads.uploadedAt))
    .limit(limit);

  return rows.map(r => ({
    id: r.id,
    sector: r.sector,
    client: r.client,
    project: r.project,
    filename: r.filename,
    url: r.url,
    pathname: r.pathname,
    size: r.size ?? null,
    uploadedAt: r.uploadedAt,
  }));
}

// Get projects for a given client
export async function getProjectsForClient(clientName: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.client, clientName))
    .orderBy(desc(projects.createdAt));
}

// Get all clients
export async function getClients() {
  return db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));
}