// app/upload/[sectorId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload } from "lucide-react";
import { SECTORS, type SectorId, getSectorMeta } from "@/lib/standards";

export default function SectorUploadPage({
  params,
}: {
  params: { sectorId: string };
}) {
  const raw = (params.sectorId || "").toUpperCase();
  const id = raw as SectorId;
  const meta = getSectorMeta(id);

  if (!meta) return notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <DevLabel id="P3" />

      {/* Header */}
      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id={id} />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Upload Report — {meta.name}
            </h1>
            <p className="mt-2 text-slate-600">
              Standards: <span className="font-semibold">{meta.note}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Simple upload form placeholder */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Upload files</h2>
        <p className="mt-2 text-slate-600">
          Select a <strong>PDF</strong> or <strong>.db/.db3</strong> file (max 50MB).
        </p>

        <form className="mt-4 space-y-4">
          <input type="hidden" name="sectorId" value={id} />
          <input
            type="file"
            name="file"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
          >
            Upload (placeholder)
          </button>
        </form>

        <div className="mt-6">
          <Link href="/upload" className="text-blue-600 hover:underline">
            ← Back to sectors
          </Link>
        </div>
      </section>
    </main>
  );
}
