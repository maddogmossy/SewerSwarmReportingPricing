import Link from "next/link";

const Card = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
  <Link
    href={href}
    className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition block"
  >
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-gray-600 mt-2">{desc}</p>
  </Link>
);

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sewer Swarm — Reporting & Pricing</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* C1 -> P2 */}
        <Card href="/sectors" title="C1 · Sector Standards" desc="Open S1–S6 sectors." />
        {/* C2 -> P3 */}
        <Card href="/upload" title="C2 · Upload Report" desc="Upload a report (P3)." />
        {/* C3 (placeholder) */}
        <Card href="#" title="C3 · Coming Soon" desc="Placeholder card." />
        {/* C4 (placeholder) */}
        <Card href="#" title="C4 · Coming Soon" desc="Placeholder card." />
        {/* C5 -> P4 */}
        <Card href="/uploads" title="C5 · Uploaded Reports" desc="Browse uploaded reports (P4)." />
      </div>
    </main>
  );
}