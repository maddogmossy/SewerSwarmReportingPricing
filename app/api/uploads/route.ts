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

    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim() !== ""
        ? Number(projectIdRaw)
        : null;

    const storagePath: string | null = null;

    const row: typeof uploads.$inferInsert = {
      projectId,
      sector,
      filename: file.name,
      storagePath,
    };

    await db.insert(uploads).values(row);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}