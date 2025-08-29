// app/upload/page.tsx
import Link from "next/link";

const sectors = [
  { slug: "utilities", code: "S1", title: "Utilities", note: "WRc SRM standards" },
  { slug: "adoption", code: "S2", title: "Adoption", note: "SFA8 compliance" },
  { slug: "highways", code: "S3", title: "Highways", note: "DMRB standards" },
  { slug: "domestic", code: "S4", title: "Domestic", note: "Regulatory compliance" },
  { slug: "insurance", code: "S5", title: "Insurance", note: "ABI guidelines" },
  { slug: "construction", code: "S6", title: "Construction", note: "Building regs" },
];

function SectorCard({
  slug,
  code,
  title,
  note,
}: (typeof sectors)[number]) {
  return (
    <Link
      href={`/upload/${slug}`}
      className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="absolute right-4 top-4 rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
        {code}
      </div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="mt-1 text-gray-600">{note}</div>
    </Link>
  );
}

export default function UploadLanding() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Supported Files</h1>
          <div className="rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            C2
          </div>
        </div>
        <ul className="mt-3 list-disc pl-5 text-gray-700">
          <li>PDF reports (up to 50MB)</li>
          <li>Database files <code>.db</code> / <code>.db3</code> (up to 50MB)</li>
        </ul>
        <p className="mt-3 text-gray-600">Choose a sector below to continue to the upload form.</p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sectors.map((s) => (
          <SectorCard key={s.slug} {...s} />
        ))}
      </div>
    </main>
  );
}
