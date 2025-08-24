// app/page.tsx
import Link from "next/link";
import { CheckCircle2, BarChart3, Settings, UploadCloud } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Heading with color */}
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-7 w-7 text-green-600" />
        <h1 className="text-3xl font-bold heading-gradient">
          Home is back
        </h1>
      </div>

      {/* Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl font-semibold">Upload Report</h2>
          <p className="muted mt-1">
            Upload CCTV inspection files and select sector for analysis
          </p>
          <Link href="/upload" className="btn-primary mt-4 inline-flex">
            <UploadCloud className="h-4 w-4" />
            Go to Upload
          </Link>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="muted mt-1">
            View inspection data and analysis across all reports
          </p>
          <Link href="/dashboard" className="btn-primary mt-4 inline-flex">
            <BarChart3 className="h-4 w-4" />
            Open Dashboard
          </Link>
        </div>

        <div className="card p-5 md:col-span-2">
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="muted mt-1">Customize pricing per sector</p>
          <Link href="/settings" className="btn-primary mt-4 inline-flex">
            <Settings className="h-4 w-4" />
            Open Settings
          </Link>
        </div>
      </section>
    </main>
  );
}