// app/reports/page.tsx
// P4 — Uploaded Reports (Client ➜ Project ➜ Files)
//
// Requires:
//  - @vercel/blob installed
//  - BLOB_READ_WRITE_TOKEN in Vercel env (RW token)
//  - (Optional) DATABASE_URL if you also persist elsewhere

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

// Optional: badge like other pages
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

type Tree = Record<
  string, // client
  Record<
    string, // project
    FileLeaf[]
  >
>;

function groupByClientProject(blobs: FileLeaf[]) {
  // Expect path: "S#/Client/Project/filename.ext"
  const tree: Record<string, Tree[string]> = {};
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
  let v = n,
    u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(v < 10 && u > 0 ? 1 : 0)} ${units[u]}`;
}

function isDb(pathname: string) {
  return /\.db3?$/i.test(pathname);
}
function isPdf(pathname: string) {
  return /\.pdf$/i.test(pathname);
}

/* ------------------- SERVER ACTIONS (LOCAL, NOT EXPORTED) ------------------- */
async function deleteFileAction(formData: FormData) {
  'use server';
  const url = String(formData.get('url') || '');
  if (!url) return;
  await del(url);
  revalidatePath('/reports');
}

async function deleteProjectAction(formData: FormData) {
  'use server';
  const sector = String(formData.get('sector') || '');
  const client = String(formData.get('client') || '');
  const project = String(formData.get('project') || '');
  if (!sector || !client || !project) return;

  const prefix = `${sector}/${client}/${project}/`;
  let cursor: string | undefined = undefined;
  do {
    const { blobs, cursor: next } = await list({ prefix, cursor });
    if (blobs?.length) {
      await Promise.all(blobs.map((b) => del(b.url)));
    }
    cursor = next ?? undefined;
  } while (cursor);

  revalidatePath('/reports');
}

async function deleteClientAction(formData: FormData) {
  'use server';
  const sector = String(formData.get('sector') || '');
  const client = String(formData.get('client') || '');
  if (!sector || !client) return;

  const prefix = `${sector}/${client}/`;
  let cursor: string | undefined = undefined;
  do {
    const { blobs, cursor: next } = await list({ prefix, cursor });
    if (blobs?.length) {
      await Promise.all(blobs.map((b) => del(b.url)));
    }
    cursor = next ?? undefined;
  } while (cursor);

  revalidatePath('/reports');
}
/* --------------------------------------------------------------------------- */

export default async function ReportsPage() {
  // Pull all blobs; if your store grows large, list by sector prefixes instead.
  const all: FileLeaf[] = [];
  let cursor: string | undefined = undefined;
  do {
    const { blobs, cursor: next } = await list({ cursor });
    for (const b of blobs) {
      all.push({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        contentType: (b as any).contentType ?? null,
        uploadedAt: (b as any).uploadedAt ?? null,
      });
    }
    cursor = next ?? undefined;
  } while (cursor);

  const bySector = new Map<string, FileLeaf[]>();
  for (const f of all) {
    const parts = f.pathname.split('/').filter(Boolean);
    if (parts.length < 4) continue; // require S#/Client/Project/file
    const sector = parts[0];
    if (!bySector.has(sector)) bySector.set(sector, []);
    bySector.get(sector)!.push(f);
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <PageBadge />

      {/* Title + subtitle */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Upload Inspection Report</h1>
        <p className="mt-1 text-slate-600">
          Upload your CCTV inspection files (PDF or .db format) and select the
          applicable sector for analysis
        </p>
      </header>

      {/* Sectors accordion */}
      <div className="space-y-4">
        {[...bySector.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([sector, files]) => {
            const clients = groupByClientProject(files);
            const sectorColour =
              sector === 'S1'
                ? 'border-indigo-300'
                : sector === 'S2'
                ? 'border-emerald-300'
                : sector === 'S3'
                ? 'border-amber-300'
                : sector === 'S4'
                ? 'border-rose-300'
                : sector === 'S5'
                ? 'border-sky-300'
                : sector === 'S6'
                ? 'border-cyan-300'
                : 'border-slate-200';

            return (
              <details
                key={sector}
                className={`rounded-xl border ${sectorColour} bg-white shadow-sm`}
                open
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">
                    {sector}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {Object.keys(clients).length} clients
                  </span>
                </summary>

                <div className="space-y-4 px-4 pb-4">
                  {Object.keys(clients)
                    .sort((a, b) => a.localeCompare(b))
                    .map((client) => {
                      const projects = clients[client];

                      return (
                        <details
                          key={client}
                          className="rounded-lg border border-slate-200"
                        >
                          <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-3 py-2">
                            <Folder className="h-4 w-4 text-slate-600" />
                            <span className="font-medium">{client}</span>
                            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                              {Object.keys(projects).length} projects
                            </span>

                            {/* Delete client */}
                            <form action={deleteClientAction} className="ml-auto">
                              <input type="hidden" name="sector" value={sector} />
                              <input type="hidden" name="client" value={client} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                title="Delete client (all projects & files)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete client
                              </button>
                            </form>
                          </summary>

                          <div className="space-y-3 p-3">
                            {Object.keys(projects)
                              .sort((a, b) => a.localeCompare(b))
                              .map((project) => {
                                const files = projects[project];

                                return (
                                  <div
                                    key={project}
                                    className="rounded-md border border-slate-200"
                                  >
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                      <Folder className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">{project}</span>
                                      <span className="ml-2 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                        {files.length} files
                                      </span>

                                      {/* Delete project */}
                                      <form
                                        action={deleteProjectAction}
                                        className="ml-auto"
                                      >
                                        <input
                                          type="hidden"
                                          name="sector"
                                          value={sector}
                                        />
                                        <input
                                          type="hidden"
                                          name="client"
                                          value={client}
                                        />
                                        <input
                                          type="hidden"
                                          name="project"
                                          value={project}
                                        />
                                        <button
                                          type="submit"
                                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                          title="Delete project (all files)"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Delete project
                                        </button>
                                      </form>
                                    </div>

                                    <ul className="divide-y divide-slate-200">
                                      {files
                                        .slice()
                                        .sort((a, b) =>
                                          a.pathname.localeCompare(b.pathname)
                                        )
                                        .map((f) => (
                                          <li
                                            key={f.url}
                                            className="flex items-center gap-3 px-3 py-2"
                                          >
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

                                            <span className="text-xs text-slate-500">
                                              {prettyBytes(f.size)}
                                            </span>

                                            {/* Delete file */}
                                            <form action={deleteFileAction}>
                                              <input
                                                type="hidden"
                                                name="url"
                                                value={f.url}
                                              />
                                              <button
                                                type="submit"
                                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                                title="Delete file"
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

      {bySector.size === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          No uploads yet. Go to the Sectors page (P2) to upload your first report.
        </div>
      )}
    </main>
  );
}
