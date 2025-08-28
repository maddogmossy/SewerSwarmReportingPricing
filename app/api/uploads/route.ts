import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";

/**
 * Simple slug helper to keep paths clean
 */
function slug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Accept either `sector` or `sectorId`
    const sector = (form.get("sector") || form.get("sectorId") || "").toString().toUpperCase();
    if (!sector) {
      return NextResponse.json({ success: false, error: "Missing sector" }, { status: 400 });
    }

    // Optional projectId (string/number -> number | null)
    const projectIdRaw = form.get("projectId");
    const projectId =
      projectIdRaw != null && `${projectIdRaw}`.trim() !== ""
        ? Number(`${projectIdRaw}`)
        : null;

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Build a predictable storage path (customize as you like)
    const projectPart = projectId != null ? `project-${projectId}` : "no-project";
    const storagePath = `/uploads/${projectPart}/sector-${slug(sector)}/${file.name}`;

    // Type is inferred directly from the table
    const row: typeof uploads.$inferInsert = {
      projectId,              // <-- now valid because schema includes it
      sector,
      filename: file.name,
      storagePath,            // <-- now valid because schema includes it
      // uploadedAt is defaulted by DB
    };

    await db.insert(uploads).values(row);

    return NextResponse.json({
      success: true,
      sector,
      projectId,
      filename: file.name,
      storagePath,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}