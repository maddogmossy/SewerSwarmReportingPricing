import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";

export const runtime = "nodejs"; // using Vercel Blob from server

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const sectorCode = String(form.get("sectorCode") || "S1");
    const sectorTitle = String(form.get("sectorTitle") || "Utilities");
    const clientName = String(form.get("clientName") || "Unknown Client");
    const projectFolder = String(form.get("projectFolder") || "Unknown Project");

    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const [row] = await db
      .insert(reports)
      .values({
        sectorCode,
        sectorTitle,
        clientName,
        projectFolder,
        pathname: blob.pathname,
        url: blob.url,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size
      })
      .returning();

    return NextResponse.json({ ok: true, report: row });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
