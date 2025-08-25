// app/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload, BarChart3, Settings as Gear, FileText, Gift } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* P1: Hero section */}
      <DevLabel id="P1" />
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
        Welcome to <span className="text-blue-600">Sewer</span>{" "}
        <span className="text-blue-600">Swarm AI</span>
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600 text-lg">
        Professional sewer condition analysis and reporting with AI-powered insights
      </p>

      {/* ===== C002: Welcome back actions ===== */}
      <section className="relative mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C002" />
        <h2 className="text-3xl font-extrabold text-slate-900">Welcome back, Test!</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Choose your next action to manage your sewer inspection reports.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-200"
          >
            <Gear className="h-5 w-5" />
            Settings
          </Link>
          <Link
            href="/signout"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            Sign Out
          </Link>
        </div>
      </section>

      {/* ===== C003: Upload ===== */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C003" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-sky-100 p-3">
            <Upload className="h-6 w-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Upload Report</h3>
            <p className="mt-2 text-slate-600">
              Upload CCTV inspection files and select applicable sector for analysis.
            </p>
          </div>
        </div>
      </section>

      {/* ===== C004: Dashboard card ===== */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C004" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-emerald-100 p-3">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Dashboard</h3>
            <p className="mt-2 text-slate-600">
              View section inspection data and analysis results across all reports.
            </p>
          </div>
        </div>
      </section>

      {/* ===== C005: Pricing settings ===== */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C005" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-orange-100 p-3">
            <Gear className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Pricing Settings</h3>
            <p className="mt-2 text-slate-600">
              Customize repair cost estimates for each sector based on your market rates
            </p>
          </div>
        </div>
      </section>

      {/* ===== C006: Uploaded Reports ===== */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C006" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-cyan-100 p-3">
            <FileText className="h-6 w-6 text-cyan-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Uploaded Reports</h3>
            <p className="mt-2 text-slate-600">
              Manage your inspection reports and organize project folders.
            </p>
          </div>
        </div>
      </section>

      {/* ===== C007: Upgrade plan ===== */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C007" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-violet-100 p-3">
            <Gift className="h-6 w-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Upgrade Plan</h3>
            <p className="mt-2 text-slate-600">
              Access premium features and unlimited report processing
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}