import Link from "next/link";
import {
  UploadCloud,
  BarChart3,
  BadgeDollarSign,
  FolderOpen,
  Crown,
  Settings,
  LogOut,
  ListChecks,
  FileText,
  ArrowRight,
} from "lucide-react";

type ActionCard = {
  id: string;
  href: string;
  title: string;
  desc: string;
  Icon: React.ElementType;
  iconClass: string;
};

const actions: ActionCard[] = [
  {
    id: "C2",
    href: "/upload",
    title: "Upload Report",
    desc: "Upload CCTV inspection files and select applicable sector for analysis",
    Icon: UploadCloud,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    id: "C3",
    href: "/dashboard",
    title: "Dashboard",
    desc: "View section inspection data and analysis results across all reports",
    Icon: BarChart3,
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "C4",
    href: "/pricing",
    title: "Pricing Settings",
    desc: "Customize repair cost estimates for each sector based on your market rates",
    Icon: BadgeDollarSign,
    iconClass: "bg-amber-100 text-amber-600",
  },
  {
    id: "C5",
    href: "/reports",
    title: "Uploaded Reports",
    desc: "Manage your inspection reports and organize project folders",
    Icon: FolderOpen,
    iconClass: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "C6",
    href: "/upgrade",
    title: "Upgrade Plan",
    desc: "Access premium features and unlimited report processing",
    Icon: Crown,
    iconClass: "bg-fuchsia-100 text-fuchsia-600",
  },
];

export default function P1HomePage() {
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
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm text-white shadow-sm transition hover:bg-rose-700">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Hero title you requested */}
        <section className="mt-8 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Welcome to Sewer Swarm AI
          </h2>
          <p className="mx-auto mt-2 max-w-3xl text-slate-600">
            Professional sewer condition analysis and reporting with AI-powered insights
          </p>
        </section>

        {/* Action cards (C2–C6) */}
        <section className="mt-8 grid gap-4">
          {actions.map(({ id, href, title, desc, Icon, iconClass }) => (
            <Link
              key={id}
              href={href}
              data-dev-id={id}
              className="group relative block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                {id}
              </span>

              <div className="flex items-start gap-4">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Info cards row (C7 & C8) */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {/* C7: Supported Sectors */}
          <div
            data-dev-id="C7"
            className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
              C7
            </span>

            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600">
                <ListChecks className="h-5 w-5" />
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

          {/* C8: File Formats */}
          <div
            data-dev-id="C8"
            className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
              C8
            </span>

            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-700">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">File Formats</h3>
            </div>

            <ul className="divide-y divide-slate-100">
              {[
                ["PDF Reports", "Up to 50MB"],
                ["Database Files (.db)", "Up to 50MB"],
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
