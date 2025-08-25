"use client";

import Link from "next/link";
import { Upload, BarChart3, Settings, FileText, Gift, Waves } from "lucide-react";
import { DevLabel } from "@/components/PageId";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-12">
      {/* Dev label for this page */}
      <DevLabel id="P1" title="Page" position="top-right" />

      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center items-center mb-6">
          <Waves className="h-10 w-10 text-primary mr-2" />
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Sewer Swarm AI
          </h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        <Link href="/upload">
          <div className="relative bg-white border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer">
            <DevLabel id="C002" position="top-right" />
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Upload Report</h2>
            <p className="text-slate-600 text-sm">
              Upload CCTV inspection files and select sector for analysis
            </p>
          </div>
        </Link>

        <Link href="/dashboard">
          <div className="relative bg-white border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer">
            <DevLabel id="C003" position="top-right" />
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
            <p className="text-slate-600 text-sm">
              View inspection data and analysis across all reports
            </p>
          </div>
        </Link>

        <Link href="/sector-pricing">
          <div className="relative bg-white border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer">
            <DevLabel id="C004" position="top-right" />
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Pricing Settings</h2>
            <p className="text-slate-600 text-sm">
              Customize repair cost estimates per sector
            </p>
          </div>
        </Link>

        <Link href="/reports">
          <div className="relative bg-white border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer">
            <DevLabel id="C005" position="top-right" />
            <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-cyan-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Uploaded Reports</h2>
            <p className="text-slate-600 text-sm">
              Manage reports and organize project folders
            </p>
          </div>
        </Link>

        <Link href="/checkout">
          <div className="relative bg-white border rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer">
            <DevLabel id="C006" position="top-right" />
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Upgrade Plan</h2>
            <p className="text-slate-600 text-sm">
              Access premium features and unlimited report processing
            </p>
          </div>
        </Link>
      </section>

      {/* Footer/Health Check */}
      <p className="text-center text-slate-500 text-sm mt-16">
        Health check: <Link href="/api/health">/api/health</Link>
      </p>
    </main>
  );
}