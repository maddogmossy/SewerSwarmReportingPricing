// app/upload/[sector]/upload-client.tsx
"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Home as HomeIcon,
  FolderPlus,
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  X,
  Loader2,
} from "lucide-react";

// -------- tiny helpers --------
const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");
const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/i;

type Props = {
  sectorSlug: string;
  sectorCode: string;
  sectorTitle: string;
  sectorStandards: string;
};

type Client = { id: string; name: string };

function parseFromPattern(name: string) {
  const core = name
    .replace(/(_Meta|- Meta)?\.[^.]+$/i, "")
    .replace(/\.[^.]+$/i, "");
  const parts = core.split(" - ").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const pc = parts[parts.length - 1].match(UK_POSTCODE);
  if (!pc) return null;
  return {
    projectNo: parts[0],
    address: parts.slice(1, parts.length - 1).join(" - "),
    postcode: `${pc[1].toUpperCase()} ${pc[2].toUpperCase()}`,
  };
}

// -------- UI bits --------
function Toast({
  kind,
  text,
  onClose,
}: {
  kind: "error" | "success" | "info";
  text: string;
  onClose: () => void;
}) {
  const palette =
    kind === "error"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : kind === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-sky-50 border-sky-200 text-sky-900";
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-xl border p-3 text-sm shadow-sm", palette)}>
      {kind === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> :
       kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> :
       <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
         <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 15a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1zm1-8h-2V7h2z"/>
       </svg>}
      <div className="flex-1">{text}</div>
      <button aria-label="dismiss" className="rounded p-1 hover:bg-black/5" onClick={onClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// -------- main --------
export default function UploadClient({
  sectorSlug,
  sectorCode,
  sectorTitle,
  sectorStandards,
}: Props) {
  // Client state (lazy-loaded)
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSelect, setClientSelect] = useState("");
  const [newClient, setNewClient] = useState("");
  const [useNewClient, setUseNewClient] = useState(false);

  // Project meta
  const [projectNo, setProjectNo] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // UI
  const [toast, setToast] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const suggestedFilename = useMemo(() => {
    const pn = projectNo.trim(), ad = address.trim(), pc = postcode.trim();
    if (!pn && !ad && !pc) return "";
    return [pn, ad, pc].filter(Boolean).join(" - ");
  }, [projectNo, address, postcode]);

  const folderPath = useMemo(() => {
    const clientName = useNewClient
      ? newClient.trim()
      : clients.find(c => c.id === clientSelect)?.name || "";
    const addr = address.trim();
    return [clientName, addr].filter(Boolean).join("/");
  }, [useNewClient, newClient, clients, clientSelect, address]);

  // ---- lazy loader for clients (no work on initial render) ----
  const ensureClients = useCallback(async () => {
    if (clientsLoaded || clientsLoading) return;
    try {
      setClientsLoading(true);
      const r = await fetch("/api/clients", { cache: "no-store" });
      if (r.ok) {
        const data = (await r.json()) as Client[];
        setClients(Array.isArray(data) ? data : []);
      }
      setClientsLoaded(true);
    } finally {
      setClientsLoading(false);
    }
  }, [clientsLoaded, clientsLoading]);

  // ---- file helpers ----
  const isPdf  = (f: File) => /\.pdf$/i.test(f.name);
  const isDb   = (f: File) => /\.db3?$/i.test(f.name) || /\.db$/i.test(f.name);
  const isMeta = (f: File) => /(_Meta|- Meta)\.db3?$/i.test(f.name) || /(_Meta|- Meta)\.db$/i.test(f.name);
  const baseDb = (f: File) => f.name.replace(/(_Meta|- Meta)?\.db3?$/i, "").replace(/(_Meta|- Meta)?\.db$/i, "");

  function checkFiles(list: File[]): { ok: boolean; reason?: string } {
    if (!list.length) return { ok: false, reason: "Please add a file." };
    const pdfs = list.filter(isPdf);
    const dbs  = list.filter(isDb);
    if (pdfs.length && dbs.length) return { ok: false, reason: "Choose either a single PDF or a .db/.db3 pair (not both)." };
    if (pdfs.length === 1 && list.length === 1) return { ok: true };
    if (dbs.length >= 1) {
      const mains = dbs.filter((f) => !isMeta(f));
      const metas = dbs.filter((f) => isMeta(f));
      if (mains.length !== 1 || metas.length !== 1) return { ok: false, reason: "A .db/.db3 upload needs exactly two files: main + _Meta." };
      if (baseDb(mains[0]) !== baseDb(metas[0])) return { ok: false, reason: "The .db/.db3 and _Meta names must match (same base)." };
      return { ok: true };
    }
    return { ok: false, reason: "Unsupported files. Upload a PDF or a .db/.db3 pair." };
  }

  function parseAutofill(list: File[]) {
    const main = list.find((f) => isPdf(f) || (isDb(f) && !isMeta(f))) ?? list[0];
    if (!main) return;
    const parsed = parseFromPattern(main.name);
    if (parsed) {
      if (!projectNo) setProjectNo(parsed.projectNo);
      if (!address) setAddress(parsed.address);
      if (!postcode) setPostcode(parsed.postcode);
    }
  }

  function addFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    const list = Array.from(selected);
    const check = checkFiles(list);
    if (!check.ok) {
      setToast({ kind: "error", text: check.reason || "Invalid files." });
      return;
    }
    setFiles(list);
    parseAutofill(list);
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const chooseClientOk = useNewClient ? !!newClient.trim() : !!clientSelect;
    if (!chooseClientOk) return setToast({ kind: "error", text: "Please choose an existing client or enter a new client name." });
    if (!projectNo.trim() || !address.trim() || !postcode.trim()) return setToast({ kind: "error", text: "Please fill Project No, Address and Postcode." });
    if (!files.length) return setToast({ kind: "error", text: "Please add a file to upload." });

    const check = checkFiles(files);
    if (!check.ok) return setToast({ kind: "error", text: check.reason || "Invalid files." });

    try {
      setIsUploading(true);
      setToast({ kind: "info", text: "Uploading… Please don’t close the page." });

      const fd = new FormData();
      fd.append("sectorSlug", sectorSlug);
      fd.append("sectorCode", sectorCode);
      fd.append("sectorTitle", sectorTitle);
      fd.append("folder", folderPath);
      fd.append("projectNo", projectNo.trim());
      fd.append("address", address.trim());
      fd.append("postcode", postcode.trim());
      fd.append("targetFilename", suggestedFilename);
      if (useNewClient) {
        fd.append("clientName", newClient.trim());
      } else {
        fd.append("clientId", clientSelect);
        const name = clients.find((c) => c.id === clientSelect)?.name;
        if (name) fd.append("clientName", name);
      }
      files.forEach((f) => fd.append("files", f, f.name));

      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || res.statusText);
      }
      setToast({ kind: "success", text: "Upload complete. Redirecting to Uploaded Reports…" });
      window.location.href = "/uploads";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ kind: "error", text: `Upload failed: ${msg}` });
    } finally {
      setIsUploading(false);
    }
  };

  // -------- render --------
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <span className="absolute right-3 top-3 rounded-md bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
          P3
        </span>
        <h1 className="text-3xl font-bold">Upload Report — {sectorTitle}</h1>
        {sectorStandards && (
          <p className="mt-2 text-gray-700">
            <span className="font-semibold">Standards:</span> {sectorStandards}
          </p>
        )}
      </section>

      {/* Toasts */}
      {toast && <Toast kind={toast.kind} text={toast.text} onClose={() => setToast(null)} />}

      {/* Nav (prefetch disabled) */}
      <div className="flex items-center gap-2">
        <Link href="/" prefetch={false} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50">
          <HomeIcon className="h-4 w-4" />
          Home
        </Link>
        <Link href="/upload" prefetch={false} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50">
          Back to sectors
        </Link>
        <Link href="/uploads" prefetch={false} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 shadow-sm transition hover:bg-indigo-100">
          View uploaded reports
        </Link>
      </div>

      {/* Client & project */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Client & Project</h2>
        <p className="mt-1 text-gray-600">
          Files will be saved to folder: <span className="font-medium">{folderPath || "—"}</span>
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Client picker (lazy load) */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-gray-700" />
              <div className="font-medium">Client</div>
            </div>

            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientMode"
                  className="h-4 w-4"
                  checked={!useNewClient}
                  onChange={() => {
                    setUseNewClient(false);
                    // Load the list only the first time user switches to "Select existing"
                    ensureClients();
                  }}
                />
                <span className="text-sm text-gray-700">Select existing</span>
              </label>

              {!useNewClient && (
                <select
                  value={clientSelect}
                  onFocus={ensureClients}
                  onMouseDown={ensureClients}
                  onChange={(e) => setClientSelect(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{clientsLoading ? "Loading…" : "— Choose client —"}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="mt-2 flex items-center gap-2">
                <input
                  type="radio"
                  name="clientMode"
                  className="h-4 w-4"
                  checked={useNewClient}
                  onChange={() => setUseNewClient(true)}
                />
                <span className="text-sm text-gray-700">Create new</span>
              </label>
              {useNewClient && (
                <input
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Client name"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
            </div>
          </div>

          {/* Project fields */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-700" />
              <div className="font-medium">Project details</div>
            </div>
            <div className="mt-3 grid gap-3">
              <input value={projectNo} onChange={(e) => setProjectNo(e.target.value)} placeholder="Project No" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full Site Address" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Post code" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <div className="font-semibold">Suggested filename</div>
                <div className="mt-0.5 font-mono">{suggestedFilename || "—"}</div>
                <div className="mt-1 text-[11px] text-gray-500">Pattern: <code>Project No - Full Site address - Post code</code></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload area (simple input; nothing runs before dialog opens) */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Upload files</h2>
        <p className="mt-1 text-gray-600">
          Upload a single <strong>PDF</strong> or a <strong>.db/.db3</strong> pair (main + <em>_Meta</em>). Max 50MB per file.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
              dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"
            )}
          >
            <UploadCloud className="h-7 w-7 text-gray-500 pointer-events-none" />
            <div className="mt-2 text-sm text-gray-700">
              Drag & drop files here, or{" "}
              <label htmlFor="fileInput" className="cursor-pointer text-indigo-700 underline underline-offset-2">
                browse
              </label>
            </div>
            <div className="mt-1 text-xs text-gray-500">PDF (single) or .db/.db3 pair (main + <em>_Meta</em>)</div>

            <input
              ref={inputRef}
              id="fileInput"
              name="fileInput"
              type="file"
              multiple
              className="absolute left-0 top-0 h-0.5 w-0.5 overflow-hidden border-0 p-0 opacity-0"
              accept=".pdf,.db,.db3,application/pdf,application/x-sqlite3"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            {files.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500">
                <AlertTriangle className="h-4 w-4" /> No files selected.
              </div>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2">
                    {/\.(pdf)$/i.test(f.name) ? <FileText className="h-4 w-4 text-gray-700" /> : <Database className="h-4 w-4 text-gray-700" />}
                    <span className="font-medium">{f.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white",
                isUploading ? "opacity-80" : "hover:bg-indigo-700"
              )}
            >
              {isUploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>) : (<><CheckCircle2 className="h-4 w-4" /> Upload</>)}
            </button>
            <span className="text-xs text-gray-500">Sector: <strong>{sectorCode}</strong> ({sectorTitle})</span>
          </div>
        </form>
      </section>
    </div>
  );
}
