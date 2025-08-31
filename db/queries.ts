// db/queries.ts
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getRecentReports(limit = 20) {
  return db.select().from(reports).orderBy(desc(reports.uploadedAt)).limit(limit);
}

export async function deleteReportById(id: number) {
  return db.delete(reports).where(eq(reports.id, id)).returning();
}
