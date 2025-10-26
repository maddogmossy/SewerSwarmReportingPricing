// db/queries.ts
import { db, projects, clients } from "@/db";
import { desc, eq } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  projectId: number | null;
  clientId: number | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date | null;
  project?: { id: number; name: string } | null;
  client?: { id: number; name: string } | null;
};

// Example query for fetching projects
export async function getProjects() {
  return await db.select().from(projects).orderBy(desc(projects.id));
}

// Example query for fetching clients
export async function getClients() {
  return await db.select().from(clients).orderBy(desc(clients.id));
}

// Placeholder for uploads (will be wired up when uploads table is added)
export async function getUploads() {
  return [];
}