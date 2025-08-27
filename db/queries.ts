// db/queries.ts
import { db } from "@/db";
import { reportUploads, projects, clients } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

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

/**
 * List uploads with optional filters.
 * If you pass no filters, it returns the most recent uploads (default limit 50).
 */
export async function listUploads(opts?: {
  sector?: string;
  projectId?: number;
  clientId?: number;
  limit?: number;
}): Promise<UploadWithRelations[]> {
  const { sector, projectId, clientId, limit = 50 } = opts ?? {};

  const whereParts = [];
  if (sector) whereParts.push(eq(reportUploads.sector, sector));
  if (projectId != null) whereParts.push(eq(reportUploads.projectId, projectId));
  if (clientId != null) whereParts.push(eq(clients.id, clientId)); // joins below allow this

  const baseSelect = db
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
    .leftJoin(clients, eq(clients.id, projects.clientId));

  const query =
    whereParts.length > 0
      ? baseSelect.where(and(...whereParts))
      : baseSelect;

  const rows = await query.orderBy(desc(reportUploads.uploadedAt)).limit(limit);

  return rows.map((r) => ({
    id: r.id,
    sector: r.sector,
    filename: r.filename,
    storagePath: r.storagePath ?? null,
    uploadedAt: r.uploadedAt as unknown as Date, // drizzle gives Date; keep type friendly

    projectId: r.projectId ?? null,
    projectName: r.projectName ?? null,

    clientId: r.clientId ?? null,
    clientName: r.clientName ?? null,
  }));
}

/** Convenience: most recent uploads (no filters) */
export async function listRecentUploads(limit = 50) {
  return listUploads({ limit });
}