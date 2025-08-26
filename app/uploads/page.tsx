// app/api/uploads/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();

  // Grab all "files" fields and keep only File instances
  const uploaded = (form.getAll("files") || []).filter(
    (v): v is File => v instanceof File
  );

  const sectorVal = form.get("sectorId");
  const sector = typeof sectorVal === "string" ? sectorVal : null;

  if (uploaded.length === 0) {
    return NextResponse.json(
      { success: false, error: "No files received" },
      { status: 400 }
    );
    }

  // Echo back for now; next step is storing + DB rows
  return NextResponse.json({
    success: true,
    sector,
    files: uploaded.map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
      size: f.size,
    })),
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/uploads" });
}