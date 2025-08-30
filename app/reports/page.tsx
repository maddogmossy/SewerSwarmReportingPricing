// app/reports/page.tsx
import { list, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import {
  Folder,
  FileText,
  Database,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function PageBadge() {
  return (
    <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
      P4
    </span>
  );
}

type FileLeaf = {
  url: string;
  pathname: string;
  size: number;
  contentType?: string | null;
  uploadedAt?: string | null;
};

type Tree = Record<string, Record<string, FileLeaf[]>>;

function groupByClientProject(blobs: FileLeaf[]) {
  const tree: Tree = {};
  for (const b of blobs) {
    const parts = b.pathname.split('/').filter(Boolean);
    if (parts.length < 4) continue;
    const client = parts[1];
    const project = parts[2];
    tree[client] ??= {};
    tree[client][project] ??= [];
    tree[client][project].push(b);
  }
  return tree;
}
function prettyBytes(n: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n, u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  return `${v.toFixed(v < 10 && u > 0 ? 1 : 0)} ${units[u]}`;
}
const isDb  = (p: string) => /\.db3?$/i.test(p);
const isPdf = (p: string) => /\.pdf$/i.test(p);

async function deleteFileAction(formData: FormData) {
  'use server';
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const url = String(formData.get('url') || '');
  if (!url) return;
  await del(url);
  revalidatePath('/reports');
}
async function deleteProjectAction(formData: FormData) {
  'use server';
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const sector = String(formData.get('sector') || '');
  const client = String(formData.get('client') || '');
  const project = String(formData.get('project') || '');
  if (!sector || !client || !project) return;

  const prefix = `${sector}/${client}/${project}/`;
  let cursor: string | undefined;
  do {
    const { blobs, cursor: next } = await list({ prefix, cursor });
    if (blobs?.length) await Promise.all(blobs.map((b) => del(b.url)));
    cursor = next ?? undefined;
  } while (cursor);

  revalidatePath('/reports');
}
async function deleteClientAction(formData: FormData) {
  'use server';
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const sector = String(formData.get('sector') || '');
  const client = String(formData.get('client') || '');
  if (!sector || !client) return;

  const prefix = `${sector}/${client}/`;
  let cursor: string | undefined;
  do {
    const { blobs, cursor: next } = await list({ prefix, cursor });
    if (blobs?.length) await Promise.all(blobs.map((b) => del(b.url)));
    cursor = next ?? undefined;
  } while (cursor);

  revalidatePath('/reports');
}

export default async function ReportsPage() {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  let all: FileLeaf[] = [];
  let listError: string | null = null;
  if (hasBlob) {
    try {
      let cursor: string | undefined = undefined;
      do {
        const { blobs, cursor: next } = await list({ cursor });
        for (const b of blobs) {
          all.push({
            url: b.url, pathname: b.pathname, size: b.size,
            contentType: (b as any).contentType ?? null,
            uploadedAt: (b as any).uploadedAt ?? null,
          });
        }
        cursor = next ?? undefined;
      } while (cursor);
    } catch (e: any) {
      listError = e?.message || 'Failed to list storage';
    }
  }

  const bySector = new Map<string, FileLeaf[]>();
  for (const f of all) {
    const parts = f.pathname.split('/').filter(Boolean);
    if (parts.length < 4) continue;
    const sector = parts[0];
    if (!bySector.has(sector)) bySector.set(sector, []);
    bySector.get(sector)!.push(f);
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <PageBadge />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Upload Inspection Report</h1>
        <p className="mt-1 text-slate-600">
          Upload your CCTV inspection files (PDF or .db format) and select the applicable sector for analysis
        </p>
      </header>

      {!hasBlob && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="font-semibold">Storage not connected</div>
          <div className="mt-1 text-sm">
            Set <code>BLOB_READ_WRITE_TOKEN</code> in Vercel → Environment Variables, then redeploy.
          </div>
        </div>
      )}
      {listError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          <div className="font-semibold">Couldn’t read storage</div>
          <div className="mt-1 text-sm">{listError}</div>
        </div>
      )}

      <div className="space-y-4">
        {[...bySector.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([sector, files]) => {
          const clients = groupByClientProject(files);
          const sectorColour =
            sector === 'S1' ? 'border-indigo-300'
            : sector === 'S2' ? 'border-emerald-300'
            : sector === 'S3' ? 'border-amber-300'
            : sector === 'S4' ? 'border-rose-300'
            : sector === 'S5' ? 'border-sky-300'
            : sector === 'S6' ? 'border-cyan-300'
            : 'border-slate-200';

          return (
            <details key={sector} className={`rounded-xl border ${sectorColour} bg-white shadow-sm`} open>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
                <ChevronDown className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">{sector}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {Object.keys(clients).length} clients
                </span>
              </summary>

              <div className="space-y-4 px-4 pb-4">
                {Object.keys(clients).sort((a, b) => a.localeCompare(b)).map((client) => {
                  const projects = clients[client];
                  return (
                    <details key={client} className="rounded-lg border border-slate-200">
                      <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-3 py-2">
                        <Folder className="h-4 w-4 text-slate-600" />
                        <span className="font-medium">{client}</span>
                        <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                          {Object.keys(projects).length} projects
                        </span>

                        <form action={deleteClientAction} className="ml-auto">
                          <input type="hidden" name="sector" value={sector} />
                          <input type="hidden" name="client" value={client} />
                          <button
                            type="submit"
                            disabled={!hasBlob}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            title={hasBlob ? 'Delete client (all projects & files)' : 'Storage not connected'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete client
                          </button>
                        </form>
                      </summary>

                      <div className="space-y-3 p-3">
                        {Object.keys(projects).sort((a, b) => a.localeCompare(b)).map((project) => {
                          const files = projects[project];
                          return (
                            <div key={project} className="rounded-md border border-slate-200">
                              <div className="flex items-center gap-2 px-3 py-2">
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                                <Folder className="h-4 w-4 text-slate-600" />
                                <span className="font-medium">{project}</span>
                                <span className="ml-2 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                  {files.length} files
                                </span>

                                <form action={deleteProjectAction} className="ml-auto">
                                  <input type="hidden" name="sector" value={sector} />
                                  <input type="hidden" name="client" value={client} />
                                  <input type="hidden" name="project" value={project} />
                                  <button
                                    type="submit"
                                    disabled={!hasBlob}
                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    title={hasBlob ? 'Delete project (all files)' : 'Storage not connected'}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete project
                                  </button>
                                </form>
                              </div>

                              <ul className="divide-y divide-slate-200">
                                {files.slice().sort((a, b) => a.pathname.localeCompare(b.pathname)).map((f) => (
                                  <li key={f.url} className="flex items-center gap-3 px-3 py-2">
                                    {isPdf(f.pathname) ? (
                                      <FileText className="h-4 w-4 text-slate-600" />
                                    ) : isDb(f.pathname) ? (
                                      <Database className="h-4 w-4 text-slate-600" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-slate-600" />
                                    )}

                                    <a
                                      href={f.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex-1 truncate text-sm text-indigo-700 underline underline-offset-2"
                                      title={f.pathname}
                                    >
                                      {f.pathname.split('/').pop()}
                                    </a>

                                    <span className="text-xs text-slate-500">{prettyBytes(f.size)}</span>

                                    <form action={deleteFileAction}>
                                      <input type="hidden" name="url" value={f.url} />
                                      <button
                                        type="submit"
                                        disabled={!hasBlob}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                        title={hasBlob ? 'Delete file' : 'Storage not connected'}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </form>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {hasBlob && !listError && bySector.size === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          No uploads yet. Go to the Sectors page (P2) to upload your first report.
        </div>
      )}
    </main>
  );
}
