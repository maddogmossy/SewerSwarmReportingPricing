import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, __SCHEMA_MARK } from "@/db/schema";

export async function POST(req: Request) {
  try {
    // guard: prove the right schema file is imported
    if (__SCHEMA_MARK !== "ROOT_DB_SCHEMA") {
      return NextResponse.json({ ok: false, error: "Wrong schema module loaded" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const sector = (form.get("sector") as string | null) ?? "";
    const projectIdRaw = form.get("projectId") as string | null;
    const projectId = projectIdRaw ? Number(projectIdRaw) : null;
    const storagePath = form.get("storagePath") as string | null;

    if (!file || !sector) {
      return NextResponse.json({ ok: false, error: "Missing file or sector" }, { status: 400 });
    }

    const row: typeof uploads.$inferInsert = {
      projectId: projectId ?? null,
      sector,
      filename: file.name,
      storagePath,
    };

    await db.insert(uploads).values(row);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  const rows = await db.select().from(uploads);
  return NextResponse.json({ ok: true, rows });
}