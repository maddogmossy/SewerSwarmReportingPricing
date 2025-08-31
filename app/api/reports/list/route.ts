export const runtime = "nodejs";

import { NextResponse } from "next/server";
// swap alias to relative:
import { db } from "../../../db";
import { reports } from "../../../db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.uploadedAt));

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    console.error("LIST_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "List failed" },
      { status: 500 }
    );
  }
}
