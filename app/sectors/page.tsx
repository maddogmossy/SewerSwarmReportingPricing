// app/sectors/page.tsx
import Link from "next/link";
import { DevLabel } from "@/components/PageId";

const sectors = [
  { slug: "utilities",   title: "Utilities",   sub: "WRc SRM standards",   emoji: "🔧",  color: "text-blue-600 bg-blue-100" },
  { slug: "adoption",    title: "Adoption",    sub: "SfA8 compliance",     emoji: "🏢",  color: "text-emerald-600 bg-emerald-100" },
  { slug: "highways",    title: "Highways",    sub: "DMRB standards",      emoji: "🚗",  color: "text-amber-600 bg-amber-100" },
  { slug: "domestic",    title: "Domestic",    sub: "Regulatory compliance",emoji: "🏠", color: "text-amber-900 bg-amber-100" },
  { slug: "insurance",   title: "Insurance",   sub: "ABI guidelines",       emoji: "🛡️", color: "text-red-600 bg-red-100" },
  { slug: "construction",title: "Construction",sub: "Building regs",        emoji: "👷",  color: "text-purple-600 bg-purple-100" },
];

export default function Sectors() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 relative">
      <DevLabel id="P2" position="top-right" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Industry Sectors</h1>
        <Link href="/" className="text-primary underline">← Back to Home (P1)</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((s, i) => (
          <Link key={s.slug} href={`/sectors/${s.slug}`} className="relative rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
            <DevLabel id={`C2${(i+1).toString().padStart(2,"0")}`} />
            <div className={`w-12 h-12 rounded-lg grid place-items-center text-2xl ${s.color}`}>{s.emoji}</div>
            <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
            <p className="text-slate-600 text-sm">{s.sub}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}