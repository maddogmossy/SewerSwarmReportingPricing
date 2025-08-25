// app/upload/[sectorId]/page.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload } from "lucide-react";

const SECTORS = {
  S1: { name: "Utilities",      note: "WRc SRM standards" },
  S2: { name: "Adoption",       note: "SFA8 compliance" },
  S3: { name: "Highways",       note: "DMRB standards" },
  S4: { name: "Domestic",       note: "Regulatory compliance" },
  S5: { name: "Insurance",      note: "ABI guidelines" },
  S6: { name: "Construction",   note: "Building regs" },
} as const;

export default function UploadSectorPage() {
  const params = useParams<{ sectorId: keyof typeof SECTORS }>();
  const sector = useMemo(() => (params?.sectorId ? SECTORS[params.sectorId] : undefined), [params]);

  if (!sector) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DevLabel id="P2" />

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:underline">Home</Link>
        <span> / </span>
        <Link href="/upload" className="hover:underline">Upload</Link>
        <span> / </span>
        <span className="text-slate-700 font-medium">{sector.name}</span>
      </nav>

      {/* Sector header */}
      <h1 className="text-3xl font-extrabold text-slate-900">
        Upload Report – {sector.name}
      </h1>
      <p className="mt-2 text-slate-600">{sector.note}</p>

      {/* Upload card */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id={params.sectorId} />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>

          <form className="flex-1" method="post" action="#">
            {/* Project number */}
            <label className="block text-sm font-medium text-slate-700">
              Project Number
              <input
                name="projectNumber"
                required
                placeholder="e.g. A1234"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {/* File input */}
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Upload Files (.pdf, .db, .db3)
              <input
                name="files"
                type="file"
                multiple
                accept=".pdf,.db,.db3,application/pdf,application/octet-stream"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              />
            </label>

            {/* Helper text */}
            <p className="mt-2 text-xs text-slate-500">
              Max size per file: 50MB. Database uploads should include both <code>.db3</code> and <code>Meta.db3</code> when available.
            </p>

            {/* Submit (no real action yet) */}
            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Upload (placeholder)
              </button>
              <Link
                href="/upload"
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-200"
              >
                Back to Sectors
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}