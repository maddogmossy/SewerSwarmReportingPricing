// app/reports/page.tsx
import { list, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type BlobRow = {
  url: string;
  pathname: string;
  name: string;
  size: number;
  uploadedAt?: string;
  sector?: string;
  client?: string;
  project?: string;
};

function parsePath(pathname: string) {
  // Expecting: /S#/Client/Project/filename
  const parts = pathname.replace(/^\/+/, "").split("/");
  const [sectorMaybe, client, project, ...rest] = parts;
  const sector =
    sectorMaybe && /^S[1-6]$/i.test(sectorMaybe)
      ? sectorMaybe.toUpperCase()
      : undefined;
  const filename =
    rest.length > 0 ? rest.join("/") : parts[parts.length - 1] ?? pathname;
  return { sector, client, project, filename };
}

async function fetchAll(): Promise<BlobRow[]> {
  const all: BlobRow[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page: Awaited<ReturnType<typeof list>> = await list({ cursor });
    for (const b of page.blobs) {
      const { sector, client, project, filename } = parsePath(b.pathname);
      all.push({
        url: b.url,
        pathname: b.pathname,
        name: filename,
        size: b.size,
        uploadedAt: (b as any).uploadedAt,
        sector,
        client,
        project,
      });
    }
    cursor = page.cursor;
  } while (cursor);

  all.sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
  return all;
}

export default async function ReportsPage() {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  // ✅ No token at build? Render a message and do NOT call list()
  if (!hasBlobToken) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
          P4
        </span>

        <header className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-extrabold tracking-tight">Uploaded Reports</h1>
          <p className="mt-2 text-slate-600">
            Storage isn’t configured for this build. Set{" "}
            <code>BLOB_READ_WRITE_TOKEN</code> in Vercel → Project → Settings → Environment Variables,
            then redeploy.
          </p>
        </header>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <div className="font-semibold">Vercel Blob token missing</div>
          <div className="mt-1 text-sm">
            Until the token is configured, this page will load without listing files.
          </div>
          <div className="mt-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Token present → list blobs normally
  const rows = await fetchAll();

  async function deleteFile(formData: FormData) {
    "use server";
    const pathname = String(formData.get("pathname") || "");
    if (!pathname) return;
    await del(pathname);
    revalidatePath("/reports");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P4
      </span>

      <header className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">Uploaded Reports</h1>
        <p className="mt-2 text-slate-600">
          Lists the files you’ve uploaded by sector (newest first).
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
        >
          Home
        </Link>
        <Link
          href="/upload"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
        >
          Upload another
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-slate-600 shadow-sm">
          No files found yet. Try{" "}
          <Link href="/upload" className="text-indigo-700 underline">
            uploading
          </Link>{" "}
          a report.
        </div>
      ) : (
        <ul className="grid gap-4">
          {rows.map((r) => (
            <li
              key={r.pathname}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold break-all">
                    {r.name || "file"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Sector: {r.sector ?? "—"}{" "}
                    {r.client ? <>· Client: {r.client}</> : null}{" "}
                    {r.project ? <>· Project: {r.project}</> : null}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Uploaded:{" "}
                    {r.uploadedAt
                      ? new Date(r.uploadedAt).toLocaleString()
                      : "—"}{" "}
                    · {(r.size / (1024 * 1024)).toFixed(2)} MB
                  </div>

                  <div className="mt-2 flex gap-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 underline underline-offset-2"
                    >
                      Open
                    </a>

                    <form action={deleteFile}>
                      <input type="hidden" name="pathname" value={r.pathname} />
                      <button
                        type="submit"
                        className="text-rose-700 underline underline-offset-2"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                  {r.sector ?? "S?"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}