// app/upload/[sectorId]/page.tsx
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";

import { DevLabel, CardId } from "@/components/PageId";
import Notice from "@/components/Notice";
import { type SectorId, getSectorMeta } from "@/lib/standards";

// Accept either: (1) a single PDF OR (2) main .db/.db3 + META .db/.db3
function isDbPairOrPdf(files: FileList | null) {
  if (!files || files.length === 0) return false;
  const names = Array.from(files).map((f) => f.name.toLowerCase());

  // Single PDF is valid
  if (names.length === 1 && names[0].endsWith(".pdf")) return true;

  const anyDb = names.some((n) => n.endsWith(".db") || n.endsWith(".db3"));
  const anyMeta = names.some(
    (n) => n.includes("meta") && (n.endsWith(".db") || n.endsWith(".db3"))
  );
  return anyDb && anyMeta;
}

// Very light heuristic to suggest a project name from the first filename
function suggestProjectName(files: FileList | null) {
  if (!files || files.length === 0) return "";
  const first = files[0].name;

  // strip extension
  const base = first.replace(/\.[^.]+$/i, "");

  // try to remove trailing "_Meta" if present
  return base.replace(/_meta$/i, "").trim();
}

export default function SectorUploadPage({
  params,
}: {
  params: { sectorId: string };
}) {
  const raw = (params.sectorId || "").toUpperCase();
  const id = raw as SectorId;
  const meta = getSectorMeta(id);
  if (!meta) return notFound();

  const [files, setFiles] = useState<FileList | null>(null);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");

  const [notice, setNotice] = useState<{
    kind: "info" | "warning" | "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  function onFilesChanged(list: FileList | null) {
    setFiles(list);
    // If user hasn’t typed a project yet, try a guess from filename
    if (!projectName || projectName.trim() === "") {
      const guess = suggestProjectName(list);
      if (guess) setProjectName(guess);
    }
  }

  async function handleUpload() {
    const fd = new FormData();
    fd.set("sectorId", id);
    fd.set("clientName", clientName);
    fd.set("projectName", projectName);

    if (!files || files.length === 0) {
      setNotice({
        kind: "warning",
        title: "No file selected",
        message: "Please choose at least one file before uploading.",
      });
      return;
    }

    if (!isDbPairOrPdf(files)) {
      setNotice({
        kind: "warning",
        title: "Invalid selection",
        message:
          "Upload either a single PDF, or BOTH the main .db/.db3 file and its META .db/.db3 file.",
      });
      return;
    }

    Array.from(files).forEach((f) => fd.append("files", f));

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Upload failed");
      }

      setNotice({
        kind: "success",
        title: "Upload complete",
        message: `Saved ${data.files.length} file(s) for sector ${data.sector}.`,
      });

      // optional: clear the file picker after success
      setFiles(null);
    } catch (err: any) {
      setNotice({
        kind: "error",
        title: "Upload error",
        message: err?.message || "Something went wrong while uploading.",
      });
    }
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

      {/* Upload form */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Upload files</h2>
        <p className="mt-2 text-slate-600">
          Upload a <strong>PDF</strong> or a <strong>.db/.db3 + META</strong> pair (max 50MB).
        </p>

        <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Client</span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Anglian Water"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Project</span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. 40 Hollow Road – IP32 7AY"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <input
            type="file"
            name="files"
            multiple
            // accept="*/*" so iOS Safari doesn’t block .db/.db3
            accept="*/*"
            onChange={(e) => onFilesChanged(e.target.files)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <button
            type="button"
            onClick={handleUpload}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Upload
          </button>
        </form>

        {notice && (
          <div className="mt-4">
            <Notice
              kind={notice.kind}
              title={notice.title}
              onClose={() => setNotice(null)}
            >
              {notice.message}
            </Notice>
          </div>
        )}

        <div className="mt-2">
          <Link href="/uploads" className="text-blue-600 hover:underline">
            → View uploaded reports
          </Link>
        </div>

        <div className="mt-6">
          <Link href="/upload" className="text-blue-600 hover:underline">
            ← Back to sectors
          </Link>
        </div>
      </section>
    </main>
  );
}