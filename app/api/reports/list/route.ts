// app/api/reports/list/route.ts
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.uploadedAt))
    .limit(200);

  return Response.json({ ok: true, rows });
}
