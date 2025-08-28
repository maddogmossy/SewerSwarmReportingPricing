"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const sp = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const sectorInitial = sp.get("sector") ?? "";
  const [sector, setSector] = useState(sectorInitial);
  const [projectId, setProjectId] = useState<string>(""); // optional
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      setSubmitting(true);
      const fd = new FormData();
      if (projectId) fd.set("projectId", projectId);
      fd.set("sector", sector);
      if (!file) {
        setMsg("Please choose a file.");
        setSubmitting(false);
        return;
      }
      fd.set("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Upload failed");
      setMsg("✅ Uploaded!");
      setFile(null);
    } catch (err: any) {
      setMsg(`❌ ${err.message || "Upload failed"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">P3 · Upload Report</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Sector</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. Potable Water"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Project ID (optional)</label>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. 12"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full"
            required
          />
        </div>

        <button
          disabled={submitting}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Uploading…" : "Upload"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}