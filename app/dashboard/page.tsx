import { db } from '@/db';
import { uploads, sections as sectionsTable, defects as defectsTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getQueryParam(searchParams: URLSearchParams, key: string) {
  const v = searchParams.get(key);
  return v ? decodeURIComponent(v) : '';
}

export default async function DashboardPage({ searchParams }: { searchParams: Record<string, string> }) {
  const params = new URLSearchParams(searchParams as any);
  const sector = getQueryParam(params, 'sector') || 'S1';
  const client = getQueryParam(params, 'client') || '';
  const project = getQueryParam(params, 'project') || '';

  // Find the most recent upload row for grouping
  const uploadRows = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.sector, sector), eq(uploads.client, client), eq(uploads.project, project)));

  // Tie sections/defects to the first upload of this project (as we saved them)
  const baseUploadId = uploadRows[0]?.id ?? 0;
  const sectionRows = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.uploadId, baseUploadId));

  const defectRows = await db
    .select()
    .from(defectsTable)
    .where(eq(defectsTable.uploadId, baseUploadId));

  // Group defects by sectionNo
  const defectsBySection = new Map<number, typeof defectRows>();
  for (const d of defectRows) {
    const arr = defectsBySection.get(d.sectionNo) ?? [];
    arr.push(d);
    defectsBySection.set(d.sectionNo, arr);
  }

  return (
    <main className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/reports" className="text-sm text-indigo-700 hover:underline">← Back to P4</Link>
      </div>
      <p className="text-sm text-gray-600">
        Viewing: {project} • {client} • Sector {sector}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2">Section No</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Start MH</th>
              <th className="px-3 py-2">Finish MH</th>
              <th className="px-3 py-2">Pipe Size</th>
              <th className="px-3 py-2">Pipe Material</th>
              <th className="px-3 py-2">Total Length (m)</th>
              <th className="px-3 py-2">Length Surveyed (m)</th>
              <th className="px-3 py-2">Observations</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Adoptable</th>
              <th className="px-3 py-2">Cost (£)</th>
              <th className="px-3 py-2">Standard</th>
            </tr>
          </thead>
          <tbody>
            {sectionRows.map((s, idx) => {
              const defects = defectsBySection.get(s.sectionNo) ?? [];
              const obs = s.observationSummary ?? '';
              const bg = idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40';
              return (
                <tr key={s.id} className={bg}>
                  <td className="px-3 py-2">{s.sectionNo}</td>
                  <td className="px-3 py-2">{s.date} {s.time}</td>
                  <td className="px-3 py-2">{s.startMH}</td>
                  <td className="px-3 py-2">{s.finishMH}</td>
                  <td className="px-3 py-2">{s.pipeSize}</td>
                  <td className="px-3 py-2">{s.pipeMaterial}</td>
                  <td className="px-3 py-2">{s.totalLengthM}</td>
                  <td className="px-3 py-2">{s.lengthSurveyedM}</td>
                  <td className="px-3 py-2">
                    <div className="max-w-[520px] truncate" title={obs}>
                      {obs || '—'}
                    </div>
                    {!!defects.length && (
                      <div className="mt-1 text-xs text-slate-600">
                        {defects.map((d) => (
                          <div key={d.id}>
                            <span className="font-mono">{d.code}</span>
                            {d.atMeters ? ` @ ${d.atMeters}m` : ''} — {d.details}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{s.severityGrade || '—'}</td>
                  <td className="px-3 py-2">{s.adoptable == null ? '—' : (s.adoptable ? 'Yes' : 'No')}</td>
                  <td className="px-3 py-2">{s.costEstimateGBP || '—'}</td>
                  <td className="px-3 py-2">{s.standard || '—'}</td>
                </tr>
              );
            })}
            {!sectionRows.length && (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500">
                  No extracted sections yet for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
