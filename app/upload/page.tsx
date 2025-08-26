// app/upload/page.tsx
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import {
  Upload,
  Factory,
  ShieldCheck,
  CarFront,
  Home,
  FileCheck2,
  Hammer,
} from "lucide-react";

const SECTORS = [
  { id: "S1", name: "Utilities",    note: "WRc SRM standards",     icon: Factory,    badge: "bg-emerald-50", iconColor: "text-emerald-600" },
  { id: "S2", name: "Adoption",     note: "SFA8 compliance",       icon: ShieldCheck, badge: "bg-indigo-50",  iconColor: "text-indigo-600" },
  { id: "S3", name: "Highways",     note: "DMRB standards",        icon: CarFront,    badge: "bg-yellow-50",  iconColor: "text-yellow-600" },
  { id: "S4", name: "Domestic",     note: "Regulatory compliance", icon: Home,        badge: "bg-pink-50",    iconColor: "text-pink-600" },
  { id: "S5", name: "Insurance",    note: "ABI guidelines",        icon: FileCheck2,  badge: "bg-red-50",     iconColor: "text-red-600" },
  { id: "S6", name: "Construction", note: "Building regs",         icon: Hammer,      badge: "bg-orange-50",  iconColor: "text-orange-600" },
];

export default function UploadLanding() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 relative">
      <DevLabel id="P2" position="top-left" />

      {/* Supported Files */}
      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C2" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Supported Files</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              <li>PDF reports (up to 50MB)</li>
              <li>Database files <code>.db</code> / <code>.db3</code> (up to 50MB)</li>
            </ul>
            <p className="mt-3 text-slate-500">
              Choose a sector below to continue to the upload form.
            </p>
          </div>
        </div>
      </section>

      {/* S1..S6 cards */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTORS.map(({ id, name, note, icon: Icon, badge, iconColor }) => (
          <Link
            key={id}
            href={`/upload/${id}`}
            className="relative block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardId id={id} />
            <div className="flex items-start gap-4">
              <div className={`rounded-xl ${badge} p-3`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{name}</h3>
                <p className="mt-2 text-slate-600">{note}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}