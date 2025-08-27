// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, uploads } from "@/db/schema";
import type { InsertUpload } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// tiny helpers
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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
    .values({
      ...(clientId != null ? { clientId } : {}),
      name: trimmed,
    })
    .returning({ id: projects.id });

  return created[0].id;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // sector from the URL/page
    const sector = (form.get("sectorId") || form.get("sector") || "")
      .toString()
      .toUpperCase();
    if (!sector) {
      return NextResponse.json(
        { success: false, error: "Missing sectorId" },
        { status: 400 }
      );
    }

    // optional names typed by user (we’ll auto-create)
    const clientName = (form.get("clientName") || "").toString();
    const projectName = (form.get("projectName") || "").toString();

    const clientId = await ensureClient(clientName);
    const projectId = await ensureProject(clientId, projectName);

    // files
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
      // logical storage path (recorded in DB)
      const clientSlug = clientName ? slug(clientName) : "no-client";
      const projectSlug = projectName ? slug(projectName) : "no-project";
      const storagePath = `/clients/${clientSlug}/projects/${projectSlug}/sectors/${sector}/${file.name}`;

      // Build a concrete InsertUpload so TS knows the exact shape
      const row: InsertUpload = {
        projectId: projectId ?? null, // nullable
        sector,
        filename: file.name,
        storagePath,
        // uploadedAt defaults in DB
      };

      await db
        .insert(uploads)
        .values(row)
        .onConflictDoUpdate({
          // requires a unique index/constraint on (project_id, sector, filename)
          target: [uploads.projectId, uploads.sector, uploads.filename],
          set: { storagePath, uploadedAt: new Date() },
        });

      saved.push(file.name);
    }

    return NextResponse.json({
      success: true,
      sector,
      clientId,
      projectId,
      files: saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}