// app/api/uploads/route.ts
// Force Node.js runtime (multipart uploads can stall on Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// ---------- helpers ----------
const isPdf = (name: string) => /\.pdf$/i.test(name);
const isDb = (name: string) => /\.db3?$/i.test(name) || /\.db$/i.test(name);
const isMeta = (name: string) =>
  /(_Meta|- Meta)\.db3?$/i.test(name) || /(_Meta|- Meta)\.db$/i.test(name);

const baseDb = (name: string) =>
  name.replace(/(_Meta|- Meta)?\.db3?$/i, "").replace(/(_Meta|- Meta)?\.db$/i, "");

function sanitizeSegment(seg: string) {
  return seg
    .replaceAll("\\", "/")
    .replaceAll("..", "")
    .replaceAll("/", "-")
    .replace(/[^\w\s.\-]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function keyJoin(...parts: string[]) {
  return parts
    .map((p) => sanitizeSegment(p))
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/");
}

async function saveBlob(file: File, key: string, contentType?: string) {
  const ab = await file.arrayBuffer(); // <= 50MB per your UI
  const data = Buffer.from(ab);
  const { url } = await put(key, data, {
    access: "private",
    contentType:
      contentType ||
      file.type ||
      (isPdf(file.name) ? "application/pdf" : "application/octet-stream"),
  });
  return url;
}

// ---------- route ----------
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Metadata from client
    const sectorSlug = String(form.get("sectorSlug") ?? "");
    const sectorCode = String(form.get("sectorCode") ?? "");
    const sectorTitle = String(form.get("sectorTitle") ?? "");
    const folder = String(form.get("folder") ?? "");

    const projectNo = String(form.get("projectNo") ?? "");
    const address = String(form.get("address") ?? "");
    const postcode = String(form.get("postcode") ?? "");
    const userTargetFilename = String(form.get("targetFilename") ?? "");

    const clientId = form.get("clientId") ? String(form.get("clientId")) : undefined;
    const clientName = form.get("clientName") ? String(form.get("clientName")) : undefined;

    // Files (ensure they are File objects)
    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    if (!files.length) {
      return NextResponse.json({ ok: false, error: "No files provided." }, { status: 400 });
    }

    const pdfs = files.filter((f) => isPdf(f.name));
    const dbs = files.filter((f) => isDb(f.name));

    if (pdfs.length && dbs.length) {
      return NextResponse.json(
        { ok: false, error: "Upload either a single PDF or a .db/.db3 pair, not both." },
        { status: 400 }
      );
    }

    // Safe folder path (Client/Address)
    const clientFolder = clientName || "Client";
    const addressFolder = address || "Address";
    const baseFolder = folder ? keyJoin(folder) : keyJoin(clientFolder, addressFolder);

    // Base filename: "Project No - Address - Post code"
    const baseName =
      userTargetFilename ||
      [projectNo, address, postcode].filter(Boolean).join(" - ") ||
      "Report";

    const saved: Array<{ name: string; key: string; url: string }> = [];

    if (pdfs.length === 1 && files.length === 1) {
      // Single PDF
      const pdf = pdfs[0];
      const key = keyJoin(baseFolder, `${baseName}.pdf`);
      const url = await saveBlob(pdf, key, "application/pdf");
      saved.push({ name: pdf.name, key, url });
    } else if (dbs.length >= 1) {
      // Pair: main + _Meta
      const mains = dbs.filter((f) => !isMeta(f.name));
      const metas = dbs.filter((f) => isMeta(f.name));

      if (mains.length !== 1 || metas.length !== 1) {
        return NextResponse.json(
          {
            ok: false,
            error: "A .db/.db3 upload must contain exactly two files: the main file and the _Meta file.",
          },
          { status: 400 }
        );
      }

      const main = mains[0];
      const meta = metas[0];

      if (baseDb(main.name) !== baseDb(meta.name)) {
        return NextResponse.json(
          { ok: false, error: "The .db/.db3 and _Meta file names must match (same base name)." },
          { status: 400 }
        );
      }

      const ext = /\.db3$/i.test(main.name) ? ".db3" : ".db";
      const keyMain = keyJoin(baseFolder, `${baseName}${ext}`);
      const keyMeta = keyJoin(baseFolder, `${baseName}_Meta${ext}`);

      const [urlMain, urlMeta] = await Promise.all([
        saveBlob(main, keyMain, "application/octet-stream"),
        saveBlob(meta, keyMeta, "application/octet-stream"),
      ]);
      saved.push({ name: main.name, key: keyMain, url: urlMain });
      saved.push({ name: meta.name, key: keyMeta, url: urlMeta });
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported files. Upload a PDF or a .db/.db3 pair." },
        { status: 400 }
      );
    }

    // Sidecar metadata JSON for your dashboard
    const metadata = {
      sectorSlug,
      sectorCode,
      sectorTitle,
      clientId: clientId ?? null,
      clientName: clientName ?? null,
      projectNo,
      address,
      postcode,
      saved,
      createdAt: new Date().toISOString(),
    };

    const metaKey = keyJoin(baseFolder, `${baseName}.json`);
    await saveBlob(
      new File([JSON.stringify(metadata, null, 2)], `${baseName}.json`, { type: "application/json" }),
      metaKey,
      "application/json"
    );

    return NextResponse.json({ ok: true, folder: baseFolder, files: saved, metadata });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
