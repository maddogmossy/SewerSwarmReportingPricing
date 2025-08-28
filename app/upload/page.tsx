'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // If you navigated from /sectors?sector=..., we pick it up here.
  const sectorFromQuery = sp.get('sector') ?? '';

  const [sector, setSector] = React.useState(sectorFromQuery);
  const [file, setFile] = React.useState<File | null>(null);
  const [projectId, setProjectId] = React.useState<string>(''); // optional
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    if (!sector) {
      setError('Please select a sector.');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sector', sector);
      // Only send projectId if present (API treats it as optional)
      if (projectId.trim().length > 0) {
        fd.append('projectId', projectId.trim());
      }

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Upload failed.');
        throw new Error(msg || 'Upload failed.');
      }

      // On success, go to the list page
      router.push('/uploads');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload CCTV Report</h1>
      <p className="text-sm text-gray-600 mb-6">
        Choose a sector and upload your CCTV inspection file. On success you’ll be redirected to the Uploaded Reports page.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="" disabled>Select a sector</option>
            <option value="S1">S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
            <option value="S4">S4</option>
            <option value="S5">S5</option>
            <option value="S6">S6</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            File (MP4, MOV, PDF, ZIP, etc.)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
            className="w-full rounded border px-3 py-2 bg-white"
            required
          />
        </div>

        {/* Optional: link the upload to a project id if you have one */}
        <div>
          <label className="block text-sm font-medium mb-1">Project ID (optional)</label>
          <input
            type="number"
            inputMode="numeric"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. 12"
          />
        </div>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </main>
  );
}