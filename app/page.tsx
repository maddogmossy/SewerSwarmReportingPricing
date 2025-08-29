import Link from "next/link";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-gray-900/90 px-2 text-xs font-semibold text-white">
      {children}
    </span>
  );
}

function Tile(props: { href: string; title: string; subtitle: string; badge: string }) {
  const { href, title, subtitle, badge } = props;
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="text-xl font-semibold">
        {title}
        <Badge>{badge}</Badge>
      </div>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome back, Test!</h1>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Settings</Link>
            <Link href="/signout" className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">Sign Out</Link>
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          Choose your next action to manage your sewer inspection reports.
        </p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Tile
          href="/upload"
          title="Upload Report"
          subtitle="Upload CCTV inspection files and select an applicable sector for analysis"
          badge="C2"
        />
        <Tile
          href="/dashboard"
          title="Dashboard"
          subtitle="View section inspection data and analysis results across all reports"
          badge="C3"
        />
        <Tile
          href="/pricing"
          title="Pricing Settings"
          subtitle="Customize repair cost estimates for each sector based on your market rates"
          badge="C4"
        />
        <Tile
          href="/uploads"
          title="Uploaded Reports"
          subtitle="Manage your inspection reports and organize project folders"
          badge="C5"
        />
        <Tile
          href="/billing"
          title="Upgrade Plan"
          subtitle="Access premium features and unlimited report processing"
          badge="C6"
        />
      </div>
    </main>
  );
}
