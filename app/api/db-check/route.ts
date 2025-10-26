// app/api/db-check/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const result = await db.execute("SELECT NOW();");
    return NextResponse.json({ status: "connected", result });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}