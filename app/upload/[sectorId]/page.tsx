

// app/upload/[sectorId]/page.tsx
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload } from "lucide-react";
import { SECTORS, type SectorId, getSectorMeta } from "@/lib/standards";

// Allow single PDF OR (main .db/.db3 + META .db/.db3) pair
function isDbPairPresent(files: FileList | null) {
  if (!files || files.length === 0) return false;
  const names = Array.from(files).map((f) => f.name.toLowerCase());

  // single PDF is allowed
  if (names.length === 1 && names[0].endsWith(".pdf")) return true;

  const anyDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
  const anyMeta = names.some(
    (n) => n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
  );
  return anyDb && anyMeta;
}

export default function SectorUploadPage({
  params,
}: {
  params: { sectorId: string };
}) {
  const raw = (params.sectorId || "").toUpperCase();
  const id = raw as SectorId;
  const meta = getSectorMeta(id);

  const [files, setFiles] = useState<FileList | null>(null);

  if (!meta) return notFound();

  function handlePlaceholderUpload() {
    if (!files || files.length === 0) {
      alert("Please choose a file first.");
      return;
    }
    if (!isDbPairPresent(files)) {
      alert(
        "For database uploads, please include BOTH the main .db/.db3 file and its META .db/.db3 file. (A single PDF is fine on its own.)"
      );
      return;
    }
    alert("Looks good ✅ (placeholder). We’ll wire the real upload next.");
  }

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

      {/* Upload form (client-side validation only) */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Upload files</h2>
        <p className="mt-2 text-slate-600">
          Select a <strong>PDF</strong> or a pair of <strong>.db/.db3</strong> files (max 50MB).
        </p>

        <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" name="sectorId" value={id} />
          <input
            type="file"
            name="files"
            multiple
            // NOTE: accept="*/*" so iOS Safari doesn’t block .db/.db3
            accept="*/*"
            onChange={(e) => setFiles(e.target.files)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handlePlaceholderUpload}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
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