// app/page.tsx
"use client";

import { Upload, BarChart3, Cog, FileText, Gift } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Hero */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Welcome to Sewer{" "}
          <span className="text-primary">Swarm AI</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
      </section>

      {/* User actions */}
      <section className="rounded-lg border bg-card shadow-card">
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Welcome back, Test!</h2>
              <p className="text-muted-foreground">
                Choose your next action to manage your sewer inspection reports
              </p>
            </div>

            {/* C001 – settings/sign out */}
            <div className="flex items-center gap-2 text-sm" aria-label="(id: C001)">
              <a
                href="/settings"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2
                           text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground
                           transition"
              >
                <Cog className="h-4 w-4" />
                Settings
              </a>
              <a
                href="/api/auth/signout"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2
                           text-white bg-destructive border-destructive hover:opacity-90 transition"
              >
                Sign Out
              </a>
            </div>
          </div>
          <p className="sr-only">(id: C001)</p>
        </div>
      </section>

      {/* Cards grid */}
      <section className="grid sm:grid-cols-2 gap-6">
        {/* Upload – brand.blue */}
        <Card
          idLabel="C002"
          href="/upload"
          title="Upload Report"
          subtitle="Upload CCTV inspection files and select applicable sector for analysis"
          icon={<Upload className="h-6 w-6" />}
          iconClasses="bg-brand-blue/15 text-brand-blue"
        />

        {/* Dashboard – brand.green */}
        <Card
          idLabel="C003"
          href="/dashboard"
          title="Dashboard"
          subtitle="View section inspection data and analysis results across all reports"
          icon={<BarChart3 className="h-6 w-6" />}
          iconClasses="bg-brand-green/15 text-brand-green"
        />

        {/* Pricing – brand.orange */}
        <Card
          idLabel="C004"
          href="#"
          title="Pricing Settings"
          subtitle="Customize repair cost estimates for each sector based on your market rates"
          icon={<Cog className="h-6 w-6" />}
          iconClasses="bg-brand-orange/15 text-brand-orange"
        />

        {/* Reports – brand.sky */}
        <Card
          idLabel="C005"
          href="#"
          title="Uploaded Reports"
          subtitle="Manage your inspection reports and organize project folders"
          icon={<FileText className="h-6 w-6" />}
          iconClasses="bg-brand-sky/15 text-brand-sky"
        />

        {/* Upgrade – brand.violet */}
        <Card
          idLabel="C006"
          href="#"
          title="Upgrade Plan"
          subtitle="Access premium features and unlimited report processing"
          icon={<Gift className="h-6 w-6" />}
          iconClasses="bg-brand-violet/15 text-brand-violet"
        />
      </section>

      {/* Supported sectors */}
      <section className="rounded-lg border bg-card p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-3">Supported Sectors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm">
          <Row left="Utilities" right="WRc SRM standards" />
          <Row left="Adoption" right="SfA8 compliance" />
          <Row left="Highways" right="DMRB standards" />
          <Row left="Domestic" right="Regulatory compliance" />
          <Row left="Insurance" right="ABI guidelines" />
          <Row left="Construction" right="Building regs" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">(id: C007)</p>
      </section>
    </main>
  );
}

/* ---------- helpers ---------- */

function Card({
  idLabel,
  href,
  title,
  subtitle,
  icon,
  iconClasses,
}: {
  idLabel: string;
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClasses: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-lg border bg-card p-6 shadow-card hover:shadow-md transition"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${iconClasses}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="mt-4 text-right text-xs text-muted-foreground">(id: {idLabel})</p>
    </a>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <>
      <div>{left}</div>
      <div className="text-muted-foreground">{right}</div>
    </>
  );
}
