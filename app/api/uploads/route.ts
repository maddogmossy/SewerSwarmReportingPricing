// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, uploads, type InsertUpload } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function getOrCreateClient(name: string) {
  const trimmed = name.trim();
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

async function getOrCreateProject(clientId: number | null, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  // If no clientId, we create a project unattached (can attach later)
  if (!clientId) {
    const created = await db
      .insert(projects)
      .values({ clientId: null, name: trimmed })
      .returning({ id: projects.id });
    return created[0].id;
  }

  const found = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.clientId, clientId), eq(projects.name, trimmed)))
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(projects)
    .values({ clientId, name: trimmed })
    .returning({ id: projects.id });
  return created[0].id;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sector = (
      form.get("sectorId") ||
      form.get("sector") ||
      ""
    ).toString().toUpperCase();

    const clientName = (form.get("clientName") || "").toString();
    const projectName = (form.get("projectName") || "").toString();

    if (!sector) {
      return NextResponse.json(
        { success: false, error: "Missing sectorId" },
        { status: 400 }
      );
    }

    const uploaded: File[] = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files received" },
        { status: 400 }
      );
    }

    // Upsert client/project if names provided
    let projectId: number | null = null;
    if (clientName || projectName) {
      const clientId = await getOrCreateClient(clientName);
      projectId = await getOrCreateProject(clientId, projectName);
    }

    const saved: string[] = [];

    for (const file of uploaded) {
      const row: InsertUpload = {
        sector,
        filename: file.name,
        // these next two are safe if your schema has them;
        // uploadedAt defaults in DB, but setting it is fine too
        uploadedAt: new Date(),
        projectId: projectId ?? null,
      };
      await db.insert(uploads).values(row);
      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
      files: saved,
      projectId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}