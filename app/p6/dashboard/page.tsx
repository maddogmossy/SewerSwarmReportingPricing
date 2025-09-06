// app/p6/dashboard/page.tsx
import "server-only";
import Link from "next/link";

async function fetchRows(reportId: string, sector?: string) {
  const qs = new URLSearchParams({ reportId });
  if (sector) qs.set("sector", sector);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/sections?${qs.toString()}`, {
    // ensure server fetch; revalidate as you like
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load sections");
  return res.json() as Promise<{ rows: any[]; sector: string }>;
}

export default async function P6DashboardPage({
  searchParams,
}: {
  searchParams: { reportId?: string; sector?: string };
}) {
  const reportId = searchParams?.reportId ?? "1"; // default/demo
  const sector = searchParams?.sector;

  const { rows, sector: resolvedSector } = await fetchRows(reportId, sector);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Page badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P6
      </span>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="text-sm text-slate-600">Sector: <span className="font-medium">{resolvedSector}</span></div>
        </div>

        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:whitespace-nowrap">
                <th>Project No</th>
                <th>Item No</th>
                <th>Inspect. No</th>
                <th>Date</th>
                <th>Time</th>
                <th>Start MH</th>
                <th>Start MH Depth</th>
                <th>Finish MH</th>
                <th>Finish MH Depth</th>
                <th>Pipe Size</th>
                <th>Pipe Material</th>
                <th>Total Length (m)</th>
                <th>Length Surveyed (m)</th>
                <th>Observations</th>
                <th>Severity Grade</th>
                <th>SRM Grading</th>
                <th>Recommendations</th>
                <th>Adoptable</th>
                <th>Cost (£)</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-slate-50/40">
              {rows.map((r, i) => (
                <tr key={`${r.id}-${i}`} className="[&>td]:px-3 [&>td]:py-2 align-top">
                  <td>{r.projectNo}</td>
                  <td className="font-medium">{r.itemNo}</td>
                  <td>{r.inspectionNo ?? ""}</td>
                  <td>{r.date ?? ""}</td>
                  <td>{r.time ?? ""}</td>
                  <td>{r.startMH ?? ""}</td>
                  <td>{r.startMHDepth ?? ""}</td>
                  <td>{r.finishMH ?? ""}</td>
                  <td>{r.finishMHDepth ?? ""}</td>
                  <td>{r.pipeSize ?? ""}</td>
                  <td>{r.pipeMaterial ?? ""}</td>
                  <td>{r.totalLengthM ?? ""}</td>
                  <td>{r.surveyedLengthM ?? ""}</td>
                  <td className="max-w-[340px] whitespace-pre-wrap">{r.observations ?? ""}</td>
                  <td>{r.severityGrade ?? ""}</td>
                  <td>{r.srmGrading ?? ""}</td>
                  <td className="max-w-[380px] whitespace-pre-wrap">{r.recommendation ?? ""}</td>
                  <td>{r.adoptable === null ? "" : r.adoptable ? "Yes" : "No"}</td>
                  <td>{r.costGBP ?? ""}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={19} className="px-3 py-8 text-center text-slate-500">
                    No sections found for report {reportId}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Tip: pass <code>?reportId=123&amp;sector=SA</code> in the URL.
        </div>
      </div>
    </main>
  );
}
