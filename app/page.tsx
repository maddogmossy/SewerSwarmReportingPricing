"use client";

import Link from "next/link";
import { BarChart3, Settings2, UploadCloud, LogOut } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary">
          Sewer Swarm AI – Report Analysis & Pricing
        </h1>
        <p className="text-muted-foreground">
          Choose your next action to manage your sewer inspection reports
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="enterprise-card rounded-lg bg-card text-card-foreground p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                View inspection data and analysis across all reports
              </p>
            </div>
          </div>
          <div className="mt-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="enterprise-card rounded-lg bg-card text-card-foreground p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Pricing Settings</h2>
              <p className="text-sm text-muted-foreground">
                Customize repair cost estimates per sector
              </p>
            </div>
          </div>
          <div className="mt-5">
            <button
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-60"
              disabled
            >
              Configure (coming soon)
            </button>
          </div>
        </div>

        <div className="enterprise-card rounded-lg bg-card text-card-foreground p-6 sm:col-span-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <UploadCloud className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Uploaded Reports</h2>
              <p className="text-sm text-muted-foreground">
                Manage reports and organize project folders
              </p>
            </div>
          </div>
          <div className="mt-5">
            <button
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-60"
              disabled
            >
              Open Reports (soon)
            </button>
          </div>
        </div>
      </section>

      <footer className="pt-2">
        <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </footer>
    </main>
  );
}