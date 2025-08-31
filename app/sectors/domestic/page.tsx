import Link from "next/link";
import PageId from "../../components/ui/PageId";

export default function DomesticSector() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 relative">
      <DevLabel id="P2-D" position="top-right" />
      <h1 className="text-3xl font-bold">Domestic</h1>
      <p className="text-slate-600 mt-2">Regulatory compliance.</p>
      <div className="mt-6 flex gap-4">
        <Link href="/sectors" className="text-primary underline">← Back to Sectors (P2)</Link>
        <Link href="/" className="text-primary underline">Home (P1)</Link>
      </div>
    </main>
  );
}
