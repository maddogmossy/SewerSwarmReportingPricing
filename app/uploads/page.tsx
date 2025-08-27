import { getUploadsWithRelations } from "@/db/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UploadsPage() {
  const rows = await getUploadsWithRelations();

  // group: client -> project
  const byClient = new Map<string, Map<string, typeof rows>>();
  for (const r of rows) {
    const c = r.clientName ?? "No Client";
    const p = r.projectName ?? "No Project";
    if (!byClient.has(c)) byClient.set(c, new Map());
    const m = byClient.get(c)!;
    if (!m.has(p)) m.set(p, []);
    m.get(p)!.push(r);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Uploaded Reports</h1>
      <p className="text-slate-600 mb-6">Grouped by Client → Project (newest first).</p>

      {[...byClient.entries()].map(([client, projects]) => (
        <section key={client} className="mb-8">
          <h2 className="text-xl font-bold">{client}</h2>
          {[...projects.entries()].map(([project, files]) => (
            <div key={project} className="mt-2 rounded-lg border p-4">
              <h3 className="font-semibold">{project}</h3>
              <ul className="mt-2 space-y-2">
                {files.map(f => (
                  <li key={f.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <div className="font-medium">{f.filename}</div>
                    <div className="text-sm text-slate-600">
                      Sector: {f.sector} · Uploaded: {new Date(f.uploadedAt).toLocaleString()}
                    </div>
                    {f.storagePath && (
                      <div className="text-xs text-slate-500 break-all">
                        Path: {f.storagePath}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <div className="mt-6">
        <Link href="/upload" className="text-blue-600 hover:underline">← Back to sectors</Link>
      </div>
    </main>
  );
}