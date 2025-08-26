"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DevLabel, CardId } from "@/components/PageId";
import Notice from "@/components/Notice";
import { Upload } from "lucide-react";
import { SECTORS, type SectorId, getSectorMeta } from "@/lib/standards";

type Msg = { tone: "info" | "warn" | "success" | "error"; text: string } | null;

export default function SectorUploadPage({
  params,
}: {
  params: { sectorId: string };
}) {
  const raw = (params.sectorId || "").toUpperCase();
  const id = raw as SectorId;
  const meta = getSectorMeta(id);
  if (!meta) return notFound();

  const [message, setMessage] = useState<Msg>(null);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const files = [fileA, fileB].filter(Boolean) as File[];

    // none selected
    if (files.length === 0) {
      setMessage({
        tone: "warn",
        text:
          "Please choose a file to upload. You can upload a single PDF, or a pair of .db/.db3 files.",
      });
      return;
    }

    // single file case: must be PDF
    if (files.length === 1) {
      const f = files[0];
      const name = f.name.toLowerCase();
      const isPDF = name.endsWith(".pdf");
      if (!isPDF) {
        setMessage({
          tone: "warn",
          text:
            "For database uploads, include BOTH the main .db/.db3 and its META .db/.db3 file. A single PDF is fine on its own.",
        });
        return;
      }
      setMessage({
        tone: "success",
        text: "Looks good ✅ (placeholder). We’ll wire the real upload next.",
      });
      return;
    }

    // two files: must both be db/db3
    if (files.length === 2) {
      const names = files.map((f) => f.name.toLowerCase());
      const allDb =
        names.every((n) => n.endsWith(".db") || n.endsWith(".db3")) &&
        names[0] !== names[1];

      if (!allDb) {
        setMessage({
          tone: "warn",
          text:
            "Please select exactly two database files (.db/.db3): the main file and its corresponding META file.",
        });
        return;
      }
      // Placeholder success
      setMessage({
        tone: "success",
        text:
          "Database pair detected ✅ (placeholder). We’ll save and parse these next.",
      });
      return;
    }

    // >2 files selected (not supported yet)
    setMessage({
      tone: "warn",
      text:
        "Multiple files are not supported yet. Upload one PDF, or exactly two database files (.db/.db3).",
    });
  };

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
          Select a <strong>PDF</strong> or a pair of{" "}
          <strong>.db/.db3</strong> files (max 50MB each).
        </p>

        {message && (
          <Notice
            tone={message.tone}
            className="mt-4"
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Notice>
        )}

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <input type="hidden" name="sectorId" value={id} />
          {/* Two file inputs so mobile users can add db + meta easily.
              For a single PDF, they can just use the first input. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="file"
              name="fileA"
              onChange={(e) => setFileA(e.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="file"
              name="fileB"
              onChange={(e) => setFileB(e.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
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