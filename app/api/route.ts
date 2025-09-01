// app/api/upload/route.ts
import { db } from "../../db"; // ✅ relative fallback

function looksLikeDbPair(files: File[]) {
  const names = files.map(f => f.name.toLowerCase());
  const pdfOnly = names.length === 1 && names[0].endsWith(".pdf");
  if (pdfOnly) return { ok: true, mode: "pdf" as const };

  const anyDb = names.some(n => n.endsWith(".db") || n.endsWith(".db3"));
  const anyMeta = names.some(n =>
    n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
  );
  if (anyDb && anyMeta) return { ok: true, mode: "dbpair" as const };

  return { ok: false as const, mode: "invalid" as const };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sectorId = (form.get("sectorId") as string | null)?.toUpperCase();
    if (!sectorId) {
      return NextResponse.json(
        { ok: false, error: "Missing sectorId." },
        { status: 400 }
      );
    }

    const fileFields = form.getAll("files");
    const files: File[] = fileFields.filter(
      (v): v is File => typeof v !== "string"
    );

    if (!files.length) {
      return NextResponse.json(
        { ok: false, error: "No files received." },
        { status: 400 }
      );
    }

    const check = looksLikeDbPair(files);
    if (!check.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid selection. Upload either a single PDF, or a main .db/.db3 file WITH its META .db/.db3 file.",
        },
        { status: 400 }
      );
    }

    // NOTE: This is where we will:
    // - stream to storage (Vercel Blob/S3)
    // - create DB rows in Neon
    // For now, we just echo back filenames & mode.
    const filenames = files.map(f => f.name);

    return NextResponse.json({
      ok: true,
      sectorId,
      mode: check.mode, // "pdf" | "dbpair"
      files: filenames,
      message: "Upload received (placeholder) — storage/DB wiring comes next.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
