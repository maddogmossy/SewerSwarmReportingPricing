export default function DashboardPage() {
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
      <p className="text-slate-600 mb-6">
        View section inspection data and analysis results across all reports.
      </p>

      {/* TODO: replace with charts/tables of your data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-2">Summary</h2>
          <p className="text-slate-500">Placeholder metric tiles / KPIs.</p>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-2">Recent Reports</h2>
          <p className="text-slate-500">Placeholder list/table.</p>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-2">Trends</h2>
          <p className="text-slate-500">Placeholder chart area.</p>
        </div>
      </div>
    </main>
  );
}