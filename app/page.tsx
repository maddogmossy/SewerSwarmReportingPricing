// app/page.tsx
import Link from "next/link";
import { Upload, BarChart3, Settings, FileText } from "lucide-react";
import { DevLabel } from "@/components/PageId";

export default function Home() {
  const card = {
    container:
      "relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8",
    title: "text-2xl font-extrabold tracking-tight text-slate-900",
    subtitle: "mt-2 text-slate-600",
    ctaPrimary:
      "inline-block rounded-lg px-4 py-2 text-white bg-slate-900 hover:bg-slate-800",
    ctaGhost:
      "inline-block rounded-lg px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100",
  } as const;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Hero */}
      <section className="relative rounded-2xl bg-slate-100 p-6 md:p-8">
        {/* Page badge */}
        <DevLabel id="P1" position="top-right" />

        <h1 className="text-5xl md:text-6xl font-black leading-tight">
          Welcome to <span className="text-primary">Sewer Swarm AI</span>
        </h1>
        <p className="mt-3 text-lg md:text-xl text-slate-600 max-w-3xl">
          Professional sewer condition analysis and reporting with AI-powered
          insights
        </p>
      </section>

      {/* Quick actions */}
      <section className="grid gap-6">
        {/* C001 */}
        <div className={card.container}>
          <DevLabel id="C001" />
          <h2 className={card.title}>Welcome back</h2>
          <p className={card.subtitle}>
            Choose your next action to manage your sewer inspection reports
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {/* If /dashboard is removed for now, make this a disabled button or change the link */}
            <Link href="#" aria-disabled className={card.ctaGhost}>
              Dashboard
            </Link>
            <Link href="/settings" className={card.ctaGhost}>
              Settings
            </Link>
            <Link href="/sign-out" className={card.ctaGhost}>
              Sign Out
            </Link>
          </div>
        </div>

        {/* C002 */}
        <div className={card.container}>
          <DevLabel id="C002" />
          <div className="flex items-start gap-4">
            <div className="mx-auto md:mx-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className={card.title}>Upload Report</h2>
              <p className={card.subtitle}>
                Upload CCTV inspection files and select sector for analysis
              </p>
              <div className="mt-4">
                <Link href="/upload" className={card.ctaPrimary}>
                  Go to Upload
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* C003 */}
        <div className={card.container}>
          <DevLabel id="C003" />
          <div className="flex items-start gap-4">
            <div className="mx-auto md:mx-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className={card.title}>Dashboard</h2>
              <p className={card.subtitle}>
                View inspection data and analysis results across all reports
              </p>
              {/* If you’ve deleted /dashboard, keep this disabled until we add a new one */}
              <div className="mt-4">
                <span
                  className="inline-block rounded-lg px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 select-none"
                  aria-disabled
                >
                  Open Dashboard (coming soon)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* C004 */}
        <div className={card.container}>
          <DevLabel id="C004" />
          <div className="flex items-start gap-4">
            <div className="mx-auto md:mx-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className={card.title}>Pricing Settings</h2>
              <p className={card.subtitle}>
                Customize repair cost estimates per sector
              </p>
              <div className="mt-4">
                <span
                  className="inline-block rounded-lg px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 select-none"
                  aria-disabled
                >
                  Configure (coming soon)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* C005 */}
        <div className={card.container}>
          <DevLabel id="C005" />
          <div className="flex items-start gap-4">
            <div className="mx-auto md:mx-0 w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h2 className={card.title}>Uploaded Reports</h2>
              <p className={card.subtitle}>
                Manage reports and organize project folders
              </p>
              <div className="mt-4">
                <span
                  className="inline-block rounded-lg px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 select-none"
                  aria-disabled
                >
                  Open Reports (soon)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}