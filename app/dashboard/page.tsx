// app/dashboard/page.tsx
import Link from "next/link";
import { BarChart3, UploadCloud, Settings, FolderOpen, CreditCard } from "lucide-react";
import PageId from "@/components/PageId";

export const metadata = {
  title: "Dashboard – Sewer Swarm AI",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-accent p-6">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <PageId id="C003" />
        </div>
        <p className="mt-2 text-muted-foreground">
          View inspection data and analysis results across all reports.
        </p>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          id="D001"
          title="Upload Report"
          desc="Add new CCTV inspections for processing"
          href="/upload"
          Icon={UploadCloud}
        />
        <ActionCard
          id="D002"
          title="Open Reports"
          desc="Browse previously uploaded files"
          href="/reports"
          Icon={FolderOpen}
        />
        <ActionCard
          id="D003"
          title="Pricing Settings"
          desc="Configure sector-based pricing"
          href="/pricing"
          Icon={Settings}
        />
        <ActionCard
          id="D004"
          title="Analytics"
          desc="Charts & KPIs across all jobs"
          href="#"
          Icon={BarChart3}
        />
        <ActionCard
          id="D005"
          title="Upgrade Plan"
          desc="Access premium features"
          href="/checkout"
          Icon={CreditCard}
        />
      </section>

      {/* Example analytics block */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Overview</h2>
          <PageId id="D100" />
        </div>
        <p className="mt-2 text-muted-foreground">
          Coming soon: interactive charts for defects, grades, and cost estimates.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Reports Uploaded" value="128" />
          <Stat label="Defects Detected" value="2,473" />
          <Stat label="Avg. Grade" value="B+" />
        </div>
      </section>

      {/* Back link */}
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

/* ---------- small components ---------- */

function ActionCard({
  id,
  title,
  desc,
  href,
  Icon,
}: {
  id: string;
  title: string;
  desc: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <PageId id={id} />
      </div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-3 inline-block text-sm font-medium text-primary">
        Open →
      </span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}