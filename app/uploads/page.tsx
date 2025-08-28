// Server component
import { getUploadsWithRelations } from '@/db/queries';

export const dynamic = 'force-dynamic';

export default async function UploadsListPage() {
  const uploads = await getUploadsWithRelations();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Uploaded Reports</h1>
        <a
          href="/upload"
          className="rounded bg-blue-600 px-4 py-2 text-white font-medium"
        >
          New Upload
        </a>
      </div>

      {uploads.length === 0 ? (
        <p className="text-sm text-gray-600">
          No uploads yet. <a href="/upload" className="text-blue-600 underline">Upload one</a> to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full whitespace-nowrap text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.sector}</td>
                  <td className="px-4 py-3">{u.filename}</td>
                  <td className="px-4 py-3">
                    {u.project ? `${u.project.name ?? '(unnamed)'} (#${u.project.id})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.client ? `${u.client.name ?? '(unnamed)'} (#${u.client.id})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.uploadedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}