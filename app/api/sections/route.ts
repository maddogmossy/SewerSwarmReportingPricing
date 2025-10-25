// app/api/sections/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { defects, reports, sections } from "@/db/schema";
import { eq } from "drizzle-orm";

// -------------------------------------------
// TEMPORARY EVALUATION LOGIC (placeholder)
// -------------------------------------------
function evaluateSection(
  sector: string,
  input: {
    itemNo: string;
    pipeSize?: number;
    pipeMaterial?: string;
    observations?: string;
    defects: any[];
  }
) {
  const hasStructuralDefects = input.defects.some(d => d.code === "STR");
  const hasServiceDefects = input.defects.some(d => d.code === "SER");

  // Simple placeholder rules until WRc / MSCC5 logic is integrated
  if (hasStructuralDefects && !hasServiceDefects) {
    return {
      recommendation: "Structural repair required",
      adoptable: false,
      srmGrading: "C",
      severityGrade: 4,
      costGBP: 1200,
    };
  } else if (hasServiceDefects && !hasStructuralDefects) {
    return {
      recommendation: "Clean and re-survey",
      adoptable: true,
      srmGrading: "B",
      severityGrade: 2,
      costGBP: 350,
    };
  } else if (hasStructuralDefects && hasServiceDefects) {
    return {
      recommendation: "Structural repair and service cleaning required",
      adoptable: false,
      srmGrading: "D",
      severityGrade: 5,
      costGBP: 1500,
    };
  } else {
    return {
      recommendation: "No major action required",
      adoptable: true,
      srmGrading: "A",
      severityGrade: 1,
      costGBP: 0,
    };
  }
}

// -------------------------------------------
// SECTION API ROUTE
// -------------------------------------------

type Row = {
  id: number;
  itemNo: string;
  projectNo: string;
  inspectionNo: string | null;
  date: string | null;
  time: string | null;
  startMH: string | null;
  startMHDepth: string | null;
  finishMH: string | null;
  finishMHDepth: string | null;
  pipeSize: number | null;
  pipeMaterial: string | null;
  totalLengthM: string | null;
  surveyedLengthM: string | null;
  observations: string | null;
  severityGrade: number | null;
  srmGrading: string | null;
  recommendation: string | null;
  adoptable: boolean | null;
  costGBP: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("reportId");
  const sectorOverride = searchParams.get("sector");

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required" }, { status: 400 });
  }

  // Fetch sections and defects for this report
  const secRows = await db.query.sections.findMany({
    where: eq(sections.reportId, Number(reportId)),
    with: { defects: true },
    orderBy: (s, { asc }) => [asc(s.itemNo), asc(s.id)],
  });

  // Fetch report for default sector
  const rep = await db.query.reports.findFirst({
    where: eq(reports.id, Number(reportId)),
  });

  const sector = sectorOverride || rep?.sector || "S1"; // default to Utilities

  const expanded: Row[] = [];

  for (const s of secRows) {
    const hasSER = s.defects.some(d => d.code === "SER");
    const hasSTR = s.defects.some(d => d.code === "STR");

    const base = {
      id: s.id,
      projectNo: s.projectNo,
      inspectionNo: s.inspectionNo ?? null,
      itemNo: s.itemNo,
      date: s.date ? String(s.date) : null,
      time: s.time ? String(s.time) : null,
      startMH: s.startMH,
      startMHDepth: s.startMHDepth ? String(s.startMHDepth) : null,
      finishMH: s.finishMH,
      finishMHDepth: s.finishMHDepth ? String(s.finishMHDepth) : null,
      pipeSize: s.pipeSize ?? null,
      pipeMaterial: s.pipeMaterial ?? null,
      totalLengthM: s.totalLengthM ? String(s.totalLengthM) : null,
      surveyedLengthM: s.surveyedLengthM ? String(s.surveyedLengthM) : null,
      observations: s.observations ?? null,
      severityGrade: s.severityGrade ?? null,
      srmGrading: s.srmGrading ?? null,
      recommendation: s.recommendation ?? null,
      adoptable: s.adoptable ?? null,
      costGBP: s.costGBP ? String(s.costGBP) : null,
    };

    // helper for filtering defects by code
    const toInput = (codes: string[]) => ({
      itemNo: s.itemNo,
      pipeSize: s.pipeSize ?? undefined,
      pipeMaterial: s.pipeMaterial ?? undefined,
      observations: s.observations ?? undefined,
      defects: s.defects.filter(d => codes.includes(d.code)),
    });

    if (hasSER && hasSTR) {
      // 1️⃣ SER row
      const serEval = evaluateSection(sector, toInput(["SER"]));
      expanded.push({
        ...base,
        recommendation: serEval.recommendation,
        adoptable: serEval.adoptable,
        srmGrading: serEval.srmGrading,
        severityGrade: serEval.severityGrade,
        costGBP: serEval.costGBP != null ? String(serEval.costGBP) : null,
      });

      // 2️⃣ STR row (with "a" suffix)
      const strEval = evaluateSection(sector, toInput(["STR"]));
      expanded.push({
        ...base,
        itemNo: `${s.itemNo}a`,
        recommendation: strEval.recommendation,
        adoptable: strEval.adoptable,
        srmGrading: strEval.srmGrading,
        severityGrade: strEval.severityGrade,
        costGBP: strEval.costGBP != null ? String(strEval.costGBP) : null,
      });
    } else {
      const evalCodes = s.defects.map(d => d.code);
      const evalOut = evaluateSection(sector, toInput(evalCodes));
      expanded.push({
        ...base,
        recommendation: evalOut.recommendation,
        adoptable: evalOut.adoptable,
        srmGrading: evalOut.srmGrading,
        severityGrade: evalOut.severityGrade,
        costGBP: evalOut.costGBP != null ? String(evalOut.costGBP) : null,
      });
    }
  }

  return NextResponse.json({ rows: expanded, sector });
}
