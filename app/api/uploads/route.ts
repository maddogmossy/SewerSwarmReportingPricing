// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads, type InsertUpload } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sector = (form.get("sectorId") || form.get("sector") || "").toString().toUpperCase();
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
      // NOTE: Your current schema exposes only { sector, filename } for InsertUpload
      const row: InsertUpload = {
        sector,
        filename: file.name,
        // uploadedAt is defaulted in DB if you added it; if not, it’s fine to omit
        // projectId is NOT in your current schema type, so we omit it for now
      };

      await db.insert(uploads).values(row);
      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
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