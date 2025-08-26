// app/api/uploads/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // keep Node runtime (not edge)

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Sector (string)
    const sectorIdRaw = form.get("sectorId");
    const sectorId = (typeof sectorIdRaw === "string" ? sectorIdRaw : "").toUpperCase();

    // All uploaded files
    const files = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (!sectorId) {
      return NextResponse.json({ ok: false, error: "Missing sectorId" }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
    }

    // Validate types/sizes (basic — server will be extended later)
    const names = files.map((f) => f.name.toLowerCase());
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const maxBytes = 50 * 1024 * 1024; // 50MB per file (adjust if you want total)

    if (files.some((f) => f.size > maxBytes)) {
      return NextResponse.json(
        { ok: false, error: "Each file must be ≤ 50MB" },
        { status: 400 }
      );
    }

    const isPDFOnly = files.length === 1 && names[0].endsWith(".pdf");
    const hasDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
    const hasMetaDb = names.some(
      (n) => n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
    );
    const isDbPair = hasDb && hasMetaDb;

    if (!isPDFOnly && !isDbPair) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "For database uploads, include BOTH the main .db/.db3 and its META .db/.db3. (A single PDF is fine.)",
        },
        { status: 400 }
      );
    }

    // TODO: Persist to storage & DB. For now just echo back.
    return NextResponse.json({
      ok: true,
      sectorId,
      files: files.map((f) => f.name),
      totalBytes,
    });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}