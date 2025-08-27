// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";

// ⬇️ Import the SINGLE source of truth
import * as DBS from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// derive from the exact table we just imported
type UploadRow = typeof DBS.uploads.$inferInsert;

// tiny helpers
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function ensureClient(name: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;

  const found = await db
    .select({ id: DBS.clients.id })
    .from(DBS.clients)
    .where(eq(DBS.clients.name, trimmed))
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(DBS.clients)
    .values({ name: trimmed })
    .returning({ id: DBS.clients.id });

  return created[0].id;
}

async function ensureProject(clientId: number | null, name: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;

  const where = clientId
    ? and(eq(DBS.projects.name, trimmed), eq(DBS.projects.clientId, clientId))
    : and(eq(DBS.projects.name, trimmed), isNull(DBS.projects.clientId));

  const found = await db
    .select({ id: DBS.projects.id })
    .from(DBS.projects)
    .where(where)
    .limit(1);

  if (found.length) return found[0].id;

  const created = await db
    .insert(DBS.projects)
    .values({
      ...(clientId != null ? { clientId } : {}),
      name: trimmed,
    })
    .returning({ id: DBS.projects.id });

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

    const clientName = (form.get("clientName") || "").toString();
    const projectName = (form.get("projectName") || "").toString();

    const clientId = await ensureClient(clientName);
    const projectId = await ensureProject(clientId, projectName);

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
      const clientSlug = clientName ? slug(clientName) : "no-client";
      const projectSlug = projectName ? slug(projectName) : "no-project";
      const storagePath = `/clients/${clientSlug}/projects/${projectSlug}/sectors/${sector}/${file.name}`;

      // ✅ UploadRow is inferred from DBS.uploads (the correct table with projectId/storagePath)
      const row: UploadRow = {
        projectId: projectId ?? null,
        sector,
        filename: file.name,
        storagePath,
      };

      await db
        .insert(DBS.uploads)
        .values(row)
        .onConflictDoUpdate({
          target: [DBS.uploads.projectId, DBS.uploads.sector, DBS.uploads.filename],
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