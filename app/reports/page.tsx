export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UploadRow = {
  id: number;
  sector: string;
  client: string;
  project: string;
  filename: string;
  blobPathname: string;
  blobUrl: string;
  uploadedAt: string;
};

async function fetchGrouped() {
  const r = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/reports/list`, { cache: 'no-store' });
  if (!r.ok) return { grouped: {} as Record<string, Record<string, UploadRow[]>> };
  return r.json();
}

export default async function P4Reports() {
  const { grouped } = await fetchGrouped();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P4
      </span>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Uploaded Reports</h1>
        <p className="mt-2 text-gray-600">
          Browse by client and project. Click a project name to view the dashboard. You can delete a file, a whole project, or an entire client.
        </p>

        <div className="mt-6 space-y-6">
          {Object.keys(grouped).length === 0 && (
            <div className="text-gray-500">No uploads yet.</div>
          )}

          {Object.entries(grouped).map(([client, projects]) => (
            <div key={client} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{client}</h2>
                <button
                  className="text-sm text-rose-700 hover:underline"
                  onClick={async () => {
                    await fetch('/api/reports/delete', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ mode: 'client', client }),
                    });
                    location.reload();
                  }}
                >
                  Delete client
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(projects).map(([project, files]) => (
                  <div key={project} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <a
                        href={`/dashboard?sector=${encodeURIComponent(files[0].sector)}&client=${encodeURIComponent(client)}&project=${encodeURIComponent(project)}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {project}
                      </a>
                      <button
                        className="text-sm text-rose-700 hover:underline"
                        onClick={async () => {
                          await fetch('/api/reports/delete', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ mode: 'project', client, project }),
                          });
                          location.reload();
                        }}
                      >
                        Delete project
                      </button>
                    </div>

                    <ul className="divide-y">
                      {files.map((f) => (
                        <li key={f.blobPathname} className="flex items-center justify-between py-2">
                          <div className="truncate">
                            <a href={f.blobUrl} target="_blank" className="text-slate-700 hover:underline">{f.filename}</a>
                            <div className="text-xs text-slate-500">
                              Sector: {f.sector} • Uploaded: {new Date(f.uploadedAt || Date.now()).toLocaleString()}
                            </div>
                          </div>
                          <button
                            className="text-sm text-rose-700 hover:underline"
                            onClick={async () => {
                              await fetch('/api/reports/delete', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({ mode: 'file', pathname: f.blobPathname }),
                              });
                              location.reload();
                            }}
                          >
                            Delete file
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
