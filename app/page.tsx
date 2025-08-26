// app/page.tsx
import Link from "next/link";
import { DevCountersProvider, AutoDevLabel, AutoCardId } from "@/components/PageId";
import { Upload, BarChart3, Cog, FileText, Gift } from "lucide-react";

// Reusable clickable card
function ClickCard({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <AutoCardId />
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <DevCountersProvider>
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* ---------- P1: Hero (no chips) ---------- */}
        <AutoDevLabel />
        <section className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Welcome to <span className="text-blue-600">Sewer</span>{" "}
            <span className="text-blue-600">Swarm AI</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Professional sewer condition analysis and reporting with AI-powered insights
          </p>
        </section>

        {/* ---------- C1: Welcome back (Settings + Sign Out) ---------- */}
        <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AutoCardId />
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome back, Test!</h2>
          <p className="mt-2 text-slate-600">
            Choose your next action to manage your sewer inspection reports.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-200"
            >
              <Cog className="h-5 w-5" />
              Settings
            </Link>

            <Link
              href="/api/auth/signout"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Sign Out
            </Link>
          </div>
        </section>

        {/* ---------- C2: Upload Report ---------- */}
        <ClickCard href="/upload">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <Upload className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Upload Report</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                Upload CCTV inspection files and select applicable sector for analysis
              </p>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C3: Dashboard ---------- */}
        <ClickCard href="/__todo/c3">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-50 p-3">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Dashboard</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                View section inspection data and analysis results across all reports
              </p>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C4: Pricing Settings ---------- */}
        <ClickCard href="/__todo/c4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-orange-50 p-3">
              <Cog className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Pricing Settings</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                Customize repair cost estimates for each sector based on your market rates
              </p>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C5: Uploaded Reports ---------- */}
        <ClickCard href="/uploads">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-sky-50 p-3">
              <FileText className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Uploaded Reports</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                Manage your inspection reports and organize project folders
              </p>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C6: Upgrade Plan ---------- */}
        <ClickCard href="/__todo/c6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-purple-50 p-3">
              <Gift className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Upgrade Plan</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                Access premium features and unlimited report processing
              </p>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C7: Supported Sectors ---------- */}
        <ClickCard href="/__todo/c7">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">Supported Sectors</h3>
            <div className="mt-4 grid grid-cols-1 gap-2 text-slate-700 sm:grid-cols-2">
              <div className="flex justify-between"><span>Utilities</span><span className="text-slate-500">WRc SRM standards</span></div>
              <div className="flex justify-between"><span>Adoption</span><span className="text-slate-500">Sfa8 compliance</span></div>
              <div className="flex justify-between"><span>Highways</span><span className="text-slate-500">DMRB standards</span></div>
              <div className="flex justify-between"><span>Domestic</span><span className="text-slate-500">Regulatory compliance</span></div>
              <div className="flex justify-between"><span>Insurance</span><span className="text-slate-500">ABI guidelines</span></div>
              <div className="flex justify-between"><span>Construction</span><span className="text-slate-500">Building regs</span></div>
            </div>
          </div>
        </ClickCard>

        {/* ---------- C8: File Formats ---------- */}
        <ClickCard href="/__todo/c8">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">File Formats</h3>
            <div className="mt-4 grid grid-cols-1 gap-2 text-slate-700 sm:grid-cols-2">
              <div className="flex justify-between"><span>PDF Reports</span><span className="text-slate-500">Up to 50MB</span></div>
              <div className="flex justify-between"><span>Database Files (.db)</span><span className="text-slate-500">Up to 50MB</span></div>
              <div className="flex justify-between"><span>Standards</span><span className="text-slate-500">WRc/WTI OS19/20x</span></div>
              <div className="flex justify-between"><span>Output Format</span><span className="text-slate-500">MSCC5R compliant</span></div>
            </div>
          </div>
        </ClickCard>
      </main>
    </DevCountersProvider>
  );
}