"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  Wrench,
  ShieldCheck,
  Car,
  House,
  Shield,
  Hammer,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  X,
} from "lucide-react";

/* ----------------------------- types & data ------------------------------ */

type Sector = {
  slug: string;
  code: "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  tone: string;       // icon bubble colours
  borderTone: string; // card border accent
  standards: string[];
};

const sectors: Sector[] = [
  {
    slug: "utilities",
    code: "S1",
    title: "Utilities",
    subtitle: "Water companies, utility providers",
    Icon: Wrench,
    tone: "bg-blue-100 text-blue-700",
    borderTone: "border-blue-300",
    standards: [
      "WRc Sewerage Rehabilitation Manual (SRM)",
      "Water Industry Act 1991",
      "BS EN 752:2017 – Drain and sewer systems",
      "Building Act 1984 Section 21 Notice",
      "Network Rail standards (where applicable)",
    ],
  },
  {
    slug: "adoption",
    code: "S2",
    title: "Adoption",
    subtitle: "Section 104 adoption agreements",
    Icon: ShieldCheck,
    tone: "bg-green-100 text-green-700",
    borderTone: "border-green-300",
    standards: [
      "Sewers for Adoption 8th Edition (SfA8)",
      "Section 104 Water Industry Act 1991",
      "Design and Construction Guidance (DCG)",
      "Building Regulations Approved Document H",
      "BS EN 752:2017 – Drain and sewer systems",
    ],
  },
  {
    slug: "highways",
    code: "S3",
    title: "Highways",
    subtitle: "Highway drainage systems",
    Icon: Car,
    tone: "bg-amber-100 text-amber-700",
    borderTone: "border-amber-300",
    standards: [
      "Design Manual for Roads and Bridges (DMRB)",
      "Highway Act 1980",
      "Specification for Highway Works (SHW)",
      "BS EN 752:2017 – Drain and sewer systems",
      "Traffic Management Act 2004",
    ],
  },
  {
    slug: "domestic",
    code: "S4",
    title: "Domestic",
    subtitle: "Household and private drain assessments",
    Icon: House,
    tone: "bg-rose-100 text-rose-700",
    borderTone: "border-rose-300",
    standards: [
      "MSCC5: Manual of Sewer Condition Classification",
      "WRc Drain Repair Book (4th Ed.)",
      "WRc Sewer Cleaning Manual",
      "BS EN 752:2017 – Drain and sewer systems",
      "Building Act 1984 – Section 59",
    ],
  },
  {
    slug: "insurance",
    code: "S5",
    title: "Insurance",
    subtitle: "Insurance assessments and claims",
    Icon: Shield,
    tone: "bg-sky-100 text-sky-700",
    borderTone: "border-sky-300",
    standards: [
      "Association of British Insurers (ABI) Guidelines",
      "RICS Professional Standards",
      "Flood and Water Management Act 2010",
      "BS EN 752:2017 – Drain and sewer systems",
      "Insurance Act 2015",
    ],
  },
  {
    slug: "construction",
    code: "S6",
    title: "Construction",
    subtitle: "New build and development projects",
    Icon: Hammer,
    tone: "bg-cyan-100 text-cyan-700",
    borderTone: "border-cyan-300",
    standards: [
      "Construction (Design & Management) Regulations 2015",
      "Building Regulations Approved Document H",
      "BS EN 752:2017 – Drain and sewer systems",
      "NHBC Standards",
      "Planning Policy Framework guidance",
    ],
  },
];

/* ---------------------------- small UI helpers --------------------------- */

const cn = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

function DevBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
      {children}
    </span>
  );
}

function IconBubble({ tone, Icon }: { tone: string; Icon: React.ElementType }) {
  return (
    <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`} aria-hidden>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function Toast({
  kind,
  text,
  onClose,
}: { kind: "error" | "success" | "info"; text: string; onClose: () => void }) {
  const palette =
    kind === "error"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : kind === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-sky-50 border-sky-200 text-sky-900";
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-xl border p-3 text-sm shadow-sm", palette)}>
      {kind === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 15a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1zm1-8h-2V7h2z"/></svg>}
      <div className="flex-1">{text}</div>
      <button aria-label="dismiss" className="rounded p-1 hover:bg-black/5" onClick={onClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------ P2 — page ------------------------------- */

export default function UploadLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<Sector | null>(null);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* P2 badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P2
      </span>

      {/* Home shortcut (kept on P2) */}
      <nav className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
        >
          <HomeIcon className="h-4 w-4" />
          Home
        </Link>
      </nav>

      {/* Title + sub */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Upload Inspection Report</h1>
        <p className="mt-1 text-slate-600">
          Upload your CCTV inspection files (PDF or .db3 &amp; meta db format) and select the applicable sector for analysis
        </p>
      </header>

      {/* Supported Files (C2) */}
      <section className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DevBadge>C2</DevBadge>
        <h2 className="text-xl font-semibold">Supported Files</h2>
        <ul className="mt-3 list-disc pl-5 text-gray-700">
          <li>PDF reports (single file, up to 50MB)</li>
          <li>Database pairs: <code>.db/.db3</code> + <code>_Meta.db/_Meta.db3</code> (up to 50MB each)</li>
        </ul>
        <p className="mt-3 text-gray-600">Choose a sector below to open the uploader.</p>
      </section>

      {/* Sector cards (open modal instead of routing to /upload/[sector]) */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {sectors.map((s) => (
          <button
            key={s.slug}
            onClick={() => {
              setActiveSector(s);
              setModalOpen(true);
            }}
            className={cn(
              "relative block rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:shadow-md",
              s.borderTone
            )}
          >
            <DevBadge>{s.code}</DevBadge>
            <div className="flex items-start gap-4">
              <IconBubble tone={s.tone} Icon={s.Icon} />
              <div className="flex-1">
                <div className="text-xl font-semibold">{s.title}</div>
                <div className="mt-1 text-gray-600">{s.subtitle}</div>
                <div className="mt-4">
                  <div className="text-xs font-semibold tracking-wide text-slate-700">
                    APPLICABLE STANDARDS
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {s.standards.map((std) => (
                      <li key={std} className="leading-6">{std}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Uploader modal */}
      {modalOpen && activeSector && (
        <UploadModal
          sector={activeSector}
          onClose={() => {
            setModalOpen(false);
            setActiveSector(null);
          }}
        />
      )}
    </main>
  );
}

/* ----------------------------- Uploader Modal ---------------------------- */

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/i;

function parseProjectFields(name: string) {
  // Expect: "Project No - Full Site address - Post code"
  const core = name.replace(/(_Meta|- Meta)?\.[^.]+$/i, "").replace(/\.[^.]+$/i, "");
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

function sanitize(s: string) {
  return s.replace(/[^\w\s.-]+/g, " ").replace(/\s+/g, " ").trim();
}

function UploadModal({
  sector,
  onClose,
}: {
  sector: Sector;
  onClose: () => void;
}) {
  // Upload-only UI (no Client & Project panel)
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Parsed meta
  const [projectNo, setProjectNo] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  // Client name inferred from folder picker (directory handle name)
  const [clientName, setClientName] = useState<string>("");

  const suggestedFilename = useMemo(() => {
    const pn = projectNo.trim(), ad = address.trim(), pc = postcode.trim();
    if (!pn && !ad && !pc) return "";
    return [pn, ad, pc].filter(Boolean).join(" - ");
  }, [projectNo, address, postcode]);

  const isPdf = (f: File) => /\.pdf$/i.test(f.name);
  const isDb  = (f: File) => /\.(db3?|db)$/i.test(f.name);
  const isMeta = (f: File) => /(_Meta|- Meta)\.(db3?|db)$/i.test(f.name);
  const baseDb = (f: File) => f.name.replace(/(_Meta|- Meta)?\.(db3?|db)$/i, "");

  function checkFiles(list: File[]): { ok: boolean; reason?: string } {
    if (!list.length) return { ok: false, reason: "Please add a file." };
    const pdfs = list.filter(isPdf);
    const dbs  = list.filter(isDb);
    if (pdfs.length && dbs.length) return { ok: false, reason: "Choose either a single PDF or a .db/.db3 pair (not both)." };
    if (pdfs.length === 1 && list.length === 1) return { ok: true };
    if (dbs.length >= 1) {
      const main = dbs.find((f) => !isMeta(f.name));
      const meta = dbs.find((f) =>  isMeta(f.name));
      if (!main || !meta) return { ok: false, reason: "A .db/.db3 upload needs exactly two files: main + _Meta." };
      if (baseDb(main) !== baseDb(meta)) return { ok: false, reason: "The .db/.db3 and _Meta names must match (same base)." };
      return { ok: true };
    }
    return { ok: false, reason: "Unsupported files. Upload a PDF or a .db/.db3 pair." };
  }

  function parseAutofill(list: File[]) {
    const main = list.find((f) => isPdf(f) || (isDb(f) && !isMeta(f))) ?? list[0];
    if (!main) return;
    const parsed = parseProjectFields(main.name);
    if (parsed) {
      if (!projectNo) setProjectNo(parsed.projectNo);
      if (!address) setAddress(parsed.address);
      if (!postcode) setPostcode(parsed.postcode);
    }
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files);
    const check = checkFiles(list);
    if (!check.ok) return setToast({ kind: "error", text: check.reason! });
    setFiles(list);
    parseAutofill(list);
  };

  // Folder picker: reads all files in a chosen folder; uses folder name as Client
  async function pickFolderFS() {
    try {
      if (typeof window.showDirectoryPicker === "function") {
        const dir = await window.showDirectoryPicker();
        const picked: File[] = [];
        // @ts-ignore iterate entries from DirectoryHandle
        for await (const [, entry] of dir.entries()) {
          if (entry.kind === "file") {
            const f = await entry.getFile();
            if (/\.(pdf|db3?|db)$/i.test(f.name)) picked.push(f);
          }
        }
        if (!picked.length) return;
        setClientName(sanitize((dir as any).name || "Unfiled"));
        const check = checkFiles(picked);
        if (!check.ok) return setToast({ kind: "error", text: check.reason! });
        setFiles(picked);
        parseAutofill(picked);
        return;
      }
      // Fallback: dir input
      (document.getElementById("folderInputHidden") as HTMLInputElement)?.click();
    } catch {/* cancelled */}
  }

  function onClassicBrowseClick() {
    (document.getElementById("fileInputHidden") as HTMLInputElement)?.click();
  }

  function onDirFallbackChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    // Best we can do: try infer client from first directory segment of webkitRelativePath
    const first = (e.target.files?.[0] as any);
    const rel: string = first?.webkitRelativePath || "";
    const inferredClient = rel.split("/")[0] || "Unfiled";
    setClientName(sanitize(inferredClient));
    const check = checkFiles(list);
    if (!check.ok) return setToast({ kind: "error", text: check.reason! });
    setFiles(list);
    parseAutofill(list);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const check = checkFiles(list);
    if (!check.ok) return setToast({ kind: "error", text: check.reason! });
    setFiles(list);
    parseAutofill(list);
    // No reliable client name from classic dialog; leave empty (server will fallback)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return setToast({ kind: "error", text: "Please add a file to upload." });
    if (!projectNo || !address || !postcode)
      return setToast({ kind: "error", text: "Filename must include: Project No - Full Site address - Post code." });

    try {
      setToast({ kind: "info", text: "Uploading… Please don’t close the window." });

      const fd = new FormData();
      fd.append("sectorSlug", sector.slug);
      fd.append("sectorCode", sector.code);
      fd.append("sectorTitle", sector.title);

      fd.append("projectNo", projectNo);
      fd.append("address", address);
      fd.append("postcode", postcode);

      // Derived folder structure done server-side; send clientName if we have it
      if (clientName) fd.append("clientName", clientName);

      // Suggested target name for PDFs
      const target = [projectNo, address, postcode].filter(Boolean).join(" - ");
      if (target) fd.append("targetFilename", target);

      files.forEach((f) => fd.append("files", f, f.name));

      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || res.statusText);
      }
      // Go to P4 (uploaded reports)
      window.location.href = "/uploads";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ kind: "error", text: `Upload failed: ${msg}` });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">P3</span>
            <h2 className="text-lg font-semibold">Upload Report — {sector.title}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
          {toast && <Toast kind={toast.kind} text={toast.text} onClose={() => setToast(null)} />}

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
              <button type="button" onClick={pickFolderFS} className="text-indigo-700 underline underline-offset-2">
                browse
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              PDF (single) or .db/.db3 pair (main + <em>_Meta</em>)
            </div>

            {/* Fallbacks (hidden) */}
            <input id="fileInputHidden" type="file" multiple className="hidden" onChange={onFileChange}
              accept=".pdf,.db,.db3,application/pdf,application/x-sqlite3" />
            <input id="folderInputHidden" type="file" multiple className="hidden"
              // @ts-ignore chromium dir selection
              webkitdirectory directory onChange={onDirFallbackChange} />
          </div>

          {/* Selected files list */}
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

          {/* Read-only summary pulled from filename + folder */}
          <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 md:grid-cols-2">
            <div><span className="font-semibold">Client:</span> {clientName || <em>— inferred from folder name —</em>}</div>
            <div><span className="font-semibold">Project No:</span> {projectNo || <em>— from filename —</em>}</div>
            <div className="md:col-span-2"><span className="font-semibold">Address:</span> {address || <em>— from filename —</em>}</div>
            <div><span className="font-semibold">Post code:</span> {postcode || <em>— from filename —</em>}</div>
            <div className="md:col-span-2">
              <span className="font-semibold">Target name:</span> {suggestedFilename || <em>—</em>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <CheckCircle2 className="h-4 w-4" /> Upload
            </button>
            <div className="text-xs text-gray-500">Sector: <strong>{sector.code}</strong> ({sector.title})</div>
          </div>
        </form>
      </div>
    </div>
  );
}
