import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

// ---------- filename helpers ----------
const isPdf = (n: string) => /\.pdf$/i.test(n);
const isDb  = (n: string) => /\.(?:db3?|db)$/i.test(n);
const isMeta = (n: string) => /(?:^|[ _-])meta\.(?:db3?|db)$/i.test(n);
const baseDb = (n: string) =>
  n.replace(/(?:^|[ _-])meta\.(?:db3?|db)$/i, "").replace(/\.(?:db3?|db)$/i, "").trim();

const sanitizeSeg = (s: string) =>
  s.replace(/[^\w\s.-]+/g, " ").replace(/\s+/g, " ").trim();

const safeJoin = (...parts: string[]) =>
  parts.filter(Boolean).map(sanitizeSeg).join("/");

// ---------- POST ----------
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Sector info
    const sectorCode  = (form.get("sectorCode") as string) || "S?";
    const sectorTitle = (form.get("sectorTitle") as string) || "";
    const sectorSlug  = (form.get("sectorSlug") as string) || "";

    // Parsed from file name on client (P3)
    const projectNo = sanitizeSeg((form.get("projectNo") as string) || "");
    const address   = sanitizeSeg((form.get("address") as string) || "");
    const postcode  = sanitizeSeg((form.get("postcode") as string) || "");

    // Folder-level client (from folder picker or "Unfiled")
    const clientName = sanitizeSeg((form.get("clientName") as string) || "Unfiled");

    // Optional target name (already joined on client)
    let target = sanitizeSeg((form.get("targetFilename") as string) || "");
    if (!target) {
      const pieces = [projectNo, address, postcode].filter(Boolean);
      target = pieces.join(" - ") || "Untitled";
    }

    const rawFiles = form.getAll("files");
    const files: File[] = rawFiles.filter((x): x is File => x instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files attached." }, { status: 400 });
    }

    // Validate combination (single PDF OR main+_Meta pair)
    const pdfs = files.filter((f) => isPdf(f.name));
    const dbs  = files.filter((f) => isDb(f.name));

    if (pdfs.length && dbs.length) {
      return NextResponse.json(
        { error: "Upload a single PDF OR a .db/.db3 pair (not both)." },
        { status: 400 }
      );
    }

    if (!(pdfs.length === 1 && files.length === 1)) {
      // DB path
      if (dbs.length >= 1) {
        const main = dbs.find((f) => !isMeta(f.name));
        const meta = dbs.find((f) =>  isMeta(f.name));
        if (!main || !meta) {
          return NextResponse.json(
            { error: "A .db/.db3 upload needs exactly two files: main + _Meta." },
            { status: 400 }
          );
        }
        if (baseDb(main.name).toLowerCase() !== baseDb(meta.name).toLowerCase()) {
          return NextResponse.json(
            { error: "The .db/.db3 and _Meta names must match (same base)." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unsupported files. Upload a PDF or a .db/.db3 pair." },
          { status: 400 }
        );
      }
    }

    // Upload each file to Vercel Blob
    const folder = safeJoin(sectorCode, clientName, target);
    const uploads: Array<{ key: string; url: string; name: string; size: number }> = [];

    for (const f of files) {
      const ab = await f.arrayBuffer();
      const key = safeJoin(folder, f.name);

      const { url } = await put(key, new Uint8Array(ab), {
        access: "public", // public URLs (required by current @vercel/blob types)
        contentType:
          f.type ||
          (isPdf(f.name) ? "application/pdf" : "application/octet-stream"),
        // cacheControl: "public, max-age=31536000, immutable", // optional
      });

      uploads.push({ key, url, name: f.name, size: f.size });
    }

    return NextResponse.json({
      ok: true,
      sector: { code: sectorCode, title: sectorTitle, slug: sectorSlug },
      folder,
      uploads,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
