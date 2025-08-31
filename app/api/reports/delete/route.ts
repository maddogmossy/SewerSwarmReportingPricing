export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { reports } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await db.delete(reports).where(eq(reports.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE_ERROR:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Delete failed" }, { status: 500 });
  }
}
