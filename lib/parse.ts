// lib/parse.ts

// Accept list for <input accept="...">
export const ACCEPT =
  '.pdf,.db,.db3,application/x-sqlite3,application/vnd.sqlite3,application/octet-stream';

// ---------- filename helpers ----------
export const isPdf  = (n: string) => n.toLowerCase().endsWith('.pdf');
export const isDb   = (n: string) => /\.db3?$/i.test(n);
export const isMeta = (n: string) => /_meta\.db3?$/i.test(n);

/** strip _Meta and extension, case-insensitive; lower for compare */
export const baseDb = (n: string) =>
  n.replace(/_meta(?=\.db3?$)/i, '').replace(/\.[^/.]+$/,'').toLowerCase();

/** Minimal content-type guesser (used for Blob put) */
export function guessType(name: string): string {
  const ext = name.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'db':
    case 'db3': return 'application/x-sqlite3';
    default:    return 'application/octet-stream';
  }
}

/** Basic sanitizer for folder / path segments */
export function sanitize(s?: unknown) {
  const str = String(s ?? '').trim();
  return str
    .replace(/[\/\\]+/g, '-')                 // kill slashes
    .replace(/[^\w\s\-\.\(\)&,]/g, '')        // allow common filename chars
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

/** Explicit path-part sanitizer some files import */
export function sanitizePathPart(s?: unknown): string {
  const v = sanitize(s);
  return v || 'untitled';
}

export type ProjectPieces = {
  projectNo?: string;
  address?: string;
  postcode?: string;
  clientName?: string;
};

/** Try to derive "Project No - Full Site address - Post code" from a filename */
export function pickFromFilename(filename: string): ProjectPieces & { folder: string } {
  const name  = filename.replace(/\.[^/.]+$/,'');
  const parts = name.split(/\s*-\s*/);
  let [projectNo, address, postcode] = [undefined, undefined, undefined] as (string | undefined)[];

  if (parts.length >= 3) {
    projectNo = parts[0];
    address   = parts[1];
    postcode  = parts.slice(2).join(' - ');
  }
  const folder = [projectNo, address, postcode].filter(Boolean).map(sanitize).join(' - ');
  return {
    projectNo: projectNo && sanitize(projectNo),
    address:   address   && sanitize(address),
    postcode:  postcode  && sanitize(postcode),
    folder
  };
}

/** Parse a project folder name back into parts (reverse of the above) */
export function parseProjectFolder(folder?: string): ProjectPieces {
  const safe = sanitize(folder ?? '');
  if (!safe) return {};
  const parts = safe.split(/\s*-\s*/);
  const [projectNo, address, ...rest] = parts;
  const postcode = rest.length ? rest.join(' - ') : undefined;
  return {
    projectNo: projectNo || undefined,
    address:   address   || undefined,
    postcode:  postcode  || undefined,
  };
}

/**
 * Derive the destination "Project No - Full Site address - Post code" folder.
 * If `override` is a non-empty string, it wins. Otherwise try from provided files' names.
 */
export function deriveProjectFromFiles(
  files: Array<{ name: string }> = [],
  override?: string | FormDataEntryValue | null | undefined
): string {
  const over = typeof override === 'string' ? sanitize(overridestr(override)) : '';
  if (over) return over;

  // Prefer a PDF name (often more human-readable)
  const pdf = files.find(f => isPdf(f.name));
  if (pdf) {
    const { folder } = pickFromFilename(pdf.name);
    if (folder) return folder;
  }

  // Fallback to a .db/.db3 main file (non _Meta)
  const mainDb = files.find(f => isDb(f.name) && !isMeta(f.name));
  if (mainDb) {
    const { folder } = pickFromFilename(mainDb.name);
    if (folder) return folder;
  }

  return 'Unsorted';
}

// internal – ensure string typed override
function overridestr(v: unknown) { return (typeof v === 'string' ? v : ''); }

/** Validate that when a .db/.db3 is present, we also have its matching _Meta file */
export function validateDbPair(list: Array<{ name: string }>): { ok: true } | { ok: false; reason: string } {
  const dbs = list.filter(f => isDb(f.name));
  if (dbs.length >= 1) {
    const main = dbs.find(f => !isMeta(f.name));
    const meta = dbs.find(f =>  isMeta(f.name));
    if (!main || !meta) {
      return { ok: false, reason: 'A .db/.db3 upload needs exactly two files: main + _Meta.' };
    }
    if (baseDb(main.name) !== baseDb(meta.name)) {
      return { ok: false, reason: 'The .db/.db3 and _Meta names must match (same base).' };
    }
    return { ok: true };
  }
  return { ok: false, reason: 'Please add a PDF or a .db/.db3 pair.' };
}
