// app/api/uploads/route.ts
import { put } from "@vercel/blob";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { guessType } from "@/lib/parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return new Response("Missing file", { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(`uploads/${file.name}`, buffer, {
      access: "public", // Blob only supports "public"
      contentType: file.type || guessType(file.name),
    });

    // Insert into DB
    const row = await db.insert(uploads).values({
      sector: (formData.get("sector") as string) || "unknown",
      client: (formData.get("client") as string) || "unknown",
      project: (formData.get("project") as string) || "unknown",
      filename: file.name,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
    }).returning();

    return Response.json(row[0]);
  } catch (err: any) {
    console.error(err);
    return new Response("Upload failed", { status: 500 });
  }
}