import Link from "next/link";

const sectorMeta: Record<string, { title: string; standards: string; code: string }> = {
  utilities:   { title: "Utilities",   standards: "WRc SRM standards",  code: "S1" },
  adoption:    { title: "Adoption",    standards: "SFA8 compliance",    code: "S2" },
  highways:    { title: "Highways",    standards: "DMRB standards",     code: "S3" },
  domestic:    { title: "Domestic",    standards: "Regulatory compliance", code: "S4" },
  insurance:   { title: "Insurance",   standards: "ABI guidelines",     code: "S5" },
  construction:{ title: "Construction",standards: "Building regs",      code: "S6" }
};

export default function UploadFormPage({ params }: { params: { sector: string } }) {
  const meta = sectorMeta[params.sector] ?? { title: params.sector, standards: "", code: "" };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Upload Report — {meta.title}</h1>
          <div className="rounded-md bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">P3</div>
        </div>
        {meta.standards && (
          <p className="mt-2 text-gray-700"><span className="font-semibold">Standards:</span> {meta.standards}</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Upload files</h2>
        <p className="mt-1 text-gray-600">Select a <strong>PDF</strong> or a pair of <strong>.db/.db3</strong> files (max 50MB).</p>

        <form
          className="mt-4 space-y-4"
          action={`/api/upload?sector=${encodeURIComponent(params.sector)}`}
          method="POST"
          encType="multipart/form-data"
        >
          <input type="hidden" name="sector" value={params.sector} />
          <input
            type="file"
            name="files"
            multiple
            accept=".pdf,.db,.db3,application/pdf,application/x-sqlite3"
            className="block w-full rounded-lg border border-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upload
          </button>
        </form>

        <div className="mt-6 flex items-center gap-6">
          <Link href="/uploads" className="text-indigo-700 underline underline-offset-4">→ View uploaded reports</Link>
          <Link href="/upload" className="text-gray-700 underline underline-offset-4">← Back to sectors</Link>
        </div>
      </section>
    </main>
  );
}
