import Link from "next/link";

const sectors = [
  { id: "S1", name: "Sector 1" },
  { id: "S2", name: "Sector 2" },
  { id: "S3", name: "Sector 3" },
  { id: "S4", name: "Sector 4" },
  { id: "S5", name: "Sector 5" },
  { id: "S6", name: "Sector 6" },
];

export default function SectorsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">P2 · Sectors</h1>
      <ul className="space-y-2">
        {sectors.map(s => (
          <li key={s.id} className="rounded border bg-white p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-500">{s.id}</div>
            </div>
            <Link className="text-blue-600 underline" href="/upload">Upload (P3)</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}