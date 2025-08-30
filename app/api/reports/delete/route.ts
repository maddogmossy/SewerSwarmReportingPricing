// app/api/reports/delete/route.ts
export const runtime = "nodejs";

import { list, del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Body shapes:
 *  - { mode: "file",    pathname: string }
 *  - { mode: "project", client: string, project: string }
 *  - { mode: "client",  client: string }
 */
const DeleteFile = z.object({
  mode: z.literal("file"),
  pathname: z.string().min(1),
});
const DeleteProject = z.object({
  mode: z.literal("project"),
  client: z.string().min(1),
  project: z.string().min(1),
});
const DeleteClient = z.object({
  mode: z.literal("client"),
  client: z.string().min(1),
});
const Body = z.union([DeleteFile, DeleteProject, DeleteClient]);

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/** Delete a single blob + DB record */
async function deleteOne(pathname: string) {
  // Remove from Blob
  await del(pathname, { token: TOKEN });
  // Remove from DB
  await db.delete(uploads).where(eq(uploads.blobPath, pathname));
}

/** Delete everything under a given prefix (e.g., "Client/Project/" or "Client/") */
async function deleteByPrefix(prefix: string) {
  let cursor: string | undefined;
  let count = 0;

  do {
    const page = await list({ prefix, cursor, token: TOKEN });
    for (const b of page.blobs) {
      await deleteOne(b.pathname);
      count++;
    }
    cursor = page.cursor;
  } while (cursor);

  return count;
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return new Response("Bad JSON", { status: 400 });
  }

  if (!TOKEN) {
    return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
  }

  try {
    const body = parsed.data;

    if (body.mode === "file") {
      await deleteOne(body.pathname);
      return Response.json({ ok: true, mode: "file", deleted: 1 });
    }

    if (body.mode === "project") {
      // Prefix: Client / Project / <files>
      const prefix = `${body.client}/${body.project}/`;
      const deleted = await deleteByPrefix(prefix);
      return Response.json({ ok: true, mode: "project", prefix, deleted });
    }

    if (body.mode === "client") {
      // Prefix: Client / <projects>/<files>
      const prefix = `${body.client}/`;
      const deleted = await deleteByPrefix(prefix);
      return Response.json({ ok: true, mode: "client", prefix, deleted });
    }

    return new Response("Unsupported mode", { status: 400 });
  } catch (err) {
    console.error("Delete error:", err);
    return new Response("Delete failed", { status: 500 });
  }
}
