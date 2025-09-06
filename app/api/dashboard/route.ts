import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections, defects, reports } from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reportId = Number(searchParams.get("reportId") ?? 0);
  const sector = searchParams.get("sector") ?? undefined;

  if (!reportId) return NextResponse.json({ error: "reportId is required" }, { status: 400 });

  // join sections + defects; simple shaping for now
  const rows = await db.query.sections.findMany({
    where: (s, { eq, and }) => and(
      eq(s.reportId, reportId),
      sector ? eq(s.sectionSector, sector as any) : undefined
    ),
    with: { defects: true, report: true },
    orderBy: (s, { asc }) => [asc(s.itemNo)],
  });

  // split SER/STR: base row first (e.g. 13), then 13a for STR
  const display: Array<any> = [];
  for (const s of rows) {
    const ser = s.defects.find(d => d.code === "SER");
    const str = s.defects.find(d => d.code === "STR");

    // base row (item e.g. "13")
    display.push({
      projectNo: s.projectNo,
      itemNo: s.itemNo,
      inspectionNo: s.inspectionNo,
      date: s.date,
      time: s.time,
      startMH: s.startMh,
      startMHDepth: s.startMhDepth,
      finishMH: s.finishMh,
      finishMHDepth: s.finishMhDepth,
      pipeSize: s.pipeSize,
      pipeMaterial: s.pipeMaterial,
      totalLengthM: s.totalLengthM,
      surveyedLengthM: s.surveyedLengthM,
      observations: s.observations,
      severityGrade: s.severityGrade,
      srmGrading: s.srmGrading,
      recommendation: s.recommendation,
      adoptable: s.adoptable,
      costGBP: s.costGbp,
      tag: ser ? "SER" : undefined,
    });

    // STR “a” row (e.g. "13a")
    if (str) {
      display.push({
        ...display[display.length - 1],
        itemNo: `${s.itemNo}a`,
        tag: "STR",
      });
    }
  }

  return NextResponse.json({ rows: display });
}
