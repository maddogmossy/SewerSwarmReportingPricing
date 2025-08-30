// db/queries.ts
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

// Define a type for Upload records
export type UploadWithMeta = {
  id: number;
  sector: string | null;
  client: string | null;
  project: string | null;
  filename: string;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date | null;
};

// Get recent uploads (newest first)
export async function getRecentUploads(limit = 50): Promise<UploadWithMeta[]> {
  const rows = await db
    .select()
    .from(uploads)
    .orderBy(desc(uploads.uploadedAt))
    .limit(limit);

  return rows.map(r => ({
    id: r.id,
    sector: r.sector ?? null,
    client: r.client ?? null,
    project: r.project ?? null,
    filename: r.filename,
    url: r.url,
    pathname: r.pathname,
    size: r.size,
    uploadedAt: r.uploadedAt ? new Date(r.uploadedAt) : null,
  }));
}