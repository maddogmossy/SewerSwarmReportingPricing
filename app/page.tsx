"use client";

import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { DashboardIcon, CogIcon, SignOutIcon, UploadIcon } from "@/components/Icons";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 relative space-y-6">
      {/* Page label */}
      <DevLabel id="P1" position="top-right" />

      {/* C001 – Hero / Welcome card */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C001" />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Welcome to <span className="text-blue-600">Sewer Swarm AI</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">MSCC5R</span>
          <span className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">WRc</span>
          <span className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">SRM4</span>
        </div>
      </section>

      {/* C002 – Welcome back / quick actions */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C002" />
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, Test!</h2>
        <p className="mt-1 text-slate-600">
          Choose your next action to manage your sewer inspection reports
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            <DashboardIcon className="h-5 w-5" />
            Dashboard
          </Link>

          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300"
          >
            <CogIcon className="h-5 w-5" />
            Settings
          </Link>

          <button
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            type="button"
          >
            <SignOutIcon className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </section>

      {/* C003 – Upload report (with large symbol) */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C003" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-4">
            <UploadIcon className="h-10 w-10 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">Upload Report</h2>
            <p className="mt-1 text-slate-600">
              Upload CCTV inspection files and select sector for analysis.
            </p>
            <Link
              href="/upload"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Go to Upload
            </Link>
          </div>
        </div>
      </section>

      {/* C004 – Dashboard card */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C004" />
        <h3 className="text-xl font-semibold text-slate-900">Dashboard</h3>
        <p className="mt-1 text-slate-600">View inspection data and analysis across all reports.</p>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          <DashboardIcon className="h-5 w-5" />
          Open Dashboard
        </Link>
      </section>

      {/* C005 – Pricing settings */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C005" />
        <h3 className="text-xl font-semibold text-slate-900">Pricing Settings</h3>
        <p className="mt-1 text-slate-600">Customize repair cost estimates per sector.</p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-800"
        >
          <CogIcon className="h-5 w-5" />
          Configure (soon)
        </button>
      </section>

      {/* C006 – Uploaded reports */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C006" />
        <h3 className="text-xl font-semibold text-slate-900">Uploaded Reports</h3>
        <p className="mt-1 text-slate-600">Manage reports and organize project folders.</p>
        <button
          type="button"
          className="mt-3 inline-block rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-800"
        >
          Open Reports (soon)
        </button>
      </section>

      {/* C007 – Sectors */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative">
        <CardId id="C007" />
        <h3 className="text-xl font-semibold text-slate-900">Sectors</h3>
        <p className="mt-1 text-slate-600">Pick your industry sector to tailor analysis rules.</p>
        <Link
          href="/sectors"
          className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Go to Sectors
        </Link>
      </section>
    </main>
  );
}