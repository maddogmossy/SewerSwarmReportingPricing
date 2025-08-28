import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const projectIdRaw = form.get("projectId");
    const sector = String(form.get("sector") ?? "");
    const file = form.get("file");

    if (!sector) {
      return NextResponse.json({ ok: false, error: "sector is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    // allow null/blank projectId
    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim() !== ""
        ? Number(projectIdRaw)
        : null;

    // wherever you store the blob (S3/etc). null is fine if you haven’t wired storage yet
    const storagePath = null as string | null;

    // The type is derived from the table. If `projectId` or `storagePath` were missing
    // on the table, the next line would be the one TypeScript complains about.
    const row: typeof uploads.$inferInsert = {
      projectId,
      sector,
      filename: file.name,
      storagePath,
      // uploadedAt is DB-defaulted
    };

    await db.insert(uploads).values(row);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}