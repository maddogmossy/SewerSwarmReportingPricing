// app/api/uploads/route.ts
export const runtime = "nodejs";

import { put } from "@vercel/blob";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { deriveProjectFromFiles, guessType, pickFromFilename, sanitize } from "@/lib/parse";

// tiny helper – map S-codes to a title you display on the site
const SECTOR_TITLES: Record<string, string> = {
  S1: "Utilities",
  S2: "Highways",
  S3: "Rail",
  S4: "Marine",
  S5: "Water",
};

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
  }

  const form = await req.formData();

  const sectorCode  = String(form.get("sectorCode") ?? "S1").toUpperCase();
  const sectorTitle = SECTOR_TITLES[sectorCode] ?? sectorCode;

  const clientName  = sanitize(form.get("clientName"));
  const override    = form.get("projectFolder");

  // files[]
  const files = (form.getAll("files") as unknown as File[]) || [];
  if (!files.length) {
    return new Response("No files provided", { status: 400 });
  }

  // Choose destination project folder
  const projectFolder = deriveProjectFromFiles(files, override);

  // Try to pull projectNo / address / postcode from the chosen folder or main filename
  let projectNo: string | undefined;
  let address  : string | undefined;
  let postcode : string | undefined;

  const fromFolder = projectFolder ? { ...pickFromFilename(projectFolder + ".pdf") } : undefined;
  if (fromFolder) {
    projectNo = fromFolder.projectNo;
    address   = fromFolder.address;
    postcode  = fromFolder.postcode;
  }

  const saved: any[] = [];

  // Upload each file and create a DB row
  for (const file of files) {
    const name = file.name;
    const { url, pathname, size, contentType } = await put(
      // store underneath /<sector>/<client>/<project>/
      `${sectorCode}/${clientName}/${projectFolder}/${name}`,
      file,
      {
        token,
        access: "public",           // types for this SDK version only allow "public"
        addRandomSuffix: false,     // keep original filename
        contentType: (file as any).type || guessType(name),
      }
    );

    await db.insert(reports).values({
      sectorCode,
      sectorTitle,
      clientName,
      projectFolder,
      projectNo,
      address,
      postcode,
      pathname,
      url,
      filename: name,
      contentType: contentType || guessType(name),
      size: Number(size),
    });

    saved.push({ url, pathname, name, size });
  }

  return Response.json({ ok: true, saved });
}
