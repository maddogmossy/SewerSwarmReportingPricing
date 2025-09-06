'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function P6Dashboard() {
  // hard-code for first test; later wire via UI/query params
  const { data } = useSWR('/api/dashboard?reportId=1&sector=SA', fetcher);

  if (!data) return <div className="p-6 text-slate-600">Loading dashboard…</div>;

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">P6 — Dashboard</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              {[
                "Project No","Item No","Inspec. No","Date","Time",
                "Start MH","Start MH Depth","Finish MH","Finish MH Depth",
                "Pipe Size","Pipe Material","Total Length (m)","Length Surveyed (m)",
                "Observations","Severity Grade","SRM Grading","Recommendations",
                "Adoptable","Cost (£)","Tag"
              ].map(h => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any, i: number) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/40">
                <td className="px-3 py-2">{r.projectNo}</td>
                <td className="px-3 py-2">{r.itemNo}</td>
                <td className="px-3 py-2">{r.inspectionNo}</td>
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.time}</td>
                <td className="px-3 py-2">{r.startMH}</td>
                <td className="px-3 py-2">{r.startMHDepth}</td>
                <td className="px-3 py-2">{r.finishMH}</td>
                <td className="px-3 py-2">{r.finishMHDepth}</td>
                <td className="px-3 py-2">{r.pipeSize}</td>
                <td className="px-3 py-2">{r.pipeMaterial}</td>
                <td className="px-3 py-2">{r.totalLengthM}</td>
                <td className="px-3 py-2">{r.surveyedLengthM}</td>
                <td className="px-3 py-2">{r.observations}</td>
                <td className="px-3 py-2">{r.severityGrade}</td>
                <td className="px-3 py-2">{r.srmGrading}</td>
                <td className="px-3 py-2">{r.recommendation}</td>
                <td className="px-3 py-2">{r.adoptable ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{r.costGBP}</td>
                <td className="px-3 py-2">{r.tag ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
