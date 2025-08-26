// app/upload/[sectorId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import { Upload } from "lucide-react";
import { useState } from "react";

const SECTORS: Record<
  string,
  { name: string; standards: string }
> = {
  S1: { name: "Utilities",    standards: "WRc SRM standards" },
  S2: { name: "Adoption",     standards: "SFA8 compliance" },
  S3: { name: "Highways",     standards: "DMRB standards" },
  S4: { name: "Domestic",     standards: "Regulatory compliance" },
  S5: { name: "Insurance",    standards: "ABI guidelines" },
  S6: { name: "Construction", standards: "Building regs" },
};

// --- simple client-side validation: require main DB + META DB when not a PDF ---
function isDbPairPresent(files: FileList | null) {
  if (!files || files.length === 0) return false;

  const names = Array.from(files).map((f) => f.name.toLowerCase());
  // allow single PDF as a standalone upload
  if (names.length === 1 && names[0].endsWith(".pdf")) return true;

  const anyDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
  const anyMeta = names.some(
    (n) =>
      n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
  );

  return anyDb && anyMeta;
}

export default function UploadForSector() {
  const { sectorId } = useParams<{ sectorId: string }>();
  const info =
    SECTORS[sectorId?.toUpperCase?.() ?? ""] ??
    { name: "Unknown", standards: "—" };

  const [files, setFiles] = useState<FileList | null>(null);

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
    // Placeholder success (no server call yet)
    alert("Looks good ✅ (placeholder). We’ll wire the real upload next.");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Top-right page marker */}
      <DevLabel id="P2" />

      {/* Header / context card */}
      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id={sectorId?.toUpperCase?.() || "S?"} />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Upload Report — {info.name}
            </h1>
            <p className="mt-2 text-slate-700">
              <span className="font-semibold">Standards:</span>{" "}
              {info.standards}
            </p>
          </div>
        </div>
      </section>

      {/* Upload files card (P3) */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-900">Upload files</h2>
        <p className="mt-2 text-slate-600">
          Select a <strong>PDF</strong> or a pair of{" "}
          <strong>.db/.db3</strong> files (max 50 MB).
        </p>

        <div className="mt-4 space-y-4">
          <input
            type="file"
            multiple
            accept=".pdf,.db,.db3"
            onChange={(e) => setFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={handlePlaceholderUpload}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Upload (placeholder)
          </button>
        </div>

        <div className="mt-6">
          <Link
            href="/upload"
            className="text-blue-700 hover:underline"
          >
            ← Back to sectors
          </Link>
        </div>
      </section>
    </main>
  );
}