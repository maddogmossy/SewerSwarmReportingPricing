// app/sectors/page.tsx
import Link from "next/link";
import DevLabel from "@/components/DevLabel";

const sectors = [
  { id: "C201", slug: "utilities",   name: "Utilities",   blurb: "WRc SRM standards",         color: "text-blue-600 bg-blue-50" },
  { id: "C202", slug: "adoption",    name: "Adoption",    blurb: "SfA8 compliance",           color: "text-emerald-600 bg-emerald-50" },
  { id: "C203", slug: "highways",    name: "Highways",    blurb: "DMRB standards",            color: "text-amber-700 bg-amber-50" },
  { id: "C204", slug: "domestic",    name: "Domestic",    blurb: "Regulatory compliance",     color: "text-slate-700 bg-slate-50" },
  { id: "C205", slug: "insurance",   name: "Insurance",   blurb: "ABI guidelines",            color: "text-red-600 bg-red-50" },
  { id: "C206", slug: "construction",name: "Construction",blurb: "Building regs",             color: "text-purple-600 bg-purple-50" },
];

export default function Sectors() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <DevLabel id="P2" position="top-right" />

      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Select Sector</h1>
          <Link href="/" className="text-primary underline">← Back to Home (P1)</Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {sectors.map((s) => (
            <Link key={s.slug} href={`/sectors/${s.slug}`} className="group">
              <article className="relative rounded-lg border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
                <DevLabel id={s.id} className="absolute -top-2 -right-2" />
                <h2 className="text-xl font-semibold">{s.name}</h2>
                <p className="text-slate-600 mt-1">{s.blurb}</p>
                <span className={`inline-block mt-3 text-xs px-2 py-1 rounded ${s.color}`}>
                  sector
                </span>
                <span className="block mt-4 text-primary underline">Open →</span>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}