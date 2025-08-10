import React, { useEffect, useState } from "react";

type Rec = {
  rec_type: string;
  severity?: number;
  at?: number | null;
  cost?: { currency: string; subtotal: number; breakdown: any } | null;
};

export default function RecommendationsCard({ sectionId }: { sectionId: string }) {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [totals, setTotals] = useState<{ currency: string; subtotal: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/sections/${sectionId}/recommendations`);
      const j = await r.json();
      if (!alive) return;
      setRecs(j.recommendations || []);
      setTotals(j.totals || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [sectionId]);

  if (loading) return <div>Loading recommendations…</div>;

  return (
    <div className="border rounded p-4 bg-white">
      <h3 className="font-semibold mb-2">Recommended Actions</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th>Action</th><th>Severity</th><th>At (m)</th><th>Estimated Cost</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((r, i) => (
            <tr key={i} className="border-b">
              <td>{r.rec_type}</td>
              <td>{r.severity ?? "-"}</td>
              <td>{typeof r.at === "number" ? r.at.toFixed(2) : "-"}</td>
              <td>
                {r.cost ? `${r.cost.currency} £${r.cost.subtotal.toFixed(2)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totals && (
        <div className="mt-3 font-medium">
          Section total: {totals.currency} £{totals.subtotal.toFixed(2)}
        </div>
      )}
    </div>
  );
}