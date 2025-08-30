// app/api/uploads/route.ts
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { guessType, sanitize, deriveProjectFromFiles } from "@/lib/parse";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
  }

  const form = await req.formData();

  const sectorCode  = String(form.get("sectorCode") ?? "S1").toUpperCase();
  // sector_title is NOT NULL in your table, so ensure we always send something
  const sectorTitle = String(form.get("sectorTitle") ?? `Sector ${sectorCode}`);
  const clientName  = sanitize(form.get("clientName") ?? "General");
  const projectFolder = deriveProjectFromFiles([], form.get("projectFolder"));
  const files = form.getAll("files") as unknown as File[];

  if (!files.length) return new Response("No files attached", { status: 400 });

  const uploaded: Array<{ url: string; pathname: string; name: string; size: number }> = [];

  for (const file of files) {
    const safeName = (file as any).name || "file";
    const pathname = `${sectorCode}/${clientName}/${projectFolder}/${safeName}`;

    // NOTE: types in @vercel/blob require "public" here
    const { url } = await put(pathname, file, {
      token,
      access: "public",
      addRandomSuffix: false,
      contentType: (file as any).type || guessType(safeName),
    });

    await db.insert(reports).values({
      sectorCode,
      sectorTitle,
      clientName,
      projectFolder,
      // projectNo/address/postcode are optional in your schema; omit if unknown
      pathname,
      url,
      filename: safeName,
      contentType: (file as any).type || guessType(safeName),
      size: file.size,
    });

    uploaded.push({ url, pathname, name: safeName, size: file.size });
  }

  return Response.json({ ok: true, uploaded });
}
