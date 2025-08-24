// app/page.tsx
import Link from "next/link";
import {
  UploadCloud,
  BarChart3,
  Cog,
  FileText,
  Gift,
  Settings,
  LogOut,
} from "lucide-react";

type TileProps = {
  id: string;
  title: string;
  desc: string;
  href?: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colorClass: string; // Tailwind classes for the icon “pill”
};

function IdTag({ id }: { id: string }) {
  return (
    <span className="block text-xs text-muted-foreground/80 text-right mt-4 select-all">
      (id: {id})
    </span>
  );
}

function IconPill({
  Icon,
  colorClass,
}: {
  Icon: TileProps["Icon"];
  colorClass: string;
}) {
  return (
    <div
      className={`mx-auto mb-4 h-14 w-14 rounded-xl grid place-items-center ${colorClass}`}
    >
      <Icon className="h-7 w-7" strokeWidth={2} />
    </div>
  );
}

function Tile({ id, title, desc, href, Icon, colorClass }: TileProps) {
  const content = (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <IconPill Icon={Icon} colorClass={colorClass} />
      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{desc}</p>
      <IdTag id={id} />
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block focus:outline-none focus:ring-2 focus:ring-ring/50 rounded-2xl"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* Hero */}
      <section className="space-y-3 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Welcome to <span className="text-gradient-primary">Sewer Swarm AI</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
        <span className="block text-xs text-muted-foreground/80 select-all">
          (id: P001)
        </span>
      </section>

      {/* Welcome card with actions */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Welcome back, Test!</h2>
            <p className="mt-1 text-muted-foreground">
              Choose your next action to manage your sewer inspection reports
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Link>
          </div>
        </div>
        <IdTag id="C001" />
      </section>

      {/* Feature tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Tile
          id="C002"
          title="Upload Report"
          desc="Upload CCTV inspection files and select applicable sector for analysis"
          href="/upload"
          Icon={UploadCloud}
          colorClass="bg-primary/10 text-primary"
        />

        <Tile
          id="C003"
          title="Dashboard"
          desc="View section inspection data and analysis results across all reports"
          href="/dashboard"
          Icon={BarChart3}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />

        <Tile
          id="C004"
          title="Pricing Settings"
          desc="Customize repair cost estimates for each sector based on your market rates"
          Icon={Cog}
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />

        <Tile
          id="C005"
          title="Uploaded Reports"
          desc="Manage your inspection reports and organize project folders"
          Icon={FileText}
          colorClass="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
        />
      </section>

      {/* Upgrade */}
      <section>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <IconPill
            Icon={Gift}
            colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          />
          <h3 className="text-2xl font-semibold">Upgrade Plan</h3>
          <p className="mt-2 text-muted-foreground">
            Access premium features and unlimited report processing
          </p>
          <IdTag id="C006" />
        </div>
      </section>

      {/* Supported sectors */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h4 className="text-xl font-semibold mb-4">Supported Sectors</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 text-sm">
          <span>Utilities</span>
          <span className="text-right text-muted-foreground">WRc SRM standards</span>

          <span>Adoption</span>
          <span className="text-right text-muted-foreground">SfA8 compliance</span>

          <span>Highways</span>
          <span className="text-right text-muted-foreground">DMRB standards</span>

          <span>Domestic</span>
          <span className="text-right text-muted-foreground">Regulatory compliance</span>

          <span>Insurance</span>
          <span className="text-right text-muted-foreground">ABI guidelines</span>

          <span>Construction</span>
          <span className="text-right text-muted-foreground">Building regs</span>
        </div>
        <IdTag id="C007" />
      </section>
    </main>
  );
}