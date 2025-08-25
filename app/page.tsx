// app/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload, BarChart3, Settings as Gear, FileText, Gift } from "lucide-react";

// Reusable clickable card that 404s by default (replace href later)
function ClickCard({
  id,
  href = `/__todo/${id.toLowerCase()}`, // <- non-existent: shows 404 for now
  children,
}: {
  id: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <CardId id={id} />
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* P1: Hero (no card, no chips) */}
      <DevLabel id="P1" />
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
        Welcome to <span className="text-blue-600">Sewer</span>{" "}
        <span className="text-blue-600">Swarm AI</span>
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600 text-lg">
        Professional sewer condition analysis and reporting with AI-powered insights
      </p>

      {/* C1: Welcome back (clickable card → 404 for now) */}
      <ClickCard id="C1">
        <h2 className="text-3xl font-extrabold text-slate-900">Welcome back, Test!</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Choose your next action to manage your sewer inspection reports.
        </p>
      </ClickCard>

      {/* C2: Upload Report */}
      <ClickCard id="C2">
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
      </ClickCard>

      {/* C3: Dashboard */}
      <ClickCard id="C3">
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
      </ClickCard>

      {/* C4: Pricing Settings */}
      <ClickCard id="C4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-orange-100 p-3">
            <Gear className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Pricing Settings</h3>
            <p className="mt-2 text-slate-600">
              Customize repair cost estimates for each sector based on your market rates.
            </p>
          </div>
        </div>
      </ClickCard>

      {/* C5: Uploaded Reports */}
      <ClickCard id="C5">
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
      </ClickCard>

      {/* C6: Upgrade Plan */}
      <ClickCard id="C6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-violet-100 p-3">
            <Gift className="h-6 w-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-extrabold text-slate-900">Upgrade Plan</h3>
            <p className="mt-2 text-slate-600">
              Access premium features and unlimited report processing.
            </p>
          </div>
        </div>
      </ClickCard>
    </main>
  );
}