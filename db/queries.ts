import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listReports() {
  return db.select().from(reports).orderBy(desc(reports.uploadedAt));
}

export async function deleteReport(id: number) {
  return db.delete(reports).where(eq(reports.id, id));
}
