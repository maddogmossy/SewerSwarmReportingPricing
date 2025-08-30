import Link from "next/link";
import {
  UploadCloud,
  BarChart2,
  Settings2,
  FolderOpen,
  Gift,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* P1 badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P1
      </span>

      {/* Hero */}
      <header className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome to Sewer Swarm AI
            </h1>
            <p className="mt-2 text-slate-600">
              Professional sewer condition analysis and reporting with
              AI-powered insights
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/settings"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
            >
              Settings
            </Link>
            <Link
              href="/signout"
              className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* C2 Upload */}
        <Link
          href="/upload"
          className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            C2
          </span>
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Upload Report</div>
              <p className="mt-1 text-slate-600">
                Upload CCTV inspection files and select an applicable sector for
                analysis
              </p>
            </div>
          </div>
        </Link>

        {/* C3 Dashboard */}
        <Link
          href="/dashboard"
          className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            C3
          </span>
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Dashboard</div>
              <p className="mt-1 text-slate-600">
                View section inspection data and analysis results across all
                reports
              </p>
            </div>
          </div>
        </Link>

        {/* C4 Pricing */}
        <Link
          href="/pricing"
          className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            C4
          </span>
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Pricing Settings</div>
              <p className="mt-1 text-slate-600">
                Customize repair cost estimates for each sector based on your
                market rates
              </p>
            </div>
          </div>
        </Link>

        {/* C5 Uploaded Reports — NOTE: now links to /reports */}
        <Link
          href="/reports"
          className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            C5
          </span>
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Uploaded Reports</div>
              <p className="mt-1 text-slate-600">
                Manage your inspection reports and organize project folders
              </p>
            </div>
          </div>
        </Link>

        {/* C6 Upgrade */}
        <Link
          href="/billing"
          className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            C6
          </span>
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-semibold">Upgrade Plan</div>
              <p className="mt-1 text-slate-600">
                Access premium features and unlimited report processing
              </p>
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}