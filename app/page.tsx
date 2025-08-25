// app/page.tsx
import Link from "next/link";
import { DevLabel } from "@/components/PageId";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Dev page id */}
      <div className="relative">
        <DevLabel id="P1" position="top-right" />
      </div>

      {/* Hero */}
      <section className="rounded-xl p-8 bg-gradient-to-br from-primary/5 to-slate-100 border border-slate-200">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
          Sewer Swarm AI
          <span className="block text-primary mt-2">Report Analysis & Pricing</span>
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-2xl">
          Professional sewer condition analysis and reporting with AI-powered insights.
        </p>
      </section>

      {/* Cards */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* C001 */}
        <Link href="/" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <DevLabel id="C001" />
          </div>
          <p className="text-slate-600 mt-2">Quick links to common actions</p>
          <div className="mt-4 flex gap-2">
            <span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">Home</span>
            <span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">Health</span>
          </div>
        </Link>

        {/* C002 Upload */}
        <Link href="/upload" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Upload Report</h2>
            <DevLabel id="C002" />
          </div>
          <p className="text-slate-600 mt-2">Upload PDF or database files for analysis</p>
          <div className="mt-4 w-12 h-12 rounded-lg bg-blue-100 grid place-items-center text-blue-600 text-2xl">⬆️</div>
        </Link>

        {/* C003 Dashboard (kept, link where your dashboard lives) */}
        <Link href="/dashboard" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <DevLabel id="C003" />
          </div>
          <p className="text-slate-600 mt-2">View inspection data & analysis</p>
          <div className="mt-4 w-12 h-12 rounded-lg bg-emerald-100 grid place-items-center text-emerald-600 text-2xl">📊</div>
        </Link>

        {/* C004 Pricing Settings (placeholder) */}
        <Link href="/pricing" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Pricing Settings</h2>
            <DevLabel id="C004" />
          </div>
          <p className="text-slate-600 mt-2">Customize repair cost estimates</p>
          <div className="mt-4 w-12 h-12 rounded-lg bg-orange-100 grid place-items-center text-orange-600 text-2xl">⚙️</div>
        </Link>

        {/* C005 Reports (placeholder) */}
        <Link href="/reports" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Uploaded Reports</h2>
            <DevLabel id="C005" />
          </div>
          <p className="text-slate-600 mt-2">Manage & organise reports</p>
          <div className="mt-4 w-12 h-12 rounded-lg bg-cyan-100 grid place-items-center text-cyan-600 text-2xl">📄</div>
        </Link>

        {/* C006 -> P2 (Sectors) */}
        <Link href="/sectors" className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold">Sectors</h2>
            <DevLabel id="C006" />
          </div>
          <p className="text-slate-600 mt-2">Browse the six industry sectors</p>
          <div className="mt-4 w-12 h-12 rounded-lg bg-violet-100 grid place-items-center text-violet-600 text-2xl">🏷️</div>
        </Link>
      </section>

      {/* Health link */}
      <p className="mt-8 text-sm">
        Health check: <Link href="/api/health" className="text-primary underline">/api/health</Link>
      </p>
    </main>
  );
}