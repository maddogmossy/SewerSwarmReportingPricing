// app/page.tsx
import Link from "next/link";
import { DevLabel } from "@/components/PageId"; // <-- named import

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 relative">
      {/* Page Label */}
      <DevLabel id="P1" />

      {/* Hero Section */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Welcome to <span className="text-blue-600">Sewer Swarm AI</span>
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>

        <div className="mt-4 flex gap-2">
          <span className="px-3 py-1 text-xs bg-slate-100 rounded">MSCC5R</span>
          <span className="px-3 py-1 text-xs bg-slate-100 rounded">WRc</span>
          <span className="px-3 py-1 text-xs bg-slate-100 rounded">SRM4</span>
        </div>
      </section>

      {/* Welcome Back */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
        <p className="text-slate-600">
          Choose your next action to manage your sewer inspection reports.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Dashboard
          </Link>
          <Link href="/settings" className="px-4 py-2 rounded bg-slate-200 text-slate-800 hover:bg-slate-300">
            Settings
          </Link>
          <Link href="/signout" className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
            Sign Out
          </Link>
        </div>
      </section>

      {/* Upload Report */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900">Upload Report</h2>
        <p className="text-slate-600">Upload CCTV inspection files and select sector for analysis.</p>
        <Link href="/upload" className="mt-3 inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          Go to Upload
        </Link>
      </section>
    </main>
  );
}