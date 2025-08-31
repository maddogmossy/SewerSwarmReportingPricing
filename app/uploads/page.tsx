"use client";
import React, { useState } from "react";

export default function UploadsPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setMsg(`Uploaded ${data.count} file(s).`);
      e.currentTarget.reset();
    } catch (err: any) {
      setMsg(`Upload failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload DB3 / PDFs</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Sector Code</span>
            <input name="sectorCode" defaultValue="S1" className="border p-2 w-full" required />
          </label>
          <label className="block">
            <span className="text-sm">Sector Title</span>
            <input name="sectorTitle" defaultValue="Utilities" className="border p-2 w-full" required />
          </label>
          <label className="block col-span-2">
            <span className="text-sm">Client Name</span>
            <input name="clientName" className="border p-2 w-full" required />
          </label>
          <label className="block">
            <span className="text-sm">Project Folder</span>
            <input name="projectFolder" className="border p-2 w-full" required />
          </label>
          <label className="block">
            <span className="text-sm">Project No</span>
            <input name="projectNo" className="border p-2 w-full" />
          </label>
          <label className="block">
            <span className="text-sm">Address</span>
            <input name="address" className="border p-2 w-full" />
          </label>
          <label className="block">
            <span className="text-sm">Postcode</span>
            <input name="postcode" className="border p-2 w-full" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Files (.db3, .pdf, …)</span>
          <input type="file" name="files" multiple className="block mt-1" />
        </label>

        <button disabled={busy} className="px-4 py-2 bg-black text-white rounded">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      {msg && <p className="mt-4">{msg}</p>}
    </main>
  );
}
