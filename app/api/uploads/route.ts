import { NextResponse } from "next/server";
import { db, uploads } from "@/db";

/**
 * Accepts multipart/form-data:
 * - projectId (optional number)
 * - sector (required string)
 * - file (required file) -> we only store file.name; plug storage later
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const sector = String(formData.get("sector") || "").trim();
    const projectIdRaw = formData.get("projectId");
    const file = formData.get("file") as File | null;

    if (!sector) {
      return NextResponse.json({ error: "sector is required" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const projectId = projectIdRaw
      ? Number.isFinite(Number(projectIdRaw)) ? Number(projectIdRaw) : null
      : null;

    // Minimal storage for now: just remember the filename; storagePath can be wired later.
    const storagePath: string | null = null;

    // Shape derived *directly* from the table so TS cannot drift
    const row: typeof uploads.$inferInsert = {
      projectId,                // allowed in schema
      sector,
      filename: file.name,
      storagePath,              // allowed in schema
    };

    await db.insert(uploads).values(row);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed_to_upload" }, { status: 500 });
  }
}