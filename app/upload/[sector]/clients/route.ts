// app/api/clients/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // If you have Drizzle set up:
    // const { db } = await import("@/db");
    // const { clients } = await import("@/db/schema");
    // const rows = await db.select().from(clients).limit(200);
    // return NextResponse.json(rows.map(r => ({ id: String(r.id), name: r.name })));

    // Safe fallback for now:
    return NextResponse.json([]);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
