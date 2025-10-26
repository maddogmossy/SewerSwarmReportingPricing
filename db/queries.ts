// db/queries.ts
import { db } from "@/db";
import { desc } from "drizzle-orm";

export type UploadWithRelations = {
  id: number;
  projectId: number | null;
  clientId: number | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date | null;
};

// Minimal example query — adjust later when tables are ready
export async function getProjects() {
  return await db.query ? await db.query("SELECT 1") : [];
}

export async function getClients() {
  return await db.query ? await db.query("SELECT 1") : [];
}

export async function getUploads() {
  return [];
}