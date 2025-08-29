// app/upload/[sector]/upload-client.tsx
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
  sectorSlug: string;
  sectorCode: string;
  sectorTitle: string;
  sectorStandards: string;
};

type Client = { id: string; name: string };

const cn = (...s: Array<string | false | null | undefined>) =>
  s.filter(Boolean).join(" ");

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/i;

function parseFromPattern(name: string) {
  const core = name
    .replace(/(_Meta|- Meta)?\.[^.]+$/i, "")
    .replace(/\.[^.]+$/i, "");
  const parts = core.split(" - ").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;
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
    if (!r.ok) return [];
    const data = (await r.json()) as Client[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

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
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 15a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1zm1-8h-2V7h2z" />
        </svg>
      )}
      <div className="flex-1">{text}</div>
      <button aria-label="dismiss" className="rounded p-1 hover:bg-black/5" onClick={onClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function UploadClient({
  sectorSlug,
  sectorCode,
  sectorTitle,
  sectorStandards,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSelect, setClientSelect] = useState<string>("");
  const [newClient, setNewClient] = useState("");
  const [useNewClient, setUseNewClient] = useState(false);

  const [projectNo, setProjectNo] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [toast, setToast] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

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
      if (mains.length !== 1 || metas.length !== 1) return {
