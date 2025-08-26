// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects, files } from "@/db/schema";
import { eq } from "drizzle-orm";

// This route needs Node runtime (not Edge) because we use the "pg" driver.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1) Read the incoming multipart/form-data from the browser
    const form = await req.formData();

    // "sectorId" comes from the upload page URL (/upload/S1, /upload/S2, ...)
    const sector = String(form.get("sectorId") || "").toUpperCase() || "S1";

    // Collect all files from formData with the field name "files"
    const uploaded: File[] = [];
    for (const [key, value] of Array.from(form.entries())) {
      if (key === "files" && value instanceof File) uploaded.push(value);
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files received" },
        { status: 400 }
      );
    }

    // 2) For now we drop everything into a default Client/Project.
    //    (We’ll replace this with real client+project selection later.)
    const DEFAULT_CLIENT = "Unassigned";
    const DEFAULT_PROJECT = "Inbox";

    // Ensure a client row exists
    let [clientRow] = await db
      .select()
      .from(clients)
      .where(eq(clients.name, DEFAULT_CLIENT))
      .limit(1);

    if (!clientRow) {
      const inserted = await db
        .insert(clients)
        .values({ name: DEFAULT_CLIENT })
        .returning({ id: clients.id });
      clientRow = { id: inserted[0].id, name: DEFAULT_CLIENT, createdAt: null as any };
    }

    // Ensure a project row exists under that client
    let [projectRow] = await db
      .select()
      .from(projects)
      .where(eq(projects.name, DEFAULT_PROJECT))
      .limit(1);

    if (!projectRow) {
      const inserted = await db
        .insert(projects)
        .values({ clientId: clientRow.id, name: DEFAULT_PROJECT })
        .returning({ id: projects.id });
      projectRow = {
        id: inserted[0].id,
        clientId: clientRow.id,
        name: DEFAULT_PROJECT,
        createdAt: null as any,
      };
    }

    // 3) Insert one "files" row per uploaded file (we store metadata only for now)
    const rows = uploaded.map((f) => ({
      projectId: projectRow.id,
      sector,          // S1..S6 from the page URL
      filename: f.name // original filename
      // uploaded_at auto-fills in SQL via DEFAULT now()
    }));

    await db.insert(files).values(rows);

    // 4) Respond to the browser
    return NextResponse.json({
      ok: true,
      saved: rows.length,
      sector,
      projectId: projectRow.id,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}