// app/api/upload/route.ts
import { NextResponse } from "next/server";

/**
 * Accepts multipart/form-data:
 * - sectorId: string (S1..S6)
 * - files: File[] (either 1 PDF OR main .db/.db3 + META .db/.db3)
 *
 * No storage yet — just validates and echoes back a JSON result.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sectorId = String(formData.get("sectorId") || "").toUpperCase();
    const files = formData.getAll("files").filter(Boolean) as File[];

    if (!sectorId) {
      return NextResponse.json(
        { ok: false, error: "Missing sectorId." },
        { status: 400 }
      );
    }
    if (!files.length) {
      return NextResponse.json(
        { ok: false, error: "No files received." },
        { status: 400 }
      );
    }

    // Validate: single PDF OR db pair (main + META)
    const names = files.map((f) => f.name.toLowerCase());
    const isSinglePdf = names.length === 1 && names[0].endsWith(".pdf");
    const anyDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
    const anyMetaDb = names.some(
      (n) => n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
    );
    const isDbPair = names.length >= 2 && anyDb && anyMetaDb;

    if (!(isSinglePdf || isDbPair)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "For database uploads, include BOTH the main .db/.db3 and its META .db/.db3. A single PDF is also supported.",
        },
        { status: 400 }
      );
    }

    // (Future) Persist: save to blob/S3; write a DB record with sector + standards mapping.
    // For now, just reply with what we received so the client can continue flow.
    return NextResponse.json({
      ok: true,
      sectorId,
      fileNames: names,
      accepted: isSinglePdf ? "pdf" : "db_pair",
      // (Future) standardsKey: map from sectorId (S1..S6) -> "wrc_srm" | "sfa8" | "dmrb" | ...
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}