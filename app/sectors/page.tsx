import Link from "next/link";

const SECTORS = [
  { id: "S1", label: "Sector 1" },
  { id: "S2", label: "Sector 2" },
  { id: "S3", label: "Sector 3" },
  { id: "S4", label: "Sector 4" },
  { id: "S5", label: "Sector 5" },
  { id: "S6", label: "Sector 6" },
];

export default function SectorsPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Choose Sector</h1>
      <p className="text-slate-600 mb-6">
        Pick a sector to prefill the upload form.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SECTORS.map((s) => (
          <Link
            key={s.id}
            href={`/upload?sector=${encodeURIComponent(s.id)}`}
            className="rounded-lg border p-4 bg-white hover:bg-slate-50 transition"
          >
            <div className="text-lg font-semibold">{s.label}</div>
            <div className="text-slate-500 text-sm">Go to upload →</div>
          </Link>
        ))}
      </div>
    </main>
  );
}