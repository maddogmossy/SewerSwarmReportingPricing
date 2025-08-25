// app/page.tsx
"use client";

import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 relative space-y-6">
      {/* Page ID in top-right */}
      <DevLabel id="P1" position="top-right" />

      {/* Welcome Section */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C001" />
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome to <span className="text-blue-600">Sewer Swarm AI</span>
        </h1>
        <p className="mt-2 text-slate-600">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
        <div className="mt-3 flex space-x-2">
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">MSCC5R</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">WRc</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">SRM4</span>
        </div>
      </section>

      {/* Welcome Back Section */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C002" />
        <h2 className="text-xl font-semibold text-slate-900">Welcome back, Test!</h2>
        <p className="mt-1 text-slate-600">
          Choose your next action to manage your sewer inspection reports
        </p>
        <div className="mt-4 flex space-x-3">
          <Link
            href="/dashboard"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300"
          >
            Settings
          </Link>
          <button className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Sign Out
          </button>
        </div>
      </section>

      {/* Upload Report */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C003" />
        <h2 className="text-xl font-semibold text-slate-900">Upload Report</h2>
        <p className="mt-1 text-slate-600">
          Upload CCTV inspection files and select sector for analysis.
        </p>
        <Link
          href="/upload"
          className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Upload
        </Link>
      </section>

      {/* Dashboard Link */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C004" />
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-slate-600">
          View inspection data and analysis across all reports.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Open Dashboard
        </Link>
      </section>

      {/* Pricing Settings */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C005" />
        <h2 className="text-xl font-semibold text-slate-900">Pricing Settings</h2>
        <p className="mt-1 text-slate-600">
          Customize repair cost estimates per sector.
        </p>
        <button className="mt-3 inline-block rounded bg-slate-200 px-4 py-2 text-slate-800">
          Configure (soon)
        </button>
      </section>

      {/* Uploaded Reports */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C006" />
        <h2 className="text-xl font-semibold text-slate-900">Uploaded Reports</h2>
        <p className="mt-1 text-slate-600">
          Manage reports and organize project folders.
        </p>
        <button className="mt-3 inline-block rounded bg-slate-200 px-4 py-2 text-slate-800">
          Open Reports (soon)
        </button>
      </section>

      {/* Sectors */}
      <section className="rounded-xl border bg-white p-6 shadow-sm relative">
        <CardId id="C007" />
        <h2 className="text-xl font-semibold text-slate-900">Sectors</h2>
        <p className="mt-1 text-slate-600">
          Pick your industry sector to tailor analysis rules.
        </p>
        <Link
          href="/sectors"
          className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Sectors
        </Link>
      </section>
    </main>
  );
}