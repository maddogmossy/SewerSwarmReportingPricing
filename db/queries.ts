// db/queries.ts
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Define a type for joined uploads with relations
export type UploadWithRelations = {
  id: number;
  sector: any;
  client: any;
  project: any;
  filename: string;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date | null;  // ✅ allow null here
};

/**
 * Get latest uploads (newest first).
 */
export async function getLatestUploads(limit = 50): Promise<UploadWithRelations[]> {
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
    size: r.size,
    uploadedAt: r.uploadedAt, // ✅ now matches Date | null
  }));
}

/**
 * Delete uploads by client, project, or specific file.
 */
export async function deleteUploads(
  mode: "file" | "project" | "client",
  value: string
) {
  if (mode === "file") {
    return db.delete(uploads).where(eq(uploads.pathname, value));
  }
  if (mode === "project") {
    return db.delete(uploads).where(eq(uploads.project, value));
  }
  if (mode === "client") {
    return db.delete(uploads).where(eq(uploads.client, value));
  }
}