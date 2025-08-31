// app/api/health/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pingDb } from "@/db/client";

export async function GET() {
  try {
    const ok = await pingDb();
    if (!ok) throw new Error("Ping failed");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("HEALTH_ERROR:", e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
