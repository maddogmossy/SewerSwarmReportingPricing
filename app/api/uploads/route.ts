// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, uploads, type InsertUpload } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Create (or fetch) a client by name.
 * Returns the client id or null if no name given.
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
 * Create (or fetch) a project by name ONLY.
 * (We’re not using clientId here so it works with your current schema.)
 */
async function ensureProjectByName(name: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;

  const found = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, trimmed))
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(projects)
    .values({ name: trimmed }) // <- only name to match your schema
    .returning({ id: projects.id });

  return created[0].id;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sector = (form.get("sectorId") || form.get("sector") || "")
      .toString()
      .toUpperCase();
    if (!sector) {
      return NextResponse.json(
        { success: false, error: "Missing sectorId" },
        { status: 400 }
      );
    }

    // names from the form
    const clientName = (form.get("clientName") || "").toString();
    const projectName = (form.get("projectName") || "").toString();

    // Upsert client; keep the id for returning (not used in project insert here)
    const clientId = await ensureClient(clientName);

    // Upsert project by NAME (schema-safe today)
    const projectId = await ensureProjectByName(projectName);

    // Collect files
    const uploaded: File[] = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files received" },
        { status: 400 }
      );
    }

    const saved: string[] = [];

    for (const file of uploaded) {
      // Type-safe insert that matches db/schema.ts
      const row: InsertUpload = {
        // projectId is allowed if your uploads table has it; if not, remove this line
        projectId: projectId ?? null,
        sector,
        filename: file.name,
        // uploadedAt defaults in DB (per your schema)
      };

      await db.insert(uploads).values(row);
      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
      files: saved,
      clientId,
      project