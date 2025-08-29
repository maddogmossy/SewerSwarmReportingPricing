"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type Props = {
  sectorSlug: string;   // e.g. "utilities"
  sectorCode: string;   // e.g. "S1"
  sectorTitle: string;  // e.g. "Utilities"
  sectorStandards: string;
};

type Client = { id: string; name: string };

// ---------- helpers ----------
const cn = (...s: Array<string | false | null | undefined>) =>
  s.filter(Boolean).join(" ");

const UK_POSTCODE =
  /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/i; // tolerant of space

function parseFromPattern(name: string) {
  // Expected: "Project No - Full Site address - Post code.ext"
  // Strip extension and optional "_Meta"/"- Meta"
  const core = name
    .replace(/(_Meta|- Meta)?\.[^.]+$/i, "")
    .replace(/\.[^.]+$/i, "");

  const parts = core.split(" - ").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;

  // last piece should contain a postcode
  const postcodeMatch = parts[parts.length - 1].match(UK_POSTCODE);
  if (!postcodeMatch) return null;

  const projectNo = parts[0];
  const address = parts.slice(1, parts.length - 1).join(" - ");
  const postcode = `${postcodeMatch[1].toUpperCase()} ${postcodeMatch[2].toUpperCase()}`;
  return { projectNo, address, postcode };
}

async function fetchClients(): Promise<Client[]> {
  try {
    const r = await fetch("/api/clients", { cache: "no-store" });
    if (!r.ok) throw new Error("bad status");
    const data = (await r.json()) as Client[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ---------- UI bits ----------
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
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-sm shadow-sm",
        palette
      )}
    >
      {kind === "error" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : kind === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <InfoIcon />
      )}
      <div className="flex-1">{text}</div>
      <button
        aria-label="dismiss"
        className="rounded p-1 hover:bg-black/5"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 15a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1zm1-8h-2V7h2z" />
    </svg>
  );
}

// ---------- main component ----------
export default function UploadClient({
  sectorSlug,
  sectorCode,
  sectorTitle,
  sectorStandards,
}: Props) {
  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSelect, setClientSelect] = useState<string>("");
  const [newClient, setNewClient] = useState("");
  const [useNewClient, setUseNewClient] = useState(false);

  // Project metadata
  const [projectNo, setProjectNo] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // UI state
  const [toast, setToast] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  // suggested name + folder
  const suggestedFilename = useMemo(() => {
    const pn = projectNo.trim();
    const ad = address.trim();
    const pc = postcode.trim();
    if (!pn && !ad && !pc) return "";
    return [pn, ad, pc].filter(Boolean).join(" - ");
  }, [projectNo, address, postcode]);

  const folderPath = useMemo(() => {
    const clientFolder = (useNewClient ? newClient : clients.find(c => c.id === clientSelect)?.name || "").trim();
    const addressFolder = address.trim();
    return [clientFolder, addressFolder].filter(Boolean).join("/");
  }, [useNewClient, newClient, clients, clientSelect, address]);

  // ---------- file helpers ----------
  const isPdf  = (f: File) => /\.pdf$/i.test(f.name);
  const isDb   = (f: File) => /\.db3?$/i.test(f.name) || /\.db$/i.test(f.name);
  const isMeta = (f: File) => /(_Meta|- Meta)\.db3?$/i.test(f.name) || /(_Meta|- Meta)\.db$/i.test(f.name);
  const baseDb = (f: File) =>
    f.name.replace(/(_Meta|- Meta)?\.db3?$/i, "").replace(/(_Meta|- Meta)?\.db$/i, "");

  function checkFiles(list: File[]): { ok: boolean; reason?: string } {
    if (!list.length) return { ok: false, reason: "Please add a file." };
    const pdfs = list.filter(isPdf);
    const dbs  = list.filter(isDb);

    if (pdfs.length && dbs.length)
      return { ok: false, reason: "Choose either a single PDF or a .db/.db3 pair (not both)." };

    if (pdfs.length === 1 && list.length === 1) return { ok: true };

    if (dbs.length >= 1) {
      const mains = dbs.filter((f) => !isMeta(f));
      const metas = dbs.filter((f) => isMeta(f));
      if (mains.length !== 1 || metas.length !== 1)
        return { ok: false, reason: "A .db/.db3 upload needs exactly two files: the main file and the _Meta file." };
      if (baseDb(mains[0]) !== baseDb(metas[0]))
        return { ok: false, reason: "The .db/.db3 and _Meta file names must match (same base name)." };
      return { ok: true };
    }
    return { ok: false, reason: "Unsupported files. Upload a PDF or a .db/.db3 pair." };
  }

  function autofillFromNames(list: File[]) {
    // Prefer the main db/pdf name (not the _Meta)
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
    autofillFromNames(list); // fill fields immediately
  }

  // DnD
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ---------- submit ----------
  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const chooseClientOk = useNewClient ? !!newClient.trim() : !!clientSelect;
    if (!chooseClientOk) {
      setToast({ kind: "error", text: "Please choose an existing client or enter a new client name." });
      return;
    }
    if (!projectNo.trim() || !address.trim() || !postcode.trim()) {
      setToast({ kind: "error", text: "Please fill Project No, Address and Postcode." });
      return;
    }
    if (!files.length) {
      setToast({ kind: "error", text: "Please add a file to upload." });
      return;
    }
    const check = checkFiles(files);
    if (!check.ok) {
      setToast({ kind: "error", text: check.reason || "Invalid files." });
      return;
    }

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

  return (
    <div className="space-y-6">
      {/* Header card with P3 tag */}
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

      {/* In-app toast messages */}
      {toast && (
        <Toast kind={toast.kind} text={toast.text} onClose={() => setToast(null)} />
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50"
        >
          <HomeIcon className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50"
        >
          Back to sectors
        </Link>
        <Link
          href="/uploads"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 shadow-sm transition hover:bg-indigo-100"
        >
          View uploaded reports
        </Link>
      </div>

      {/* Client & project details */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Client & Project</h2>
        <p className="mt-1 text-gray-600">
          Files will be saved to folder: <span className="font-medium">{folderPath || "—"}</span>
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Client picker */}
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
                  onChange={() => setUseNewClient(false)}
                />
                <span className="text-sm text-gray-700">Select existing</span>
              </label>
              {!useNewClient && (
                <select
                  value={clientSelect}
                  onChange={(e) => setClientSelect(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— Choose client —</option>
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
              <input
                value={projectNo}
                onChange={(e) => setProjectNo(e.target.value)}
                placeholder="Project No"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full Site Address"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Post code"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <div className="font-semibold">Suggested filename</div>
                <div className="mt-0.5 font-mono">{suggestedFilename || "—"}</div>
                <div className="mt-1 text-[11px] text-gray-500">
                  Pattern: <code>Project No - Full Site address - Post code</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload area (drag & drop or browse) */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Upload files</h2>
        <p className="mt-1 text-gray-600">
          Upload a single <strong>PDF</strong> or a <strong>.db/.db3</strong> pair (main + <em>_Meta</em>). Max 50MB per file.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
              dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"
            )}
          >
            <UploadCloud className="h-7 w-7 text-gray-500" />
            <div className="mt-2 text-sm text-gray-700">
              Drag & drop files here, or{" "}
              <button
                type="button"
                className="text-indigo-700 underline underline-offset-2"
                onClick={() => inputRef.current?.click()}
              >
                browse
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              PDF (single) or .db/.db3 pair (main + <em>_Meta</em>)
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept=".pdf,.db,.db3,application/pdf,application/x-sqlite3"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* Selected file summary */}
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            {files.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500">
                <AlertTriangle className="h-4 w-4" /> No files selected.
              </div>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2">
                    {/\.(pdf)$/i.test(f.name) ? (
                      <FileText className="h-4 w-4 text-gray-700" />
                    ) : (
                      <Database className="h-4 w-4 text-gray-700" />
                    )}
                    <span className="font-medium">{f.name}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </span>
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
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Upload
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">
              Sector: <strong>{sectorCode}</strong> ({sectorTitle})
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}
