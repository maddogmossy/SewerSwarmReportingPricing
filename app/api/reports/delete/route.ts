// app/api/reports/delete/route.ts
export const runtime = "nodejs";

import { db } from "@/db";
import { reports } from "@/db/schema";
import { and, eq, like } from "drizzle-orm";
import { del } from "@vercel/blob";

type Body =
  | { mode: "file"; pathname: string }
  | { mode: "project"; client: string; project: string }
  | { mode: "client"; client: string };

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (body.mode === "file") {
    // delete blob and its DB row
    await del(body.pathname, { token });
    await db.delete(reports).where(eq(reports.pathname, body.pathname));
    return Response.json({ ok: true, deleted: 1 });
  }

  if (body.mode === "project") {
    // find all files for client/project; delete each blob; then DB rows
    const rows = await db
      .select()
      .from(reports)
      .where(and(eq(reports.clientName, body.client), eq(reports.projectFolder, body.project)));

    for (const r of rows) await del(r.pathname, { token });
    await db
      .delete(reports)
      .where(and(eq(reports.clientName, body.client), eq(reports.projectFolder, body.project)));
    return Response.json({ ok: true, deleted: rows.length });
  }

  if (body.mode === "client") {
    const rows = await db.select().from(reports).where(eq(reports.clientName, body.client));
    for (const r of rows) await del(r.pathname, { token });
    await db.delete(reports).where(eq(reports.clientName, body.client));
    return Response.json({ ok: true, deleted: rows.length });
  }

  return new Response("Unknown mode", { status: 400 });
}
