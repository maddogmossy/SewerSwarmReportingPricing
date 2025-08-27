// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Sector comes from the form. Accept "sectorId" or "sector", normalize to UPPERCASE.
    const sector = (form.get("sectorId") || form.get("sector") || "")
      .toString()
      .toUpperCase();

    if (!sector) {
      return NextResponse.json(
        { success: false, error: "Missing sectorId" },
        { status: 400 }
      );
    }

    // Collect all files sent under the "files" field
    const uploaded = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files received" },
        { status: 400 }
      );
    }

    // Insert each file name into the uploads table (sector + filename)
    const saved: string[] = [];
    for (const file of uploaded) {
      await db.insert(uploads).values({
        sector,
        filename: file.name,
      });
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