// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Replace the name-fetch with your auth/session if you have one:
 *   const session = await getServerSession(authOptions)  (server);
 *   const name = session?.user?.name ?? "Test";
 */
export default function HomePage() {
  const [name, setName] = useState<string>("Test");

  useEffect(() => {
    // OPTIONAL: hydrate from anywhere you store the user name
    const stored = typeof window !== "undefined" ? localStorage.getItem("ss_user_name") : null;
    if (stored) setName(stored);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* P1: Welcome Block */}
      <div className="relative mb-6 rounded-xl bg-white p-4 shadow">
        {/* Left badge (P1) */}
        <span className="absolute -left-2 top-4 rounded-md bg-gray-800 px-2 py-0.5 text-xs font-semibold text-white">
          P1
        </span>

        <h1 className="text-2xl font-semibold">Welcome back, {name}!</h1>
        <p className="mt-1 text-gray-600">
          Choose your next action to manage your sewer inspection reports.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            {/* settings icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" d="M9.75 3h4.5l.6 2.4a7.5 7.5 0 0 1 2.25 1.3l2.46-.64 2.12 3.68-1.86 1.8c.08.44.13.9.13 1.36s-.05.92-.13 1.36l1.86 1.8-2.12 3.68-2.46-.64a7.5 7.5 0 0 1-2.25 1.3L14.25 21h-4.5l-.6-2.4a7.5 7.5 0 0 1-2.25-1.3l-2.46.64L2.32 14.26l1.86-1.8A7.9 7.9 0 0 1 4.05 11c0-.46.05-.92.13-1.36l-1.86-1.8L4.44 4.16l2.46.64a7.5 7.5 0 0 1 2.25-1.3L9.75 3Z"/>
              <circle cx="12" cy="11.999" r="3.25" strokeWidth="1.5"/>
            </svg>
            Settings
          </Link>

          <Link
            href="/api/auth/signout"
            className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
          >
            {/* sign out icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" d="M15 3h-6a2 2 0 0 0-2 2v3M7 16v3a2 2 0 0 0 2 2h6"/>
              <path strokeWidth="1.5" d="M10 12h10m0 0-3-3m3 3-3 3"/>
            </svg>
            Sign Out
          </Link>
        </div>
      </div>

      {/* C2–C6: Navigation Cards */}
      <div className="space-y-4">
        <NavCard
          href="/upload"
          title="Upload Report"
          desc="Upload CCTV inspection files and select applicable sector for analysis"
          badge="C2"
          icon={<UploadIcon />}
        />
        <NavCard
          href="/dashboard"
          title="Dashboard"
          desc="View section inspection data and analysis results across all reports"
          badge="C3"
          icon={<ChartIcon />}
        />
        <NavCard
          href="/pricing"
          title="Pricing Settings"
          desc="Customize repair cost estimates for each sector based on your market rates"
          badge="C4"
          icon={<CogIcon />}
        />
        <NavCard
          href="/reports"
          title="Uploaded Reports"
          desc="Manage your inspection reports and organize project folders"
          badge="C5"
          icon={<DocIcon />}
        />
        <NavCard
          href="/upgrade"
          title="Upgrade Plan"
          desc="Access premium features and unlimited report processing"
          badge="C6"
          icon={<GiftIcon />}
        />
      </div>
    </main>
  );
}

/* -------------------------- UI Bits -------------------------- */

function NavCard({
  href,
  title,
  desc,
  icon,
  badge,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="relative block rounded-xl bg-white p-4 shadow ring-1 ring-gray-100 transition hover:shadow-md"
    >
      {/* right badge (C1..C6) */}
      <span className="absolute right-3 top-3 rounded-md bg-gray-800 px-2 py-0.5 text-xs font-semibold text-white">
        {badge}
      </span>

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 p-2">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------- Icons -------------------------- */

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.6" d="M12 16V4m0 0-4 4m4-4 4 4" />
      <path strokeWidth="1.6" d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.6" d="M4 19V5M9 19v-7M14 19V8M19 19V3" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.6" d="M9.75 3h4.5l.6 2.4a7.5 7.5 0 0 1 2.25 1.3l2.46-.64 2.12 3.68-1.86 1.8c.08.44.13.9.13 1.36s-.05.92-.13 1.36l1.86 1.8-2.12 3.68-2.46-.64a7.5 7.5 0 0 1-2.25 1.3L14.25 21h-4.5l-.6-2.4a7.5 7.5 0 0 1-2.25-1.3l-2.46.64L2.32 14.26l1.86-1.8A7.9 7.9 0 0 1 4.05 11c0-.46.05-.92.13-1.36l-1.86-1.8L4.44 4.16l2.46.64a7.5 7.5 0 0 1 2.25-1.3L9.75 3Z"/>
      <circle cx="12" cy="12" r="3.1" strokeWidth="1.6"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.6" d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path strokeWidth="1.6" d="M13 3v5h5" />
      <path strokeWidth="1.6" d="M8 13h8M8 17h8M8 9h3" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.6" d="M3 12h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z" />
      <path strokeWidth="1.6" d="M12 5c.5-1.8 3-3 4.5-1.6C18 4 17 6 15 6h-3" />
      <path strokeWidth="1.6" d="M12 5C11.5 3.2 9 2 7.5 3.4 6 4.9 7 7 9 7h3" />
      <path strokeWidth="1.6" d="M12 21V7" />
      <path strokeWidth="1.6" d="M3 12h18" />
    </svg>
  );
}