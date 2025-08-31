import Link from "next/link";
import PageId from "../../components/PageId";

export default function UtilitiesSector() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 relative">
      <DevLabel id="P2-U" position="top-right" />
      <h1 className="text-3xl font-bold">Utilities</h1>
      <p className="text-slate-600 mt-2">WRc SRM standards.</p>
      <div className="mt-6 flex gap-4">
        <Link href="/sectors" className="text-primary underline">← Back to Sectors (P2)</Link>
        <Link href="/" className="text-primary underline">Home (P1)</Link>
      </div>
    </main>
  );
}
