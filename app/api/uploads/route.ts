// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  reportUploads,
  clients,
  projects,
  type InsertReportUpload,
} from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

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

      const row: InsertReportUpload = {
        projectId: projectId ?? null,
        sector,
        filename: file.name,
        storagePath,
      };

      await db.insert(reportUploads).values(row);
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