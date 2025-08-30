'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Wrench, ShieldCheck, Car, House, Shield, Hammer, FileUp,
} from 'lucide-react';

/* =========================
   Types
========================= */
type Ok =
  | { ok: true; kind: 'pdf' }
  | { ok: true; kind: 'db'; main: File; meta: File };
type NotOk = { ok: false; reason: string };
type Check = Ok | NotOk;

/* =========================
   Sector style map (S1..S6)
========================= */
const sectorStyles: Record<
  string,
  {
    title: string;
    subtitle: string;
    border: string;
    iconBg: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }
> = {
  S1: {
    title: 'Utilities',
    subtitle: 'Water companies, utility providers',
    border: 'border-indigo-300',
    iconBg: 'bg-indigo-50 text-indigo-700',
    Icon: Wrench,
  },
  S2: {
    title: 'Adoption',
    subtitle: 'Section 104 adoption agreements',
    border: 'border-emerald-300',
    iconBg: 'bg-emerald-50 text-emerald-700',
    Icon: ShieldCheck,
  },
  S3: {
    title: 'Highways',
    subtitle: 'Highway drainage systems',
    border: 'border-amber-300',
    iconBg: 'bg-amber-50 text-amber-700',
    Icon: Car,
  },
  S4: {
    title: 'Domestic',
    subtitle: 'Household and private drain assessments',
    border: 'border-rose-300',
    iconBg: 'bg-rose-50 text-rose-700',
    Icon: House,
  },
  S5: {
    title: 'Insurance',
    subtitle: 'Insurance assessments and claims',
    border: 'border-sky-300',
    iconBg: 'bg-sky-50 text-sky-700',
    Icon: Shield,
  },
  S6: {
    title: 'Construction',
    subtitle: 'New build and development projects',
    border: 'border-cyan-300',
    iconBg: 'bg-cyan-50 text-cyan-700',
    Icon: Hammer,
  },
};

/* =========================
   Helpers / validators
========================= */
const ACCEPT =
  '.pdf,.db,.db3,application/x-sqlite3,application/vnd.sqlite3,application/octet-stream';

const isPdf  = (n: string) => n.toLowerCase().endsWith('.pdf');
const isDb   = (n: string) => /\.db3?$/i.test(n);
const isMeta = (n: string) => /_meta\.db3?$/i.test(n);
const baseDb = (n: string) => n.replace(/_meta(?=\.db3?$)/i, '').toLowerCase();

function validateSelection(list: File[]): Check {
  const pdfs = list.filter(f => isPdf(f.name));
  const dbs  = list.filter(f => isDb(f.name));

  if (pdfs.length === 1 && dbs.length === 0) return { ok: true, kind: 'pdf' };

  if (dbs.length >= 1) {
    const main = dbs.find(f => !isMeta(f.name));
    const meta = dbs.find(f =>  isMeta(f.name));
    if (!main || !meta) {
      return { ok: false, reason: 'A .db/.db3 upload needs exactly two files: main + _Meta.' };
    }
    if (baseDb(main.name) !== baseDb(meta.name)) {
      return { ok: false, reason: 'The .db/.db3 and _Meta names must match (same base).' };
    }
    return { ok: true, kind: 'db', main, meta };
  }

  if (list.length === 0) return { ok: false, reason: 'Please add a PDF or a .db/.db3 pair.' };
  return { ok: false, reason: 'Only a single PDF or a .db/.db3 pair is allowed.' };
}

/* =========================
   Tiny IndexedDB helpers to persist last folder handle
========================= */
const DB_NAME = 'ss-upload';
const STORE   = 'fs-handles';

function idb<T=unknown>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(STORE, mode);
      const st = tx.objectStore(STORE);
      tx.oncomplete = () => resolve(undefined as T);
      tx.onerror = () => reject(tx.error);
      fn(st);
    };
  });
}

async function idbGet<T=unknown>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    idb('readonly', (st) => {
      const req = st.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    }).catch(reject);
  });
}

async function idbSet<T=unknown>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    idb('readwrite', (st) => {
      const req = st.put(value as unknown as IDBValidKey, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }).catch(reject);
  });
}

/* =========================
   Component
========================= */
export default function UploadClient() {
  const { sector: raw } = (useParams() ?? {}) as { sector?: string };
  const sector = String(raw ?? 'S1').toUpperCase();
  const style  = sectorStyles[sector] ?? sectorStyles.S1;

  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [lastDir, setLastDir] = React.useState<FileSystemDirectoryHandle | null>(null);

  const fileInputRef   = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Make the fallback <input type="file"> behave like a folder picker
  React.useEffect(() => {
    const el = folderInputRef.current;
    if (!el) return;
    el.setAttribute('webkitdirectory', '');
    el.setAttribute('directory', '');
    el.setAttribute('mozdirectory', '');
    el.setAttribute('msdirectory', '');
  }, []);

  // Load previously used directory handle (if any) to jump there instantly
  React.useEffect(() => {
    (async () => {
      try {
        const handle = await idbGet<FileSystemDirectoryHandle>('lastDirHandle');
        if (handle) setLastDir(handle);
      } catch { /* ignore */ }
    })();
  }, []);

  const addFiles = (incoming: File[]) => {
    if (!incoming?.length) return;
    setFiles(prev => {
      const map = new Map<string, File>();
      for (const f of prev)     map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
      for (const f of incoming) map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
      return Array.from(map.values());
    });
  };

  async function verifyDirPermission(dir: FileSystemDirectoryHandle, write = false) {
    // Request permission if needed (Chrome quirk on saved handles)
    const opts: any = { mode: write ? 'readwrite' : 'read' };
    // @ts-ignore
    if ((await (dir as any).queryPermission?.(opts)) !== 'granted') {
      // @ts-ignore
      const res = await (dir as any).requestPermission?.(opts);
      return res === 'granted';
    }
    return true;
  }

  const pickFolder = async (e?: React.MouseEvent) => {
    try {
      // Shift+Click => classic multi-file dialog (shows .pdf/.db3)
      if (e?.shiftKey) return fileInputRef.current?.click();

      const w: any = window;
      if (typeof w.showDirectoryPicker === 'function') {
        const dir = await w.showDirectoryPicker({
          id: 'sewerswarm-upload',
          // Jump back to last folder if we have it; else a local fast location
          startIn: lastDir ?? 'downloads',
          mode: 'read',
        });

        // Persist handle so next open is instant
        try {
          const ok = await verifyDirPermission(dir, false);
          if (ok) {
            await idbSet('lastDirHandle', dir);
            setLastDir(dir);
          }
        } catch { /* ignore */ }

        const picked: File[] = [];
        for await (const [, entry] of dir.entries()) {
          if (entry.kind === 'file') {
            const f = await entry.getFile();
            if (isPdf(f.name) || isDb(f.name)) picked.push(f);
          }
        }
        addFiles(picked);
        return;
      }

      // Fallback: hidden input-based “folder” picker (slower on cloud drives)
      folderInputRef.current?.click();
    } catch {
      // user cancelled – ignore
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.currentTarget.value = ''; // allow picking the same file again
  };

  const validation = React.useMemo(() => validateSelection(files), [files]);
  React.useEffect(() => setError(validation.ok ? null : validation.reason), [validation]);

  const { Icon } = style;

  return (
    <div className={`rounded-xl border ${style.border} bg-white shadow-sm`}>
      {/* Header styled like the sector card and shows P3 & S# */}
      <div className={`flex items-center gap-3 border-b ${style.border} px-4 py-3`}>
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
              {sector}
            </span>
            <h2 className="text-lg font-semibold">Upload Report — {style.title}</h2>
            <span className="ml-auto text-xs text-neutral-500">P3</span>
          </div>
          <p className="text-sm text-neutral-600">{style.subtitle}</p>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mb-3 rounded-xl border-2 border-dashed border-neutral-300 p-8 text-center"
        >
          <FileUp className="mx-auto mb-2 h-6 w-6 text-neutral-500" />
          <div className="text-sm">
            Drag &amp; drop files here, or{' '}
            <button
              type="button"
              onClick={pickFolder}
              className="text-indigo-700 underline underline-offset-2"
              title="Click to pick a folder (fast). Shift+Click for classic file dialog."
            >
              browse folder
            </button>
            {' '}|{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-700 underline underline-offset-2"
              title="Choose files (shows .pdf/.db3); may be slower on cloud/network drives"
            >
              choose files
            </button>
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            PDF (single) or .db/.db3 pair (main + _Meta)
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={onFiles}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          accept={ACCEPT}
          onChange={onFiles}
          className="hidden"
        />

        {/* Selected list */}
        <div className="mb-4 min-h-10 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
          {files.length === 0 ? (
            <span className="text-neutral-500">No files selected.</span>
          ) : (
            <ul className="grid gap-1">
              {files.map(f => (
                <li
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  className="truncate"
                  title={f.name}
                >
                  {f.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!validation.ok}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => console.log('TODO: POST to /api/uploads with', files)}
          >
            Upload
          </button>
          <span className="text-xs text-neutral-500">
            Sector: {sector} ({style.title})
            {lastDir ? ' • last folder remembered' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
