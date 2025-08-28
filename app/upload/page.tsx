"use client";

import { useState } from "react";

export default function UploadPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const json = await res.json();
    setBusy(false);

    if (res.ok) {
      setMsg("Upload saved.");
      e.currentTarget.reset();
    } else {
      setMsg(json?.error || "Upload failed.");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">P3 · Upload a Report</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded border bg-white p-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Project ID (optional)</label>
          <input
            type="number"
            name="projectId"
            placeholder="e.g. 12"
            className="w-full rounded border p-2"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Sector (required)</label>
          <input
            type="text"
            name="sector"
            required
            placeholder="e.g. S1"
            className="w-full rounded border p-2"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">File (required)</label>
          <input type="file" name="file" required className="w-full" />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Upload"}
        </button>

        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}