import Link from "next/link";

const sectors = [
  { code: "S1", label: "Potable Water" },
  { code: "S2", label: "Wastewater" },
  { code: "S3", label: "Stormwater" },
  { code: "S4", label: "Roads" },
  { code: "S5", label: "Parks" },
  { code: "S6", label: "Other" },
];

export default function SectorsPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">P2 · Sector Standards</h1>
      <p className="mb-4 text-gray-600">
        Pick a sector below. You’ll go to P3 (Upload Report) with the sector preselected.
      </p>
      <ul className="space-y-2">
        {sectors.map((s) => (
          <li key={s.code}>
            <Link
              href={`/upload?sector=${encodeURIComponent(s.label)}`}
              className="block rounded border px-4 py-2 hover:bg-gray-50"
            >
              <span className="mr-2 font-mono">{s.code}</span>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}