import { put } from "@vercel/blob";
import { db } from "@/db";
import { reports } from "@/db/schema";

export const runtime = "nodejs"; // required for formdata + blob

export async function POST(req: Request) {
  const form = await req.formData();

  // metadata from the form (strings only)
  const sectorCode   = String(form.get("sectorCode") || "S1");
  const sectorTitle  = String(form.get("sectorTitle") || "Utilities");
  const clientName   = String(form.get("clientName") || "Unknown Client");
  const projectFolder= String(form.get("projectFolder") || "Unsorted");
  const projectNo    = String(form.get("projectNo") || "");
  const address      = String(form.get("address") || "");
  const postcode     = String(form.get("postcode") || "");

  // allow multiple files
  const files = form.getAll("files") as File[];
  if (!files.length) return new Response("No files", { status: 400 });

  const inserted: any[] = [];

  for (const file of files) {
    // create a neat path: client/project/filename
    const safeClient  = clientName.replace(/[^\w\-]+/g, "_");
    const safeProject = projectFolder.replace(/[^\w\-]+/g, "_");

    const pathname = `${safeClient}/${safeProject}/${file.name}`;
    const blob = await put(pathname, file, {
      access: "public", // or "private" if you prefer
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false
    });

    const row = await db.insert(reports).values({
      sectorCode,
      sectorTitle,
      clientName,
      projectFolder,
      projectNo,
      address,
      postcode,
      pathname: blob.pathname,
      url: blob.url,
      filename: file.name,
      contentType: blob.contentType || file.type || "application/octet-stream",
      size: file.size,
    }).returning();

    inserted.push(row[0]);
  }

  return Response.json({ ok: true, count: inserted.length, rows: inserted });
}
