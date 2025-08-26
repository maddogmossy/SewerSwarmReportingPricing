// app/api/uploads/route.ts
import { NextResponse } from "next/server";

// Reuse the same rule: allow single PDF OR (main .db/.db3 + META .db/.db3)
function isDbPairPresent(fileNames: string[]) {
  if (fileNames.length === 0) return false;
  const names = fileNames.map((n) => n.toLowerCase());

  // single PDF is allowed
  if (names.length === 1 && names[0].endsWith(".pdf")) return true;

  const anyDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
  const anyMeta = names.some(
    (n) => n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
  );
  return anyDb && anyMeta;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const sectorId = (form.get("sectorId") as string | null) ?? null;

    // Collect all "files" fields (can be multiple)
    const files: File[] = [];
    for (const [key, value] of form.entries()) {
      if (key === "files" && value instanceof File) files.push(value);
    }

    if (!sectorId) {
      return NextResponse.json(
        { ok: false, error: "Missing sectorId." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files uploaded." },
        { status: 400 }
      );
    }

    // Validate pair rule
    const fileNames = files.map((f) => f.name);
    if (!isDbPairPresent(fileNames)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "For database uploads, include BOTH the main .db/.db3 file and its META .db/.db3 file. (A single PDF is fine on its own.)",
        },
        { status: 400 }
      );
    }

    // Stubbed response (no storage yet)
    return NextResponse.json({
      ok: true,
      message: "Received files (stub). Storage/DB wiring comes next.",
      sectorId,
      files: fileNames,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Unexpected error parsing upload." },
      { status: 500 }
    );
  }
}