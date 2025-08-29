// app/api/uploads/route.ts
export const runtime = "edge";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const PDF = /\.pdf$/i;
const DB = /\.(db3?|db)$/i;
const META = /(_Meta|- Meta)\.(db3?|db)$/i;

const isPdf = (n: string) => PDF.test(n);
const isDb = (n: string) => DB.test(n);
const isMeta = (n: string) => META.test(n);
const baseDb = (n: string) => n.replace(META, "").replace(/\.(db3?|db)$/i, "");

function sanitizePath(p: string) {
  return p.replace(/[^\w\s./-]+/g, "").replace(/\/+/g, "/").replace(/^\//, "");
}
function err(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sectorSlug = (form.get("sectorSlug") ?? "").toString();
    const sectorCode = (form.get("sectorCode") ?? "").toString();
    const sectorTitle = (form.get("sectorTitle") ?? "").toString();
    const projectNo = (form.get("projectNo") ?? "").toString();
    const address = (form.get("address") ?? "").toString();
    const postcode = (form.get("postcode") ?? "").toString();
    const folder = sanitizePath((form.get("folder") ?? "").toString());
    const targetName = sanitizePath((form.get("targetFilename") ?? "").toString());
    const clientId = (form.get("clientId") ?? "").toString();
    const clientName = (form.get("clientName") ?? "").toString();

    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    if (!files.length) return err(400, "No files attached.");
    if (!sectorCode || !sectorTitle) return err(400, "Missing sector info.");
    if (!projectNo || !address || !postcode) return err(400, "Missing project metadata.");

    const pdfs = files.filter((f) => isPdf(f.name));
    const dbs = files.filter((f) => isDb(f.name));

    if (pdfs.length && dbs.length)
      return err(400, "Choose either a single PDF or a .db/.db3 pair, not both.");

    if (pdfs.length === 1 && files.length === 1) {
      // ok
    } else if (dbs.length >= 1) {
      const main = dbs.find((f) => !isMeta(f.name));
      const meta = dbs.find((f) => isMeta(f.name));
      if (!main || !meta)
        return err(400, "A .db/.db3 upload needs exactly two files: main + _Meta.");
      if (baseDb(main.name) !== baseDb(meta.name))
        return err(400, "The .db/.db3 and _Meta names must match (same base).");
    } else {
      return err(400, "Unsupported files. Upload a PDF or a .db/.db3 pair.");
    }

    const destBase = sanitizePath([sectorCode || "UNK", folder || "Unfiled"].join("/"));

    const uploaded: Array<{ name: string; url: string; size: number; type: string }> = [];

    for (const f of files) {
      const finalName =
        targetName && isPdf(f.name) && files.length === 1
          ? `${targetName}.pdf`
          : f.name;

      const key = `${destBase}/${finalName}`;

      const { url } = await put(key, f.stream(), {
        access: "public", // satisfies @vercel/blob types
        contentType: f.type || (isPdf(f.name) ? "application/pdf" : "application/octet-stream"),
        addRandomSuffix: false,
      });

      uploaded.push({ name: finalName, url, size: f.size, type: f.type });
    }

    return NextResponse.json(
      {
        ok: true,
        sector: { code: sectorCode, title: sectorTitle, slug: sectorSlug },
        client: { id: clientId || null, name: clientName || null },
        project: { projectNo, address, postcode },
        folder: destBase,
        files: uploaded,
      },
      { status: 201 }
    );
  } catch (e: any) {
    return err(500, e?.message || "Upload failed");
  }
}
