// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, uploads, type InsertUpload } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Create the client if missing and return its id.
 * If name is empty, return null.
 */
async function ensureClient(name: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;

  const found = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.name, trimmed))
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(clients)
    .values({ name: trimmed })
    .returning({ id: clients.id });

  return created[0].id;
}

/**
 * Create the project (optionally tied to a client) if missing and return its id.
 * If name is empty, return null.
 */
async function ensureProject(clientId: number | null, name: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;

  const where = clientId
    ? and(eq(projects.name, trimmed), eq(projects.clientId, clientId))
    : and(eq(projects.name, trimmed), isNull(projects.clientId));

  const found = await db
    .select({ id: projects.id })
    .from(projects)
    .where(where)
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(projects)
    .values({ name: trimmed }) // ← no clientId for now because your schema types may not include it
    .returning({ id: projects.id });

  return created[0].id;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // sectorId is required
    const sector = (form.get("sectorId") || form.get("sector") || "")
      .toString()
      .toUpperCase();
    if (!sector) {
      return NextResponse.json(
        { success: false, error: "Missing sectorId" },
        { status: 400 }
      );
    }

    // optional: client & project names
    const clientName = (form.get("clientName") || "").toString();
    const projectName = (form.get("projectName") || "").toString();

    // Upsert client & project (safe if empty; returns nulls)
    const clientId = await ensureClient(clientName);
    const projectId = await ensureProject(clientId, projectName);

    // Collect uploaded files (field name: "files")
    const uploaded: File[] = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files received" },
        { status: 400 }
      );
    }

    // Save metadata rows — match your current InsertUpload type: { sector, filename }
    const saved: string[] = [];
    for (const file of uploaded) {
      const row: InsertUpload = {
        sector,
        filename: file.name,
        // uploadedAt is defaulted in DB (if present in schema)
        // projectId is intentionally omitted until your InsertUpload includes it
      };
      await db.insert(uploads).values(row);
      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
      files: saved,
      clientId,   // returned for UI, not written to uploads yet
      projectId,  // returned for UI, not written to uploads yet
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}