export const runtime = "nodejs";

import { NextResponse } from "next/server";
// alias → relative
import { db } from "../../../db";
import { reports } from "../../../db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(reports).orderBy(desc(reports.uploadedAt));
  return NextResponse.json({ ok: true, rows });
}
