export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { pingDb } from "@/db/client";

export async function GET() {
  try {
    const ok = await pingDb();
    return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
  } catch (e: any) {
    console.error("HEALTH_ERROR:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
