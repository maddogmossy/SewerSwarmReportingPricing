import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const uploaded: File[] = [];
    form.forEach((value, key) => {
      if (key === "files" && value instanceof File) {
        uploaded.push(value);
      }
    });

    const sector = form.get("sector")?.toString() || "unknown";
    const projectId = Number(form.get("projectId")); // comes from form/hidden input

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 });
    }

    for (const file of uploaded) {
      await db.insert(uploads).values({
        projectId,
        sector,
        filename: file.name,
      });
    }

    return NextResponse.json({ ok: true, count: uploaded.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}