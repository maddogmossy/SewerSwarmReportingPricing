// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, type InsertUpload } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sector = (form.get("sectorId") || form.get("sector") || "").toString().toUpperCase();
    const projectId = parseInt((form.get("projectId") || "0").toString(), 10) || null;

    if (!sector) {
      return NextResponse.json({ success: false, error: "Missing sectorId" }, { status: 400 });
    }

    // Collect all files from formData with the field name "files"
    const uploaded: File[] = form.getAll("files").filter((v): v is File => v instanceof File);

    if (uploaded.length === 0) {
      return NextResponse.json({ success: false, error: "No files received" }, { status: 400 });
    }

    const saved: string[] = [];

    for (const file of uploaded) {
      const row: InsertUpload = {
        projectId,
        sector,
        filename: file.name,
        uploadedAt: new Date(), // always refresh timestamp
      };

      await db
        .insert(uploads)
        .values(row)
        .onConflictDoUpdate({
          target: [uploads.projectId, uploads.sector, uploads.filename],
          set: { uploadedAt: new Date() }, // update timestamp instead of duplicate
        });

      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
      projectId,
      count: saved.length,
      files: saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}