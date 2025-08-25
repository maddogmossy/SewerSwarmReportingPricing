// app/page.tsx
import Link from "next/link";
import DevLabel from "@/components/DevLabel";

export default function Home() {
  const card = "rounded-lg border border-slate-200 bg-white shadow-sm p-6";
  const chip = "inline-flex items-center rounded bg-slate-100 text-slate-700 text-xs px-2 py-1";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* P1 dev label */}
      <DevLabel id="P1" position="top-right" />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-slate-100 p-8 border border-slate-200">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Welcome to <span className="text-primary">Sewer Swarm AI</span>
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Professional sewer condition analysis and reporting with AI-powered insights.
          </p>
          <div className="mt-4 space-x-2">
            <span className={chip}>MSCC5R</span>
            <span className={chip}>WRc</span>
            <span className={chip}>SRM4</span>
          </div>
        </div>
      </section>

      {/* Quick actions (C001–C006) */}
      <section className="max-w-5xl mx-auto px-4 grid gap-5 md:grid-cols-2">
        <div className={`${card} relative`}>
          <DevLabel id="C001" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="text-slate-600 mt-1">
            Choose your next action to manage your sewer inspection reports.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="px-3 py-2 rounded border bg-slate-50 hover:bg-slate-100" href="/dashboard">
              Dashboard
            </Link>
            <Link className="px-3 py-2 rounded border bg-slate-50 hover:bg-slate-100" href="/settings">
              Settings
            </Link>
            <Link className="px-3 py-2 rounded border bg-slate-50 hover:bg-slate-100" href="/sign-out">
              Sign Out
            </Link>
          </div>
        </div>

        <div className={`${card} relative`}>
          <DevLabel id="C002" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Upload Report</h2>
          <p className="text-slate-600 mt-1">Upload CCTV inspection files and select sector for analysis.</p>
          <Link className="mt-4 inline-block px-4 py-2 rounded bg-slate-900 text-white" href="/upload">
            Go to Upload
          </Link>
        </div>

        <div className={`${card} relative`}>
          <DevLabel id="C003" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-slate-600 mt-1">View inspection data and analysis across all reports.</p>
          <Link className="mt-4 inline-block px-4 py-2 rounded bg-emerald-600 text-white" href="/dashboard">
            Open Dashboard
          </Link>
        </div>

        <div className={`${card} relative`}>
          <DevLabel id="C004" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Pricing Settings</h2>
          <p className="text-slate-600 mt-1">Customize repair cost estimates per sector.</p>
          <Link className="mt-4 inline-block px-4 py-2 rounded border" href="/pricing">
            Configure (soon)
          </Link>
        </div>

        <div className={`${card} relative`}>
          <DevLabel id="C005" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Uploaded Reports</h2>
          <p className="text-slate-600 mt-1">Manage reports and organize project folders.</p>
          <Link className="mt-4 inline-block px-4 py-2 rounded border" href="/reports">
            Open Reports (soon)
          </Link>
        </div>

        <div className={`${card} relative`}>
          <DevLabel id="C006" className="absolute -top-2 -right-2" />
          <h2 className="text-xl font-semibold">Sectors</h2>
          <p className="text-slate-600 mt-1">Pick your industry sector to tailor analysis rules.</p>
          {/* C006 → P2 (/sectors) */}
          <Link className="mt-4 inline-block px-4 py-2 rounded bg-primary text-primary-foreground" href="/sectors">
            Go to Sectors
          </Link>
        </div>
      </section>

      {/* Supported Sectors & File Formats */}
      <section className="max-w-5xl mx-auto px-4 grid gap-5 md:grid-cols-2 my-6">
        <div className={`${card} relative`}>
          <DevLabel id="C007" className="absolute -top-2 -right-2" />
          <h3 className="text-lg font-semibold">Supported Sectors</h3>
          <ul className="mt-3 text-slate-700 space-y-2">
            <li><strong>Utilities</strong> — WRc SRM</li>
            <li><strong>Adoption</strong> — SfA8</li>
            <li><strong>Highways</strong> — DMRB</li>
            <li><strong>Domestic</strong> — Reg. compliance</li>
            <li><strong>Insurance</strong> — ABI guidelines</li>
            <li><strong>Construction</strong> — Building regs</li>
          </ul>
        </div>
        <div className={`${card} relative`}>
          <DevLabel id="C008" className="absolute -top-2 -right-2" />
          <h3 className="text-lg font-semibold">File Formats</h3>
          <ul className="mt-3 text-slate-700 space-y-2">
            <li><strong>PDF Reports</strong> — up to 50MB</li>
            <li><strong>Database (.db)</strong> — up to 50MB</li>
            <li><strong>Standards</strong> — WRc/WTI OS19/20x</li>
            <li><strong>Output</strong> — MSCC5R compliant</li>
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-10">
        <p className="text-sm text-slate-500">
          Health check: <Link className="underline" href="/api/health">/api/health</Link>
        </p>
      </section>
    </main>
  );
}