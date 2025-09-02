// app/page.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  UploadCloud,
  BarChart3,
  BadgeDollarSign,
  FolderOpen,
  Crown,
  Settings,
} from "lucide-react";

function PageBadge({ label }: { label: string }) {
  return (
    <span className="absolute left-3 top-3 rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
      {label}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto inline-flex items-center rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
      {children}
    </span>
  );
}

function IconBubble({
  Icon,
  className,
}: {
  Icon: LucideIcon;
  className: string;
}) {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${className}`} aria-hidden>
      <Icon className="h-6 w-6" />
    </div>
  );
}

function RowTile({
  href,
  title,
  subtitle,
  badge,
  Icon,
  tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
  Icon: LucideIcon;
  tone: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <IconBubble Icon={Icon} className={tone} />
        <div className="flex-1">
          <div className="text-xl font-semibold tracking-tight group-hover:opacity-90">
            {title}
          </div>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>
        <Pill>{badge}</Pill>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Sticky page badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P1
      </span>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Top bar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Test!</h1>
            <p className="mt-1 text-slate-600">
              Choose your next action to manage your sewer inspection reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings (keep, but no prefetch) */}
            <Link
              href="/settings"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            {/* Sign out: route not ready — point to home for now */}
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm text-white shadow-sm transition hover:bg-rose-700"
            >
              Sign Out
            </Link>
          </div>
        </div>

        {/* Hero title you requested */}
        <section className="mt-8 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">Welcome to Sewer Swarm AI</h2>
          <p className="mx-auto mt-2 max-w-3xl text-slate-600">
            Professional sewer condition analysis and reporting with AI-powered insights
          </p>
        </section>

        {/* Action cards (C2–C6) */}
        <section className="mt-8 grid gap-4">
          <RowTile
            href="/upload"
            title="Upload Report"
            subtitle="Upload CCTV inspection files and select applicable sector for analysis"
            badge="C2"
            Icon={UploadCloud}
            tone="bg-indigo-100 text-indigo-700"
          />
          <RowTile
            href="/dashboard"
            title="Dashboard"
            subtitle="View section inspection data and analysis results across all reports"
            badge="C3"
            Icon={BarChart3}
            tone="bg-green-100 text-green-700"
          />
          {/* Pricing Settings — route not ready; send to home for now */}
          <RowTile
            href="/p5"
            title="Pricing Settings"
            subtitle="Customize repair cost estimates for each sector based on your market rates"
            badge="C4"
            Icon={BadgeDollarSign}
            tone="bg-amber-100 text-amber-700"
          />
          <RowTile
            href="/uploads"
            title="Uploaded Reports"
            subtitle="Manage your inspection reports and organize project folders"
            badge="C5"
            Icon={FolderOpen}
            tone="bg-sky-100 text-sky-700"
          />
          {/* Upgrade Plan — route not ready; send to home for now */}
          <RowTile
            href="/"
            title="Upgrade Plan"
            subtitle="Access premium features and unlimited report processing"
            badge="C6"
            Icon={Crown}
            tone="bg-violet-100 text-violet-700"
          />
        </section>

        {/* Info cards row (C7 & C8) */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div data-dev-id="C7" className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
              C7
            </span>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600">
                {/* simple bullet */}
                <div className="h-2 w-2 rounded-full bg-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">Supported Sectors</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {[
                ["Utilities", "WRc SRM standards"],
                ["Adoption", "SfA8 compliance"],
                ["Highways", "DMRB standards"],
                ["Domestic", "Regulatory compliance"],
                ["Insurance", "ABI guidelines"],
                ["Construction", "Building regs"],
              ].map(([left, right]) => (
                <li key={left} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-800">{left}</span>
                  <span className="text-sm text-slate-500">{right}</span>
                </li>
              ))}
            </ul>
          </div>

          <div data-dev-id="C8" className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
              C8
            </span>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-700">
                <div className="h-2 w-2 rounded-full bg-teal-700" />
              </div>
              <h3 className="text-xl font-semibold">File Formats</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {[
                ["PDF Reports", "Up to 50MB"],
                ["Database Files (.db/.db3)", "Up to 50MB"],
                ["Standards", "WRc/WTI OS19/20x"],
                ["Output Format", "MSCC5R compliant"],
              ].map(([left, right]) => (
                <li key={left} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-800">{left}</span>
                  <span className="text-sm text-slate-500">{right}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
