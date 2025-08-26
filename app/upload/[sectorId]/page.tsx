// app/upload/[sector]/page.tsx
import { DevLabel, CardId } from "@/components/PageId";
import { notFound } from "next/navigation";
import { NAME_BY_SECTOR, STANDARD_BY_SECTOR } from "@/lib/standards";

type Params = { sector: string };

export default function UploadFormPage({ params }: { params: Params }) {
  const sectorParam = (params.sector || "").toUpperCase();
  if (!["S1","S2","S3","S4","S5","S6","S7","S8"].includes(sectorParam)) {
    return notFound();
  }

  const sectorName = NAME_BY_SECTOR[sectorParam as keyof typeof NAME_BY_SECTOR];
  const standardKey = STANDARD_BY_SECTOR[sectorParam as keyof typeof STANDARD_BY_SECTOR];

  // NOTE:
  // - `standardKey` is the bit your API/workers will use to decide which rules to apply.
  // - When you wire this up, post `sector` + `standard` with the files.
  // - For now this form is a placeholder; the submit just points to a TODO route.

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DevLabel id={`P2-${sectorParam}`} />
      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C2-Form" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Upload — {sectorName} ({sectorParam})
        </h1>
        <p className="mt-2 text-slate-600">
          Standard to apply: <span className="font-semibold">{standardKey}</span>
        </p>

        <form
          className="mt-6 space-y-4"
          action={`/__todo/ingest`} // replace with your API route later
          method="post"
          encType="multipart/form-data"
        >
          {/* carry sector + standard forward */}
          <input type="hidden" name="sector" value={sectorParam} />
          <input type="hidden" name="standard" value={standardKey} />

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Select files
            </label>
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              type="file"
              name="files"
              multiple
              accept=".pdf,.db,.db3,application/pdf"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              PDF (≤ 50MB) or .db/.db3 (≤ 50MB)
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Upload & Continue
          </button>
        </form>
      </section>
    </main>
  );
}