// app/api/reports/list/route.ts
export const runtime = "nodejs";

import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(reports).orderBy(desc(reports.id));
  return Response.json({ ok: true, rows });
}
