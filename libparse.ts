export function parseProjectFolder(folder: string) {
  // "Project No - Full Site address - Post code"
  // Keep simple and resilient:
  const parts = folder.split(' - ').map(s => s.trim());
  const projectNo = parts[0] || null;
  const siteAddress = parts.slice(1, parts.length - 1).join(' - ') || null;
  const postcode = parts.at(-1) || null;
  return { projectNo, siteAddress, postcode };
}

export function sanitizePathPart(s: string) {
  return s.replace(/[\\/#?:*"<>\|]/g, '').trim().slice(0, 128) || 'General';
}

export function guessType(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.db3') || n.endsWith('.db')) return 'application/x-sqlite3';
  return 'application/octet-stream';
}

export function isDb(name: string) {
  return /\.db3?$/i.test(name);
}
export function isMeta(name: string) {
  return /_meta\.db3?$/i.test(name);
}
export function baseDb(name: string) {
  return name.replace(/_meta(?=\.db3?$)/i, '').toLowerCase();
}
