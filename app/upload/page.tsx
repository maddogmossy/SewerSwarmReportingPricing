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
  FileQuestion,
} from "lucide-react";
import { SECTORS, COLOR_MAP } from "@/lib/standards";

// Map icon string to actual Lucide component
const ICONS: Record<string, React.ComponentType<any>> = {
  Building2,
  Home,
  CarFront,
  ShieldCheck,
  Hammer,
  Factory,
  FileQuestion,
  Upload,
};

export default function UploadLanding() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
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

      {/* Sector grid (S1..S8 all clickable to the upload form) */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTORS.map(({ id, name, note, icon }) => {
          const Icon = ICONS[icon] ?? FileQuestion;
          const colors = COLOR_MAP[id];
          return (
            <Link
              key={id}
              href={`/upload/${id}`}
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