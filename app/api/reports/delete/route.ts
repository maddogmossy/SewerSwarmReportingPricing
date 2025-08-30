// app/api/reports/delete/route.ts
import { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });

  const body = await req.json().catch(() => null) as { pathname?: string } | null;
  if (!body?.pathname) return new Response("pathname required", { status: 400 });

  await del(body.pathname, { token });
  await db.delete(reports).where(eq(reports.pathname, body.pathname));

  return Response.json({ ok: true });
}
