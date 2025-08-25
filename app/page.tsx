// app/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";

// If lucide-react is not installed, run locally once: npm i lucide-react
import {
  UploadCloud,
  BarChart3,
  Cog,
  Files,
  Building2,
} from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      {/* HERO / P1 */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 p-6 md:p-8">
        <DevLabel id="P1" />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
            Sewer Swarm AI
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">
          Professional sewer condition analysis and reporting with AI-powered
          insights
        </p>

        {/* Standards chips */}
        <div className="mt-4 flex gap-2">
          <span className="rounded-xl bg-slate-900/5 px-3 py-1 text-sm font-medium text-slate-700">
            MSCC5R
          </span>
          <span className="rounded-xl bg-slate-900/5 px-3 py-1 text-sm font-medium text-slate-700">
            WRc
          </span>
          <span className="rounded-xl bg-slate-900/5 px-3 py-1 text-sm font-medium text-slate-700">
            SRM4
          </span>
        </div>
      </section>

      {/* ACTION CARDS */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* C001 – Welcome actions (kept simple) */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C001" />
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-slate-600">
            Choose your next action to manage your sewer inspection reports
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
            >
              Settings
            </Link>
            <button
              className="rounded-lg bg-rose-500 px-4 py-2 font-medium text-white"
              onClick={() => alert("Signed out (stub)")}
            >
              Sign Out
            </button>
          </div>
        </section>

        {/* C002 – Upload */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C002" />
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <UploadCloud className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Upload Report</h3>
          <p className="mt-2 text-slate-600">
            Upload CCTV inspection files and select applicable sector for
            analysis
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
          >
            Go to Upload
          </Link>
        </section>

        {/* C003 – Dashboard (will 404 until you build it) */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C003" />
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Dashboard</h3>
          <p className="mt-2 text-slate-600">
            View inspection data and analysis results across all reports.
          </p>
          <Link
            href="/dashboard" /* this will show Next.js 404 until the page exists */
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
          >
            Open Dashboard
          </Link>
        </section>

        {/* C004 – Pricing */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C004" />
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <Cog className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Pricing Settings</h3>
          <p className="mt-2 text-slate-600">
            Customize repair cost estimates for each sector based on your
            market rates.
          </p>
          <button className="mt-4 cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-500">
            Configure (soon)
          </button>
        </section>

        {/* C005 – Reports */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C005" />
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
            <Files className="h-6 w-6 text-sky-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Uploaded Reports</h3>
          <p className="mt-2 text-slate-600">
            Manage your inspection reports and organize project folders.
          </p>
          <button className="mt-4 cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-500">
            Open Reports (soon)
          </button>
        </section>

        {/* C006 – Sectors */}
        <section className="relative rounded-xl border border-slate-200 bg-white p-6">
          <CardId id="C006" />
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Sectors</h3>
          <p className="mt-2 text-slate-600">
            Pick your industry sector to tailor analysis rules.
          </p>
          <Link
            href="/sectors"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white"
          >
            Go to Sectors
          </Link>
        </section>
      </div>
    </main>
  );
}