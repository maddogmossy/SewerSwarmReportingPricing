// app/upload/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import {
  Building2,
  Home,
  CarFront,
  ShieldCheck,
  Hammer,
  Factory,
  Upload,
} from "lucide-react";

// Color classes per sector (icon badge + icon color)
const COLOR_MAP: Record<
  string,
  { badge: string; icon: string }
> = {
  S1: { badge: "bg-emerald-50", icon: "text-emerald-600" }, // Utilities
  S2: { badge: "bg-indigo-50",  icon: "text-indigo-600" },  // Adoption
  S3: { badge: "bg-amber-50",   icon: "text-amber-600" },   // Highways
  S4: { badge: "bg-sky-50",     icon: "text-sky-600" },     // Domestic
  S5: { badge: "bg-violet-50",  icon: "text-violet-600" },  // Insurance
  S6: { badge: "bg-rose-50",    icon: "text-rose-600" },    // Construction
};

// Simple sector list with IDs S1..S6
const SECTORS = [
  { id: "S1", name: "Utilities",    note: "WRc SRM standards",     icon: Factory },
  { id: "S2", name: "Adoption",     note: "SFA8 compliance",       icon: ShieldCheck },
  { id: "S3", name: "Highways",     note: "DMRB standards",        icon: CarFront },
  { id: "S4", name: "Domestic",     note: "Regulatory compliance", icon: Home },
  { id: "S5", name: "Insurance",    note: "ABI guidelines",        icon: Building2 },
  { id: "S6", name: "Construction", note: "Building regs",         icon: Hammer },
];

export default function UploadLanding() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* P2 tag in the corner */}
      <DevLabel id="P2" />

      {/* Hero / Intro */}
      <section className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Upload Inspection Report
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Upload your CCTV inspection files (<strong>PDF</strong> or <strong>.db/.db3</strong>) and
          select the applicable sector for analysis.
        </p>
      </section>

      {/* Info card: accepted formats */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C2" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Supported Files</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              <li>PDF reports (up to 50MB)</li>
              <li>Database files <code>.db</code> / <code>.db3</code> (up to 50MB)</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Choose a sector below to continue to the upload form.
            </p>
          </div>
        </div>
      </section>

      {/* Sector grid (click cards to 404 placeholders) */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTORS.map(({ id, name, note, icon: Icon }) => {
          const colors = COLOR_MAP[id] ?? { badge: "bg-slate-50", icon: "text-slate-600" };
          return (
            <Link
              key={id}
              href={`/__todo/${id.toLowerCase()}`} // 404 for now
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow block"
            >
              <CardId id={id} />
              <div className="flex items-start gap-4">
                <div className={`rounded-xl ${colors.badge} p-3`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{name}</h3>
                  <p className="mt-2 text-slate-600">{note}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}