// inside UploadClient component ...
import { useRouter } from 'next/navigation';

export default function UploadClient() {
  // ... your existing state/logic above ...

  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [serverMsg, setServerMsg] = React.useState<string | null>(null);

  async function doUpload() {
    if (!validation.ok) return;
    setBusy(true);
    setServerMsg(null);
    try {
      // Derive a lightweight client name (no UI field per your request).
      // If you later want a typed client name, add a small input and send it here.
      const clientName = 'General';

      const fd = new FormData();
      fd.append('sectorCode', sector);
      fd.append('clientName', clientName);
      // optional explicit project folder: comment IN to force
      // fd.append('projectFolder', '12345 - 40 Hollow Road - IP32 7AY');

      for (const f of files) fd.append('files', f);

      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setServerMsg(json?.error ?? 'Upload failed');
        setBusy(false);
        return;
      }

      // Success: go to P4 listing
      router.push('/reports');
    } catch (e: any) {
      setServerMsg(e?.message ?? 'Upload error');
      setBusy(false);
    }
  }

  // ... your JSX above list of files ...

  return (
    <div className={`rounded-xl border ${style.border} bg-white shadow-sm`}>
      {/* header etc ... */}

      <div className="p-4">
        {!!serverMsg && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {serverMsg}
          </div>
        )}

        {/* drop zone, selected files list ... */}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!validation.ok || busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={doUpload}
          >
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          <span className="text-xs text-neutral-500">
            Sector: {sector} ({style.title})
          </span>
        </div>
      </div>
    </div>
  );
}
