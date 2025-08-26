// app/api/uploads/route.ts
import { NextResponse } from "next/server";

// If you ever switch this route to the Edge runtime, FormData types differ.
// Keeping Node.js runtime is simpler for file uploads.
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Parse the multipart form
  const form = await req.formData();

  // ✅ Explicitly cast to FormData so TS knows .entries() is iterable
  const uploaded: File[] = [];
  for (const [key, value] of (form as FormData).entries()) {
    if (key === "files" && value instanceof File) {
      uploaded.push(value);
    }
  }

  // Optional: read extra fields (e.g., sectorId) if you include them in your form
  const sectorId = (form as FormData).get("sectorId");
  const sector = typeof sectorId === "string" ? sectorId : null;

  if (uploaded.length === 0) {
    return NextResponse.json(
      { success: false, error: "No files received" },
      { status: 400 }
    );
  }

  // For now we just echo what was received. Next step will stream to object storage + DB.
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

// (Optional) quick health check
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/uploads" });
}