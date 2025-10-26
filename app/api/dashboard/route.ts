// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reportId = Number(searchParams.get("reportId"));
  const sector = searchParams.get("sector");

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required" }, { status: 400 });
  }

  // Fetch sections with optional sector filter
  const result = await db.query.sections.findMany({
    where: (s, { eq, and }) =>
      and(
        eq(s.reportId, reportId),
        sector ? eq(s.sector, sector as any) : undefined
      ),
    with: { defects: true },
    orderBy: (s, { asc }) => [asc(s.itemNo)],
  });

  return NextResponse.json({ sections: result });
}