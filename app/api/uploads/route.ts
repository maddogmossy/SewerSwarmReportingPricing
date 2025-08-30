// app/api/uploads/route.ts
export const runtime = "edge";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const PDF  = /\.pdf$/i;
const DB   = /\.(db3?|db)$/i;
const META = /(_Meta|- Meta)\.(db3?|db)$/i;

const isPdf  = (n: string) => PDF.test(n);
const isDb   = (n: string) => DB.test(n);
const isMeta = (n: string) => META.test(n);
const baseDb = (n: string) => n.replace(META, "").replace(/\.(db3?|db)$/i, "");

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/i;

function sanitizePath(p: string) {
  return p.replace(/[^\w\s./-]+/g, "").replace(/\/+/g, "/").replace(/^\//, "").trim();
}
function sanitizeName(s: string) {
  return s.replace(/[^\w\s.-]+/g, " ").replace(/\s+/g, " ").trim();
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

    const sectorSlug  = (form.get("sectorSlug")  ?? "").toString();
    const sectorCode  = (form.get("sectorCode")  ?? "").toString();
    const sectorTitle = (form.get("sectorTitle") ?? "").toString();

    // Parsed from filename by the client (modal); verified here
    let projectNo = sanitizeName((form.get("projectNo") ?? "").toString());
    let address   = sanitizeName((form.get("address")   ?? "").toString());
    let postcode  = sanitizeName((form.get("postcode")  ?? "").toString());
    let clientName = sanitizeName((form.get("clientName") ?? "").toString());

    let targetName = sanitizeName((form.get("targetFilename") ?? "").toString());

    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    if (!files.length) return err(400, "No files attached.");
    if (!sectorCode || !sectorTitle) return err(400, "Missing sector info.");

    // Validate file set: either 1 PDF or a DB main + META pair
    const pdfs = files.filter((f) => isPdf(f.name));
    const dbs  = files.filter((f) => isDb(f.name));

    if (pdfs.length && dbs.length) return err(400, "Choose either a single PDF or a .db/.db3 pair, not both.");

    if (pdfs.length === 1 && files.length === 1) {
      // ok
    } else if (dbs.length >= 1) {
      const main = dbs.find((f) => !isMeta(f.name));
      const meta = dbs.find((f) =>  isMeta(f.name));
      if (!main || !meta) return err(400, "A .db/.db3 upload needs exactly two files: main + _Meta.");
      if (baseDb(main.name) !== baseDb(meta.name)) return err(400, "The .db/.db3 and _Meta names must match (same base).");
    } else {
      return err(400, "Unsupported files. Upload a PDF or a .db/.db3 pair.");
    }

    // If the client didn't parse project fields (rare), try inferring here from the first file
    if (!projectNo || !address || !postcode) {
      const main = files[0];
      const core = main.name.replace(/(_Meta|- Meta)?\.[^.]+$/i, "").replace(/\.[^.]+$/i, "");
      const parts = core.split(" - ").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const pc = parts[parts.length - 1].match(UK_POSTCODE);
        if (pc) {
          projectNo = projectNo || parts[0];
          address   = address   || parts.slice(1, parts.length - 1).join(" - ");
          postcode  = postcode  || `${pc[1].toUpperCase()} ${pc[2].toUpperCase()}`;
        }
      }
    }

    if (!projectNo || !address || !postcode) {
      return err(400, "Filename must include: Project No - Full Site address - Post code.");
    }

    // Folder structure for P4:
    //   /<SectorCode>/<ClientName>/<Project No - Full Site address - Post code>/
    if (!clientName) clientName = "Unfiled";
    const projectFolder = sanitizePath([projectNo, address, postcode].filter(Boolean).join(" - "));
    const destBase = sanitizePath([sectorCode, clientName, projectFolder].join("/"));

    // If a single PDF and targetName provided, enforce name
    if (pdfs.length === 1 && files.length === 1 && targetName) {
      targetName = `${targetName}.pdf`;
    } else {
      targetName = ""; // keep originals for db pair
    }

    const uploaded: Array<{ name: string; url: string; size: number; type: string }> = [];

    for (const f of files) {
      const fileName = targetName && isPdf(f.name) ? targetName : f.name;
      const key = `${destBase}/${fileName}`;

      const { url } = await put(key, f.stream(), {
        access: "public",
        contentType: f.type || (isPdf(f.name) ? "application/pdf" : "application/octet-stream"),
        addRandomSuffix: false,
      });

      uploaded.push({ name: fileName, url, size: f.size, type: f.type });
    }

    return NextResponse.json(
      {
        ok: true,
        sector: { code: sectorCode, title: sectorTitle, slug: sectorSlug },
        client: { name: clientName },
        project: { projectNo, address, postcode, folder: `${clientName}/${projectFolder}` },
        files: uploaded,
      },
      { status: 201 }
    );
  } catch (e: any) {
    return err(500, e?.message || "Upload failed");
  }
}
