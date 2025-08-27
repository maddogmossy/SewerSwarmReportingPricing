// app/api/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, type InsertUpload } from "@/db/schema";

// Vercel / Next edge runtimes don't expose FormData.entries types well.
// We'll iterate with a small helper for strict TS.
function iterForm(form: FormData): Iterable<[string, FormDataEntryValue]> {
  // The runtime supports iteration; TS just doesn't know it.
  return form as unknown as Iterable<[string, FormDataEntryValue]>;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const sector = String(form.get("sectorId") ?? "");
  const projectIdRaw = form.get("projectId");
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;

  // Gather uploaded File objects from the "files" fields
  const uploaded: File[] = [];
  for (const [key, value] of iterForm(form)) {
    if (key === "files" && value instanceof File) {
      uploaded.push(value);
    }
  }

  if (!sector) {
    return NextResponse.json({ success: false, error: "Missing sectorId" }, { status: 400 });
  }
  if (uploaded.length === 0) {
    return NextResponse.json({ success: false, error: "No files uploaded" }, { status: 400 });
  }

  const filenames: string[] = [];
  for (const file of uploaded) {
    // Type-safe insert that matches db/schema.ts
    const row: InsertUpload = {
      projectId,            // nullable is fine (no .notNull() in schema)
      sector,
      filename: file.name,
      // uploadedAt is defaulted by DB → no need to set here
    };
    await db.insert(uploads).values(row);
    filenames.push(file.name);
  }

  return NextResponse.json({ success: true, sector, files: filenames });
}